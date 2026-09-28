import { createHash, randomBytes } from "node:crypto";
import {
  checkShowtimeCollision,
  type CollisionResult,
  type ShowtimeLike,
} from "@/lib/showtimeCollision";
import { MOCK_SHOWTIMES, MOCK_MOVIES } from "@/lib/mockData";
import { getKvConfig, kvCommand, type KvConfig } from "@/lib/kvRest";

/**
 * CineMax AI - Showtime Store Adapter
 *
 * - Một logic nghiệp vụ duy nhất (KvShowtimeStore) chạy trên 2 backend KV:
 *     + Upstash Redis qua REST (không cần thêm dependency) -> dùng được trên Vercel
 *     + Memory (chỉ phù hợp dev/test: KHÔNG chia sẻ giữa các instance serverless)
 * - Việc "kiểm tra va chạm rồi ghi" được bao trong khóa theo từng phòng chiếu,
 *   nên hai request đồng thời vào cùng một phòng không thể cùng qua kiểm tra.
 * - Engine va chạm (showtimeCollision.ts) vẫn là nguồn sự thật duy nhất.
 *
 * Biến môi trường (chọn một cặp):
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   KV_REST_API_URL        + KV_REST_API_TOKEN          (tên do Vercel KV/Marketplace cấp)
 */

/* -------------------------------------------------------------------------- */
/*  Types công khai                                                           */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CINEMA_ID = "beta-cinemas-xuan-thuy";

export interface StoredShowtime extends ShowtimeLike {
  id: string;
  cinemaId: string;
  movieId: string;
  movieTitle: string;
  format: string;
  createdAt: string;
}

export type NewShowtimeInput = Omit<StoredShowtime, "id" | "createdAt">;

export interface ShowtimeFilter {
  date?: string;
  cinemaId?: string;
  movieId?: string;
}

export type CreateShowtimeResult =
  | { outcome: "created"; showtime: StoredShowtime }
  | { outcome: "invalid"; result: CollisionResult }
  | { outcome: "conflict"; result: CollisionResult };

export interface ShowtimeStore {
  readonly name: "redis" | "memory";
  /** false = dữ liệu mất khi instance khởi động lại / không chia sẻ giữa các lambda. */
  readonly persistent: boolean;
  list(filter?: ShowtimeFilter): Promise<StoredShowtime[]>;
  getById(id: string): Promise<StoredShowtime | null>;
  createChecked(input: NewShowtimeInput): Promise<CreateShowtimeResult>;
}

/** Không lấy được khóa phòng trong thời gian chờ: route nên trả 503 + Retry-After. */
export class StoreBusyError extends Error {
  constructor() {
    super("Hệ thống đang xử lý một thay đổi khác cho phòng chiếu này.");
    this.name = "StoreBusyError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Chuẩn hóa tên phòng                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Chuẩn hóa để "Phòng  Beta 03" và "phòng beta 03" là một phòng, và chuỗi tiếng Việt
 * dạng tổ hợp (NFD) khớp với dạng dựng sẵn (NFC). Lưu ý: "Phòng Beta 03" và
 * "Phòng Beta 03 (Standard)" vẫn là hai phòng khác nhau, cần danh mục phòng (roomId) để chặn.
 */
export function normalizeRoomName(name: string): string {
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/*  Lớp KV tối giản                                                           */
/* -------------------------------------------------------------------------- */

interface KV {
  readonly name: "redis" | "memory";
  readonly persistent: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  mget(keys: string[]): Promise<Array<string | null>>;
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* --- Memory ---------------------------------------------------------------- */

class MemoryKV implements KV {
  readonly name = "memory" as const;
  readonly persistent = false;
  private readonly strings = new Map<string, string>();
  private readonly sets = new Map<string, Set<string>>();
  private readonly tails = new Map<string, Promise<void>>();

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.strings.set(key, value);
  }

  async sadd(key: string, member: string): Promise<void> {
    let members = this.sets.get(key);
    if (!members) {
      members = new Set<string>();
      this.sets.set(key, members);
    }
    members.add(member);
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async mget(keys: string[]): Promise<Array<string | null>> {
    return keys.map((key) => this.strings.get(key) ?? null);
  }

  /** Mutex theo khóa bằng chuỗi promise: các lời gọi cùng khóa chạy lần lượt. */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => gate);
    this.tails.set(key, tail);

    await previous;
    try {
      return await fn();
    } finally {
      release();
      if (this.tails.get(key) === tail) this.tails.delete(key);
    }
  }
}

/* --- Upstash Redis (REST) ------------------------------------------------- */

const LOCK_TTL_MS = 8_000;
const LOCK_RETRY_MS = 120;
const LOCK_MAX_ATTEMPTS = 40; // ~5 giây chờ tối đa

// Chỉ xóa khóa nếu vẫn còn là của mình (tránh xóa nhầm khóa của request khác sau khi hết TTL).
const RELEASE_LOCK_LUA =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

class UpstashKV implements KV {
  readonly name = "redis" as const;
  readonly persistent = true;
  private readonly config: KvConfig;

  constructor(config: KvConfig) {
    this.config = config;
  }

  private async run(args: string[], options?: { idempotent?: boolean }): Promise<unknown> {
    return kvCommand(this.config, args, options);
  }

  async get(key: string): Promise<string | null> {
    const result = await this.run(["GET", key], { idempotent: true });
    return typeof result === "string" ? result : null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.run(["SET", key, value]);
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.run(["SADD", key, member], { idempotent: true });
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.run(["SMEMBERS", key], { idempotent: true });
    return Array.isArray(result) ? result.filter((item): item is string => typeof item === "string") : [];
  }

  async mget(keys: string[]): Promise<Array<string | null>> {
    if (keys.length === 0) return [];
    const result = await this.run(["MGET", ...keys], { idempotent: true });
    if (!Array.isArray(result)) return keys.map(() => null);
    return keys.map((_, index) => (typeof result[index] === "string" ? (result[index] as string) : null));
  }

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `${key}:lock`;
    const owner = randomBytes(12).toString("hex");

    let acquired = false;
    for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt++) {
      const result = await this.run(["SET", lockKey, owner, "NX", "PX", String(LOCK_TTL_MS)]);
      if (result === "OK") {
        acquired = true;
        break;
      }
      await sleep(LOCK_RETRY_MS);
    }
    if (!acquired) throw new StoreBusyError();

    try {
      return await fn();
    } finally {
      try {
        await this.run(["EVAL", RELEASE_LOCK_LUA, "1", lockKey, owner]);
      } catch (error) {
        // Khóa sẽ tự hết hạn theo TTL, nên chỉ cảnh báo.
        console.warn("[showtimeStore] Không nhả được khóa, chờ TTL tự hết hạn:", error);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Logic nghiệp vụ dùng chung                                                */
/* -------------------------------------------------------------------------- */

const KEY_PREFIX = "cinemax:showtimes";
const ROOM_INDEX_KEY = `${KEY_PREFIX}:rooms`;
const RETENTION_DAYS = 14;

function roomBucketKey(cinemaId: string, roomName: string): string {
  const identity = `${cinemaId}|${normalizeRoomName(roomName).toLowerCase()}`;
  return `${KEY_PREFIX}:room:${createHash("sha1").update(identity).digest("hex").slice(0, 20)}`;
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD, không phụ thuộc múi giờ máy chủ. */
function todayInVietnam(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function isStoredShowtime(value: unknown): value is StoredShowtime {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.cinemaId === "string" &&
    typeof record.movieId === "string" &&
    typeof record.movieTitle === "string" &&
    typeof record.format === "string" &&
    typeof record.roomName === "string" &&
    typeof record.date === "string" &&
    typeof record.time === "string" &&
    typeof record.durationMinutes === "number" &&
    typeof record.createdAt === "string"
  );
}

/** Ném lỗi nếu JSON hỏng để đường ghi không âm thầm ghi đè mất dữ liệu. */
function parseRoomShowtimes(raw: string | null): StoredShowtime[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Dữ liệu phòng chiếu không phải mảng.");
  return data.filter(isStoredShowtime);
}

class KvShowtimeStore implements ShowtimeStore {
  readonly name: "redis" | "memory";
  readonly persistent: boolean;
  private readonly kv: KV;

  constructor(kv: KV) {
    this.kv = kv;
    this.name = kv.name;
    this.persistent = kv.persistent;
  }

  async list(filter: ShowtimeFilter = {}): Promise<StoredShowtime[]> {
    let buckets = await this.kv.smembers(ROOM_INDEX_KEY);
    
    // Tự động nạp dữ liệu từ MOCK_SHOWTIMES nếu kho hoàn toàn rỗng
    if (buckets.length === 0) {
      for (const st of MOCK_SHOWTIMES) {
        const movie = MOCK_MOVIES.find((m) => String(m.id) === String(st.movieId));
        const dur = movie?.durationMinutes ?? 120;
        const roomName = normalizeRoomName(st.roomName);
        const bucket = roomBucketKey(st.cinemaId, roomName);
        const stored: StoredShowtime = {
          id: st.id,
          cinemaId: st.cinemaId,
          movieId: String(st.movieId),
          movieTitle: movie?.title ?? `Phim #${st.movieId}`,
          format: st.format,
          roomName,
          date: st.date,
          time: st.time,
          durationMinutes: dur,
          createdAt: new Date().toISOString(),
        };
        await this.kv.sadd(ROOM_INDEX_KEY, bucket);
        const existing = parseRoomShowtimes(await this.kv.get(bucket));
        existing.push(stored);
        await this.kv.set(bucket, JSON.stringify(existing));
      }
      buckets = await this.kv.smembers(ROOM_INDEX_KEY);
      if (buckets.length === 0) return [];
    }

    const raws = await this.kv.mget(buckets);
    const all: StoredShowtime[] = [];
    raws.forEach((raw, index) => {
      try {
        all.push(...parseRoomShowtimes(raw));
      } catch (error) {
        // Một phòng hỏng dữ liệu không được làm sập cả danh sách suất chiếu.
        console.error(`[showtimeStore] Bỏ qua phòng lỗi dữ liệu (${buckets[index]}):`, error);
      }
    });

    return all
      .filter((s) => (filter.date ? s.date === filter.date : true))
      .filter((s) => (filter.cinemaId ? s.cinemaId === filter.cinemaId : true))
      .filter((s) => (filter.movieId ? s.movieId === filter.movieId : true))
      .sort((a, b) => compare(a.date, b.date) || compare(a.time, b.time) || compare(a.roomName, b.roomName));
  }

  async getById(id: string): Promise<StoredShowtime | null> {
    const all = await this.list();
    return all.find((s) => s.id === id) ?? null;
  }

  async createChecked(input: NewShowtimeInput): Promise<CreateShowtimeResult> {
    const roomName = normalizeRoomName(input.roomName);
    const bucket = roomBucketKey(input.cinemaId, roomName);

    return this.kv.withLock<CreateShowtimeResult>(bucket, async () => {
      const existing = parseRoomShowtimes(await this.kv.get(bucket));

      const candidate: ShowtimeLike = {
        cinemaId: input.cinemaId,
        roomName,
        date: input.date,
        time: input.time,
        durationMinutes: input.durationMinutes,
        movieTitle: input.movieTitle,
      };

      const result = checkShowtimeCollision(candidate, existing);
      if (!result.valid) return { outcome: "invalid", result };
      if (!result.ok) return { outcome: "conflict", result };

      const showtime: StoredShowtime = {
        ...input,
        roomName,
        id: `st-${randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
      };

      // Dọn suất quá cũ để mảng của phòng không phình mãi.
      const cutoff = shiftDate(todayInVietnam(), -RETENTION_DAYS);
      const kept = existing.filter((s) => s.date >= cutoff);
      kept.push(showtime);

      await this.kv.sadd(ROOM_INDEX_KEY, bucket);
      await this.kv.set(bucket, JSON.stringify(kept));

      return { outcome: "created", showtime };
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory (singleton, sống sót qua HMR)                                     */
/* -------------------------------------------------------------------------- */

const globalRef = globalThis as unknown as {
  __cinemaxMemoryKV?: MemoryKV;
  __cinemaxShowtimeStore?: ShowtimeStore;
};

function resolveKV(): KV {
  const config = getKvConfig();
  if (config) return new UpstashKV(config);

  if (!globalRef.__cinemaxMemoryKV) globalRef.__cinemaxMemoryKV = new MemoryKV();
  return globalRef.__cinemaxMemoryKV;
}

export function getShowtimeStore(): ShowtimeStore {
  if (!globalRef.__cinemaxShowtimeStore) {
    globalRef.__cinemaxShowtimeStore = new KvShowtimeStore(resolveKV());
  }
  return globalRef.__cinemaxShowtimeStore;
}
