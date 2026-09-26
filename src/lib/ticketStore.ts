import { createHmac, timingSafeEqual } from "node:crypto";
import type { BookingInfo } from "@/types";

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

export type TicketStatus = "valid" | "used";

export interface TicketRecord extends BookingInfo {
  status: TicketStatus;
  usedAt?: string;
  scannedBy?: string;
}

export type CreateTicketInput = BookingInfo;

export type CreateOutcome =
  | { outcome: "created"; ticket: TicketRecord }
  | { outcome: "already_exists"; ticket: TicketRecord };

export type CheckInOutcome =
  | { outcome: "checked_in"; ticket: TicketRecord }
  | { outcome: "already_used"; ticket: TicketRecord }
  | { outcome: "not_found" };

export interface TicketStoreAdapter {
  readonly name: "memory" | "vercel-kv";
  create(input: CreateTicketInput): Promise<CreateOutcome>;
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

  async get(bookingId: string): Promise<TicketRecord | null> {
    return getMemoryMap().get(bookingId) ?? null;
  }

  async markUsed(bookingId: string, scannedBy?: string): Promise<CheckInOutcome> {
    const map = getMemoryMap();
    const ticket = map.get(bookingId);
    if (!ticket) return { outcome: "not_found" };
    if (ticket.status === "used") return { outcome: "already_used", ticket };

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

interface KvConfig {
  readonly url: string;
  readonly token: string;
}

function getKvConfig(): KvConfig | null {
  const url = (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

interface UpstashResponse {
  result: unknown;
  error?: string;
}

function isUpstashResponse(value: unknown): value is UpstashResponse {
  return typeof value === "object" && value !== null && "result" in value;
}

/** Gọi Upstash REST bằng cú pháp "command trong body" — an toàn cho giá trị JSON dài. */
async function kvCommand(config: KvConfig, command: readonly string[]): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash REST trả về HTTP ${response.status}`);

  const json: unknown = await response.json();
  if (!isUpstashResponse(json)) throw new Error("Phản hồi Upstash không đúng định dạng");
  if (json.error) throw new Error(`Upstash báo lỗi lệnh: ${json.error}`);
  return json.result;
}

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

  const adminSecret = process.env.ADMIN_SYNC_SECRET?.trim();
  if (adminSecret) return adminSecret;

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

/* -------------------------------------------------------------------------- */
/*  Validate dữ liệu vé từ client (endpoint POST /api/tickets chưa có auth,   */
/*  vì Goal 2 chỉ là giả lập thanh toán, chưa có cổng thanh toán thật)        */
/* -------------------------------------------------------------------------- */

const MAX_FIELD_LENGTH = 200;
const MAX_ID_LENGTH = 100;
const MAX_SEATS = 20;
const MAX_SEAT_LENGTH = 10;

function readTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.length <= maxLength ? trimmed : null;
}

export function validateBookingInput(raw: unknown): CreateTicketInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const bookingId = readTrimmedString(record.bookingId, MAX_ID_LENGTH);
  const movieTitle = readTrimmedString(record.movieTitle, MAX_FIELD_LENGTH);
  const cinemaName = readTrimmedString(record.cinemaName, MAX_FIELD_LENGTH);
  const roomName = readTrimmedString(record.roomName, 50);
  const format = readTrimmedString(record.format, 50);
  const showDate = readTrimmedString(record.showDate, 20);
  const showTime = readTrimmedString(record.showTime, 20);
  const customerName = readTrimmedString(record.customerName, MAX_FIELD_LENGTH);
  const customerEmail = readTrimmedString(record.customerEmail, MAX_FIELD_LENGTH);
  const customerPhone = readTrimmedString(record.customerPhone, 30);
  const posterPath = typeof record.posterPath === "string" ? record.posterPath.slice(0, 500) : "";
  const createdAt = readTrimmedString(record.createdAt, 40) ?? new Date().toISOString();

  const seats = Array.isArray(record.seats)
    ? record.seats.filter(
        (seat): seat is string => typeof seat === "string" && seat.length > 0 && seat.length <= MAX_SEAT_LENGTH,
      ).slice(0, MAX_SEATS)
    : null;

  const totalAmount =
    typeof record.totalAmount === "number" && Number.isFinite(record.totalAmount) && record.totalAmount >= 0
      ? record.totalAmount
      : null;

  const bookingIdPattern = /^[A-Za-z0-9_-]+$/;
  if (
    !bookingId ||
    !bookingIdPattern.test(bookingId) ||
    !movieTitle ||
    !cinemaName ||
    !roomName ||
    !format ||
    !showDate ||
    !showTime ||
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !seats ||
    seats.length === 0 ||
    totalAmount === null
  ) {
    return null;
  }

  return {
    bookingId,
    movieTitle,
    posterPath,
    cinemaName,
    roomName,
    format,
    showDate,
    showTime,
    seats,
    totalAmount,
    customerName,
    customerEmail,
    customerPhone,
    createdAt,
  };
}
