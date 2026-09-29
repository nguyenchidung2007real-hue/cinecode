import { createHmac, timingSafeEqual } from "node:crypto";
import type { BookingInfo } from "@/types";
import { getKvConfig, kvCommand, type KvConfig } from "@/lib/kvRest";

/**
 * CineMax AI - Ticket store & anti-fraud check-in (module chống gian lận vé kép)
 *
 * Nguyên tắc: trạng thái "đã dùng" của vé phải nằm ở MỘT nơi dùng chung cho mọi thiết bị
 * (điện thoại khách, máy quét nhân viên ở cửa 1, cửa 2...). localStorage trên từng máy
 * không làm được việc này.
 *
 * Hai chế độ, chọn tự động theo biến môi trường (Adapter Pattern):
 *  - Có KV_REST_API_URL/TOKEN (Vercel KV) hoặc UPSTASH_REDIS_REST_URL/TOKEN (Upstash trực tiếp):
 *    dùng Redis qua REST API (không cần cài thêm package, cùng phong cách với hfRagService.ts).
 *  - Không có: dùng Map trong bộ nhớ. CHỈ đáng tin cho local dev / demo một instance.
 *    ⚠️ Trên Vercel production (nhiều serverless instance, bộ nhớ mất khi cold start),
 *    chế độ này KHÔNG chống được vé dùng hai lần một cách đáng tin cậy. Xem cảnh báo log.
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type TicketStatus = "valid" | "used" | "pending" | "void";

export interface TicketRecord extends BookingInfo {
  status: TicketStatus;
  usedAt?: string;
  scannedBy?: string;
  voidReason?: string;
}

export type CreateTicketInput = BookingInfo;

export type CreateOutcome =
  | { outcome: "created"; ticket: TicketRecord }
  | { outcome: "already_exists"; ticket: TicketRecord };

export type CheckInOutcome =
  | { outcome: "checked_in"; ticket: TicketRecord }
  | { outcome: "already_used"; ticket: TicketRecord }
  | { outcome: "invalid_status"; status: TicketStatus; ticket: TicketRecord }
  | { outcome: "not_found" };

export interface TicketStoreAdapter {
  readonly name: "memory" | "vercel-kv";
  create(input: CreateTicketInput): Promise<CreateOutcome>;
  createPending(input: CreateTicketInput): Promise<CreateOutcome>;
  promotePendingToValid(bookingId: string): Promise<TicketRecord | null>;
  voidTicket(bookingId: string, reason?: string): Promise<TicketRecord | null>;
  get(bookingId: string): Promise<TicketRecord | null>;
  markUsed(bookingId: string, scannedBy?: string): Promise<CheckInOutcome>;
}

/* -------------------------------------------------------------------------- */
/*  Chế độ 1: In-memory (zero-config, chỉ dùng cho dev/demo)                  */
/* -------------------------------------------------------------------------- */

const globalRef = globalThis as typeof globalThis & {
  __cinemaxTicketMemoryStore?: Map<string, TicketRecord>;
};

function getMemoryMap(): Map<string, TicketRecord> {
  if (!globalRef.__cinemaxTicketMemoryStore) globalRef.__cinemaxTicketMemoryStore = new Map();
  return globalRef.__cinemaxTicketMemoryStore;
}

/**
 * An toàn với truy cập đồng thời TRONG một process Node: mỗi thao tác đọc-rồi-ghi ở đây
 * không có `await` xen giữa, nên vòng lặp sự kiện không thể chen ngang giữa hai request.
 * (Đây không phải là an toàn đa-instance — xem cảnh báo ở getTicketStore().)
 */
class MemoryTicketStore implements TicketStoreAdapter {
  readonly name = "memory" as const;

  async create(input: CreateTicketInput): Promise<CreateOutcome> {
    const map = getMemoryMap();
    const existing = map.get(input.bookingId);
    if (existing) return { outcome: "already_exists", ticket: existing };

    const ticket: TicketRecord = { ...input, status: "valid" };
    map.set(input.bookingId, ticket);
    return { outcome: "created", ticket };
  }

  async createPending(input: CreateTicketInput): Promise<CreateOutcome> {
    const map = getMemoryMap();
    const existing = map.get(input.bookingId);
    if (existing) return { outcome: "already_exists", ticket: existing };

    const ticket: TicketRecord = { ...input, status: "pending" };
    map.set(input.bookingId, ticket);
    return { outcome: "created", ticket };
  }

  async promotePendingToValid(bookingId: string): Promise<TicketRecord | null> {
    const map = getMemoryMap();
    const ticket = map.get(bookingId);
    if (!ticket) return null;
    if (ticket.status === "valid" || ticket.status === "used") return ticket;
    if (ticket.status === "void") return null;

    const updated: TicketRecord = { ...ticket, status: "valid" };
    map.set(bookingId, updated);
    return updated;
  }

  async voidTicket(bookingId: string, reason?: string): Promise<TicketRecord | null> {
    const map = getMemoryMap();
    const ticket = map.get(bookingId);
    if (!ticket) return null;

    const updated: TicketRecord = { ...ticket, status: "void", voidReason: reason };
    map.set(bookingId, updated);
    return updated;
  }

  async get(bookingId: string): Promise<TicketRecord | null> {
    return getMemoryMap().get(bookingId) ?? null;
  }

  async markUsed(bookingId: string, scannedBy?: string): Promise<CheckInOutcome> {
    const map = getMemoryMap();
    const ticket = map.get(bookingId);
    if (!ticket) return { outcome: "not_found" };
    if (ticket.status === "used") return { outcome: "already_used", ticket };
    if (ticket.status !== "valid") {
      return { outcome: "invalid_status", status: ticket.status, ticket };
    }

    const updated: TicketRecord = {
      ...ticket,
      status: "used",
      usedAt: new Date().toISOString(),
      ...(scannedBy ? { scannedBy } : {}),
    };
    map.set(bookingId, updated);
    return { outcome: "checked_in", ticket: updated };
  }
}

/* -------------------------------------------------------------------------- */
/*  Chế độ 2: Vercel KV / Upstash Redis qua REST API (không cần thêm package)  */
/* -------------------------------------------------------------------------- */



const TICKET_KEY_PREFIX = "cinemax:ticket:";
const USED_KEY_PREFIX = "cinemax:ticket:used:";

/** Giá trị khóa "used" mã hoá cả thời điểm và người soát, tách rời khỏi bản ghi vé gốc. */
function encodeUsedValue(isoTime: string, scannedBy?: string): string {
  return `${isoTime}|${scannedBy ?? ""}`;
}

function decodeUsedValue(raw: string): { usedAt: string; scannedBy?: string } {
  const separatorIndex = raw.indexOf("|");
  const usedAt = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const scannedBy = separatorIndex === -1 ? "" : raw.slice(separatorIndex + 1);
  return scannedBy === "" ? { usedAt } : { usedAt, scannedBy };
}

class VercelKvTicketStore implements TicketStoreAdapter {
  readonly name = "vercel-kv" as const;
  private readonly config: KvConfig;

  constructor(config: KvConfig) {
    this.config = config;
  }

  async create(input: CreateTicketInput): Promise<CreateOutcome> {
    const key = TICKET_KEY_PREFIX + input.bookingId;
    const ticket: TicketRecord = { ...input, status: "valid" };

    // SET ... NX: chỉ ghi nếu key CHƯA tồn tại → nguyên tử, không đè vé cũ khi client gọi lại.
    const setResult = await kvCommand(this.config, ["SET", key, JSON.stringify(ticket), "NX"]);
    if (setResult === "OK") return { outcome: "created", ticket };

    const existing = await this.get(input.bookingId);
    if (existing) return { outcome: "already_exists", ticket: existing };
    // Hiếm gặp: NX báo đã tồn tại nhưng GET lại null (dữ liệu vừa hết hạn) → thử tạo lại.
    return this.create(input);
  }

  async createPending(input: CreateTicketInput): Promise<CreateOutcome> {
    const key = TICKET_KEY_PREFIX + input.bookingId;
    const ticket: TicketRecord = { ...input, status: "pending" };

    const setResult = await kvCommand(this.config, ["SET", key, JSON.stringify(ticket), "NX"]);
    if (setResult === "OK") return { outcome: "created", ticket };

    const existing = await this.get(input.bookingId);
    if (existing) return { outcome: "already_exists", ticket: existing };
    return this.createPending(input);
  }

  async promotePendingToValid(bookingId: string): Promise<TicketRecord | null> {
    const key = TICKET_KEY_PREFIX + bookingId;
    const raw = await kvCommand(this.config, ["GET", key]);
    if (typeof raw !== "string") return null;

    let base: TicketRecord;
    try {
      base = JSON.parse(raw) as TicketRecord;
    } catch {
      return null;
    }

    if (base.status === "valid" || base.status === "used") return base;
    if (base.status === "void") return null;

    const updated: TicketRecord = { ...base, status: "valid" };
    await kvCommand(this.config, ["SET", key, JSON.stringify(updated)]);
    return updated;
  }

  async voidTicket(bookingId: string, reason?: string): Promise<TicketRecord | null> {
    const key = TICKET_KEY_PREFIX + bookingId;
    const raw = await kvCommand(this.config, ["GET", key]);
    if (typeof raw !== "string") return null;

    let base: TicketRecord;
    try {
      base = JSON.parse(raw) as TicketRecord;
    } catch {
      return null;
    }

    const updated: TicketRecord = { ...base, status: "void", voidReason: reason };
    await kvCommand(this.config, ["SET", key, JSON.stringify(updated)]);
    return updated;
  }

  async get(bookingId: string): Promise<TicketRecord | null> {
    const raw = await kvCommand(this.config, ["GET", TICKET_KEY_PREFIX + bookingId]);
    if (typeof raw !== "string") return null;

    let base: TicketRecord;
    try {
      base = JSON.parse(raw) as TicketRecord;
    } catch {
      return null;
    }

    const usedRaw = await kvCommand(this.config, ["GET", USED_KEY_PREFIX + bookingId]);
    if (typeof usedRaw !== "string") return base;

    const { usedAt, scannedBy } = decodeUsedValue(usedRaw);
    return { ...base, status: "used", usedAt, ...(scannedBy ? { scannedBy } : {}) };
  }

  async markUsed(bookingId: string, scannedBy?: string): Promise<CheckInOutcome> {
    const ticketRaw = await kvCommand(this.config, ["GET", TICKET_KEY_PREFIX + bookingId]);
    if (typeof ticketRaw !== "string") return { outcome: "not_found" };

    let base: TicketRecord;
    try {
      base = JSON.parse(ticketRaw) as TicketRecord;
    } catch {
      return { outcome: "not_found" };
    }

    // Kiểm tra trạng thái vé: chỉ vé valid mới được check-in
    if (base.status !== "valid") {
      if (base.status === "used") {
        return { outcome: "already_used", ticket: base };
      }
      return { outcome: "invalid_status", status: base.status, ticket: base };
    }

    const isoNow = new Date().toISOString();
    const usedKey = USED_KEY_PREFIX + bookingId;

    // Điểm khóa nguyên tử thật sự: chỉ MỘT lượt gọi "thắng" được phép ghi khóa này,
    // dù hai máy quét bấm cùng lúc ở hai cửa khác nhau.
    const setResult = await kvCommand(this.config, ["SET", usedKey, encodeUsedValue(isoNow, scannedBy), "NX"]);

    if (setResult === "OK") {
      return {
        outcome: "checked_in",
        ticket: { ...base, status: "used", usedAt: isoNow, ...(scannedBy ? { scannedBy } : {}) },
      };
    }

    const existingRaw = await kvCommand(this.config, ["GET", usedKey]);
    const decoded = typeof existingRaw === "string" ? decodeUsedValue(existingRaw) : { usedAt: isoNow };
    return {
      outcome: "already_used",
      ticket: { ...base, status: "used", usedAt: decoded.usedAt, ...(decoded.scannedBy ? { scannedBy: decoded.scannedBy } : {}) },
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Chọn adapter                                                              */
/* -------------------------------------------------------------------------- */

let cachedStore: TicketStoreAdapter | null = null;
let warnedMemoryInProduction = false;

export function getTicketStore(): TicketStoreAdapter {
  if (cachedStore) return cachedStore;

  const kvConfig = getKvConfig();
  if (kvConfig) {
    cachedStore = new VercelKvTicketStore(kvConfig);
    return cachedStore;
  }

  if (process.env.NODE_ENV === "production" && !warnedMemoryInProduction) {
    warnedMemoryInProduction = true;
    console.warn(
      "[ticketStore] Không thấy KV_REST_API_URL/TOKEN (Vercel KV) hay " +
        "UPSTASH_REDIS_REST_URL/TOKEN. Đang chạy chế độ in-memory: mỗi serverless " +
        "instance có bộ nhớ RIÊNG và mất khi cold start, nên KHÔNG chống được vé " +
        "dùng hai lần một cách đáng tin cậy trên production. Chỉ dùng cho dev/demo.",
    );
  }
  cachedStore = new MemoryTicketStore();
  return cachedStore;
}

/** Chỉ dùng trong test: buộc tạo adapter mới ở lần gọi getTicketStore() kế tiếp. */
export function resetTicketStoreForTest(): void {
  cachedStore = null;
  warnedMemoryInProduction = false;
}

/* -------------------------------------------------------------------------- */
/*  Ký & xác thực mã vé (chống giả mạo bookingId)                             */
/* -------------------------------------------------------------------------- */

function getSigningSecret(): string {
  const dedicated = process.env.TICKET_SIGNING_SECRET?.trim();
  if (dedicated) return dedicated;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TICKET_SIGNING_SECRET bắt buộc phải được cấu hình trên production để ký vé an toàn. " +
        "Không dùng ADMIN_SYNC_SECRET làm fallback.",
    );
  }

  // Chỉ dùng khi chạy local chưa cấu hình gì — KHÔNG an toàn nếu để nguyên trên production.
  return "cinemax-dev-insecure-ticket-secret";
}

function signBookingId(bookingId: string): string {
  return createHmac("sha256", getSigningSecret()).update(bookingId).digest("hex").slice(0, 32);
}

/** Chuỗi nhúng vào QR: "<bookingId>.<chữ ký>". Ngắn gọn, đủ để chống đoán/giả mạo ID. */
export function buildTicketToken(bookingId: string): string {
  return `${bookingId}.${signBookingId(bookingId)}`;
}

export function verifyTicketToken(token: string): { valid: boolean; bookingId: string | null } {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return { valid: false, bookingId: null };

  const bookingId = token.slice(0, separatorIndex);
  const providedSig = token.slice(separatorIndex + 1);
  const expectedSig = signBookingId(bookingId);

  let providedBuffer: Buffer;
  let expectedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(providedSig, "hex");
    expectedBuffer = Buffer.from(expectedSig, "hex");
  } catch {
    return { valid: false, bookingId: null };
  }

  const valid =
    providedBuffer.length === expectedBuffer.length &&
    providedBuffer.length > 0 &&
    timingSafeEqual(providedBuffer, expectedBuffer);

  return valid ? { valid: true, bookingId } : { valid: false, bookingId: null };
}

export function ensureSigningSecretConfigured(): void {
  getSigningSecret();
}

