import { randomBytes } from "node:crypto";
import { getKvConfig, kvCommand, type KvConfig } from "@/lib/kvRest";

/**
 * CineMax AI - Seat Hold Engine (Module 3)
 *
 * Vòng đời một ghế của một suất chiếu:
 *
 *      free ──hold (TTL 300s)──▶ held ──commit (sau thanh toán)──▶ sold
 *        ▲                         │
 *        └──── hết TTL / release ──┘
 *
 * Mỗi ghế là MỘT key:  cinemax:{<showtimeId>}:seat:<ghế>   giá trị "H:<holdId>" hoặc "S:<bookingId>"
 *
 * Tính nguyên tử:
 *  - Giữ / chốt / hoàn tác nhiều ghế là "tất cả hoặc không gì cả", thực hiện bằng MỘT script Lua (EVAL)
 *    trên Redis, nên không thể có trạng thái giữa chừng hay hai request xen vào nhau.
 *    Khác với showtimeStore (mutex có chờ), ở đây không có vòng chờ khóa: ai đến trước thắng, người sau nhận 409 ngay.
 *  - Mọi key của một suất chiếu dùng hash-tag {showtimeId} để luôn cùng một slot (an toàn nếu sau này đổi sang Redis Cluster).
 *  - Memory fallback: các đoạn đọc-rồi-ghi không có `await` xen giữa, nên atomic trong một process Node
 *    (chỉ đáng tin cho dev/demo, KHÔNG dùng cho production nhiều instance).
 */

/* -------------------------------------------------------------------------- */
/*  Hằng số & kiểu                                                            */
/* -------------------------------------------------------------------------- */

export const HOLD_TTL_SECONDS = 300;
export const MAX_SEATS_PER_HOLD = 8;
export const HOLD_ID_PATTERN = /^[a-f0-9]{32}$/;
export const SHOWTIME_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function newHoldId(): string {
  return randomBytes(16).toString("hex"); // 128-bit, đóng vai trò bearer secret của phiên giữ ghế
}

export interface HoldRecord {
  holdId: string;
  showtimeId: string;
  seats: string[];
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
}

export type HoldOutcome =
  | { outcome: "held"; hold: HoldRecord }
  | { outcome: "conflict"; seats: string[] };

export type CommitOutcome =
  | { outcome: "committed" }
  | { outcome: "already_committed"; bookingId: string }
  | { outcome: "lost"; seats: string[] };

export type SeatStatus = "free" | "held" | "mine" | "sold";

export interface HoldInput {
  showtimeId: string;
  seats: readonly string[];
  holdId: string;
}

export interface SeatStoreAdapter {
  readonly name: "redis" | "memory";
  readonly persistent: boolean;
  /** Giữ (hoặc đổi tập ghế của) một hold. Cùng holdId gọi lại = làm mới TTL + thay tập ghế. */
  hold(input: HoldInput): Promise<HoldOutcome>;
  /** null nếu không tồn tại hoặc đã hết hạn. */
  getHold(showtimeId: string, holdId: string): Promise<HoldRecord | null>;
  release(showtimeId: string, holdId: string): Promise<void>;
  /** Chuyển held -> sold nguyên tử. Idempotent theo holdId. */
  commit(hold: HoldRecord, bookingId: string, soldTtlSeconds: number): Promise<CommitOutcome>;
  getCommittedBookingId(showtimeId: string, holdId: string): Promise<string | null>;
  /** Hoàn tác commit (khi tạo vé thất bại) để ghế không bị "mắc kẹt" ở trạng thái sold. */
  rollbackCommit(hold: HoldRecord, bookingId: string): Promise<void>;
  statuses(showtimeId: string, seats: readonly string[], viewerHoldId?: string): Promise<Record<string, SeatStatus>>;
}

/* -------------------------------------------------------------------------- */
/*  Key & tiện ích dùng chung                                                 */
/* -------------------------------------------------------------------------- */

// showtimeId đã được kiểm tra bằng SHOWTIME_ID_PATTERN ở tầng service nên không chứa "{" "}" ":".
const tag = (showtimeId: string): string => `cinemax:{${showtimeId}}`;
const seatKey = (showtimeId: string, seat: string): string => `${tag(showtimeId)}:seat:${seat}`;
const holdKey = (showtimeId: string, holdId: string): string => `${tag(showtimeId)}:hold:${holdId}`;
const resultKey = (showtimeId: string, holdId: string): string => `${tag(showtimeId)}:result:${holdId}`;

const heldMarker = (holdId: string): string => `H:${holdId}`;
const soldMarker = (bookingId: string): string => `S:${bookingId}`;

function buildRecord(input: HoldInput, previous: HoldRecord | null, now: number): HoldRecord {
  return {
    holdId: input.holdId,
    showtimeId: input.showtimeId,
    seats: [...input.seats],
    createdAt: previous?.createdAt ?? now,
    expiresAt: now + HOLD_TTL_SECONDS * 1000,
  };
}

function parseHold(raw: unknown, now: number): HoldRecord | null {
  if (typeof raw !== "string") return null;
  try {
    const data = JSON.parse(raw) as Partial<HoldRecord>;
    if (
      typeof data.holdId !== "string" ||
      typeof data.showtimeId !== "string" ||
      !Array.isArray(data.seats) ||
      typeof data.createdAt !== "number" ||
      typeof data.expiresAt !== "number"
    ) {
      return null;
    }
    if (data.expiresAt <= now) return null;
    return data as HoldRecord;
  } catch {
    return null;
  }
}

function classify(value: string | null, viewerHoldId?: string): SeatStatus {
  if (value === null) return "free";
  if (value.startsWith("S:")) return "sold";
  if (viewerHoldId && value === heldMarker(viewerHoldId)) return "mine";
  return "held";
}

function seatsFromIndexList(list: string, seats: readonly string[]): string[] {
  return list
    .split(",")
    .map((n) => seats[Number(n) - 1])
    .filter((s): s is string => typeof s === "string");
}

/* -------------------------------------------------------------------------- */
/*  Redis (Upstash REST) — mỗi thao tác đa ghế là một script Lua nguyên tử    */
/* -------------------------------------------------------------------------- */

// KEYS[1]=hold, KEYS[2..]=ghế | ARGV: 1=marker H:<holdId>, 2=ttlMs, 3=JSON bản ghi hold
const HOLD_LUA = [
  "local bad = {}",
  "for i = 2, #KEYS do",
  "  local v = redis.call('GET', KEYS[i])",
  "  if v and v ~= ARGV[1] then bad[#bad + 1] = tostring(i - 1) end",
  "end",
  "if #bad > 0 then return 'CONFLICT:' .. table.concat(bad, ',') end",
  "for i = 2, #KEYS do redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2]) end",
  "redis.call('SET', KEYS[1], ARGV[3], 'PX', ARGV[2])",
  "return 'OK'",
].join("\n");

// KEYS[1]=hold, KEYS[2]=result, KEYS[3..]=ghế | ARGV: 1=marker H:<holdId>, 2=bookingId, 3=sold TTL (giây)
const COMMIT_LUA = [
  "local done = redis.call('GET', KEYS[2])",
  "if done then return 'DONE:' .. done end",
  "local bad = {}",
  "for i = 3, #KEYS do",
  "  if redis.call('GET', KEYS[i]) ~= ARGV[1] then bad[#bad + 1] = tostring(i - 2) end",
  "end",
  "if #bad > 0 then return 'LOST:' .. table.concat(bad, ',') end",
  "for i = 3, #KEYS do redis.call('SET', KEYS[i], 'S:' .. ARGV[2], 'EX', ARGV[3]) end",
  "redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])",
  "redis.call('DEL', KEYS[1])",
  "return 'OK'",
].join("\n");

// KEYS[1]=result, KEYS[2..]=ghế | ARGV[1]=marker S:<bookingId>
const ROLLBACK_LUA = [
  "for i = 2, #KEYS do",
  "  if redis.call('GET', KEYS[i]) == ARGV[1] then redis.call('DEL', KEYS[i]) end",
  "end",
  "redis.call('DEL', KEYS[1])",
  "return 'OK'",
].join("\n");

// KEYS[1..]=ghế | ARGV[1]=marker H:<holdId>  — chỉ xoá ghế còn thuộc về mình
const RELEASE_LUA = [
  "for i = 1, #KEYS do",
  "  if redis.call('GET', KEYS[i]) == ARGV[1] then redis.call('DEL', KEYS[i]) end",
  "end",
  "return 'OK'",
].join("\n");

class RedisSeatStore implements SeatStoreAdapter {
  readonly name = "redis" as const;
  readonly persistent = true;
  private readonly config: KvConfig;

  constructor(config: KvConfig) {
    this.config = config;
  }

  private async evalScript(script: string, keys: string[], args: string[]): Promise<string> {
    const result = await kvCommand(this.config, ["EVAL", script, String(keys.length), ...keys, ...args]);
    if (typeof result !== "string") throw new Error("Script Lua trả về kết quả không hợp lệ");
    return result;
  }

  async hold(input: HoldInput): Promise<HoldOutcome> {
    const now = Date.now();
    const previous = await this.getHold(input.showtimeId, input.holdId);
    const record = buildRecord(input, previous, now);

    const keys = [holdKey(input.showtimeId, input.holdId), ...input.seats.map((s) => seatKey(input.showtimeId, s))];
    const result = await this.evalScript(HOLD_LUA, keys, [
      heldMarker(input.holdId),
      String(HOLD_TTL_SECONDS * 1000),
      JSON.stringify(record),
    ]);

    if (result.startsWith("CONFLICT:")) {
      return { outcome: "conflict", seats: seatsFromIndexList(result.slice("CONFLICT:".length), input.seats) };
    }

    // Đổi lựa chọn ghế: nhả các ghế cũ không còn nằm trong tập mới (chỉ xoá nếu vẫn là của mình).
    if (previous) {
      const dropped = previous.seats.filter((s) => !input.seats.includes(s));
      if (dropped.length > 0) {
        await this.evalScript(
          RELEASE_LUA,
          dropped.map((s) => seatKey(input.showtimeId, s)),
          [heldMarker(input.holdId)],
        );
      }
    }
    return { outcome: "held", hold: record };
  }

  async getHold(showtimeId: string, holdId: string): Promise<HoldRecord | null> {
    return parseHold(await kvCommand(this.config, ["GET", holdKey(showtimeId, holdId)]), Date.now());
  }

  async release(showtimeId: string, holdId: string): Promise<void> {
    const hold = await this.getHold(showtimeId, holdId);
    if (!hold) return;
    await this.evalScript(
      RELEASE_LUA,
      hold.seats.map((s) => seatKey(showtimeId, s)),
      [heldMarker(holdId)],
    );
    await kvCommand(this.config, ["DEL", holdKey(showtimeId, holdId)]);
  }

  async commit(hold: HoldRecord, bookingId: string, soldTtlSeconds: number): Promise<CommitOutcome> {
    const keys = [
      holdKey(hold.showtimeId, hold.holdId),
      resultKey(hold.showtimeId, hold.holdId),
      ...hold.seats.map((s) => seatKey(hold.showtimeId, s)),
    ];
    const result = await this.evalScript(COMMIT_LUA, keys, [
      heldMarker(hold.holdId),
      bookingId,
      String(Math.max(1, Math.floor(soldTtlSeconds))),
    ]);

    if (result === "OK") return { outcome: "committed" };
    if (result.startsWith("DONE:")) return { outcome: "already_committed", bookingId: result.slice("DONE:".length) };
    if (result.startsWith("LOST:")) {
      return { outcome: "lost", seats: seatsFromIndexList(result.slice("LOST:".length), hold.seats) };
    }
    throw new Error(`Kết quả commit không xác định: ${result}`);
  }

  async getCommittedBookingId(showtimeId: string, holdId: string): Promise<string | null> {
    const raw = await kvCommand(this.config, ["GET", resultKey(showtimeId, holdId)]);
    return typeof raw === "string" ? raw : null;
  }

  async rollbackCommit(hold: HoldRecord, bookingId: string): Promise<void> {
    const keys = [
      resultKey(hold.showtimeId, hold.holdId),
      ...hold.seats.map((s) => seatKey(hold.showtimeId, s)),
    ];
    await this.evalScript(ROLLBACK_LUA, keys, [soldMarker(bookingId)]);
  }

  async statuses(
    showtimeId: string,
    seats: readonly string[],
    viewerHoldId?: string,
  ): Promise<Record<string, SeatStatus>> {
    const out: Record<string, SeatStatus> = {};
    if (seats.length === 0) return out;
    const raw = await kvCommand(this.config, ["MGET", ...seats.map((s) => seatKey(showtimeId, s))]);
    const values = Array.isArray(raw) ? raw : [];
    seats.forEach((seat, i) => {
      out[seat] = classify(typeof values[i] === "string" ? (values[i] as string) : null, viewerHoldId);
    });
    return out;
  }
}

/* -------------------------------------------------------------------------- */
/*  Memory (dev/demo) — đồng bộ, không await giữa đọc và ghi                  */
/* -------------------------------------------------------------------------- */

class MemorySeatStore implements SeatStoreAdapter {
  readonly name = "memory" as const;
  readonly persistent = false;
  private readonly data = new Map<string, { value: string; expiresAt: number }>();

  private read(key: string): string | null {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  private write(key: string, value: string, ttlMs: number): void {
    this.data.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  private releaseSeats(showtimeId: string, seats: readonly string[], marker: string): void {
    for (const seat of seats) {
      const key = seatKey(showtimeId, seat);
      if (this.read(key) === marker) this.data.delete(key);
    }
  }

  async hold(input: HoldInput): Promise<HoldOutcome> {
    const now = Date.now();
    const marker = heldMarker(input.holdId);
    const previous = parseHold(this.read(holdKey(input.showtimeId, input.holdId)), now);

    const conflicts = input.seats.filter((seat) => {
      const value = this.read(seatKey(input.showtimeId, seat));
      return value !== null && value !== marker;
    });
    if (conflicts.length > 0) return { outcome: "conflict", seats: conflicts };

    const record = buildRecord(input, previous, now);
    const ttlMs = HOLD_TTL_SECONDS * 1000;
    for (const seat of input.seats) this.write(seatKey(input.showtimeId, seat), marker, ttlMs);
    this.write(holdKey(input.showtimeId, input.holdId), JSON.stringify(record), ttlMs);

    if (previous) {
      this.releaseSeats(
        input.showtimeId,
        previous.seats.filter((s) => !input.seats.includes(s)),
        marker,
      );
    }
    return { outcome: "held", hold: record };
  }

  async getHold(showtimeId: string, holdId: string): Promise<HoldRecord | null> {
    return parseHold(this.read(holdKey(showtimeId, holdId)), Date.now());
  }

  async release(showtimeId: string, holdId: string): Promise<void> {
    const hold = parseHold(this.read(holdKey(showtimeId, holdId)), Date.now());
    if (!hold) return;
    this.releaseSeats(showtimeId, hold.seats, heldMarker(holdId));
    this.data.delete(holdKey(showtimeId, holdId));
  }

  async commit(hold: HoldRecord, bookingId: string, soldTtlSeconds: number): Promise<CommitOutcome> {
    const done = this.read(resultKey(hold.showtimeId, hold.holdId));
    if (done !== null) return { outcome: "already_committed", bookingId: done };

    const marker = heldMarker(hold.holdId);
    const lost = hold.seats.filter((seat) => this.read(seatKey(hold.showtimeId, seat)) !== marker);
    if (lost.length > 0) return { outcome: "lost", seats: lost };

    const ttlMs = Math.max(1, Math.floor(soldTtlSeconds)) * 1000;
    for (const seat of hold.seats) this.write(seatKey(hold.showtimeId, seat), soldMarker(bookingId), ttlMs);
    this.write(resultKey(hold.showtimeId, hold.holdId), bookingId, ttlMs);
    this.data.delete(holdKey(hold.showtimeId, hold.holdId));
    return { outcome: "committed" };
  }

  async getCommittedBookingId(showtimeId: string, holdId: string): Promise<string | null> {
    return this.read(resultKey(showtimeId, holdId));
  }

  async rollbackCommit(hold: HoldRecord, bookingId: string): Promise<void> {
    this.releaseSeats(hold.showtimeId, hold.seats, soldMarker(bookingId));
    this.data.delete(resultKey(hold.showtimeId, hold.holdId));
  }

  async statuses(
    showtimeId: string,
    seats: readonly string[],
    viewerHoldId?: string,
  ): Promise<Record<string, SeatStatus>> {
    const out: Record<string, SeatStatus> = {};
    for (const seat of seats) out[seat] = classify(this.read(seatKey(showtimeId, seat)), viewerHoldId);
    return out;
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory (singleton, sống sót qua HMR)                                     */
/* -------------------------------------------------------------------------- */

const globalRef = globalThis as typeof globalThis & { __cinemaxSeatStore?: SeatStoreAdapter };
let warnedMemoryInProduction = false;

export function getSeatStore(): SeatStoreAdapter {
  if (globalRef.__cinemaxSeatStore) return globalRef.__cinemaxSeatStore;

  const config = getKvConfig();
  if (config) {
    globalRef.__cinemaxSeatStore = new RedisSeatStore(config);
    return globalRef.__cinemaxSeatStore;
  }

  if (process.env.NODE_ENV === "production" && !warnedMemoryInProduction) {
    warnedMemoryInProduction = true;
    console.warn(
      "[seatStore] Không có Redis (KV_REST_API_* / UPSTASH_REDIS_REST_*): đang giữ ghế trong bộ nhớ. " +
        "Trên serverless nhiều instance việc này KHÔNG chống được bán trùng ghế. Chỉ dùng cho dev/demo.",
    );
  }
  globalRef.__cinemaxSeatStore = new MemorySeatStore();
  return globalRef.__cinemaxSeatStore;
}
