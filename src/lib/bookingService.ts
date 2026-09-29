import { createHash } from "node:crypto";
import QRCode from "qrcode";
import type { BookingInfo } from "@/types";
import { buildTicketToken, ensureSigningSecretConfigured, getTicketStore } from "@/lib/ticketStore";
import { DEFAULT_CINEMA_ID, getShowtimeStore, type StoredShowtime } from "@/lib/showtimeStore";
import {
  HOLD_ID_PATTERN,
  HOLD_TTL_SECONDS,
  MAX_SEATS_PER_HOLD,
  SHOWTIME_ID_PATTERN,
  getSeatStore,
  newHoldId,
  type HoldRecord,
} from "@/lib/seatStore";
import { normalizeSeatId } from "@/lib/seatLayout";
import { calculatePrice, type PriceBreakdown } from "@/lib/pricing";
import { safeEqual } from "@/lib/adminAuth";
import { MOCK_CINEMAS } from "@/lib/mockData";

/**
 * CineMax AI - Booking service (Module 3): điều phối giữ ghế -> tính giá -> thanh toán -> chốt ghế -> phát vé.
 * Toàn bộ quyết định nghiệp vụ nằm ở đây, route chỉ làm việc HTTP.
 */

export class BookingError extends Error {
  readonly status: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = "BookingError";
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

/** Danh mục rạp lấy từ mockData & cấu hình mặc định */
const CINEMA_NAMES: Readonly<Record<string, string>> = {
  [DEFAULT_CINEMA_ID]: "Beta Cinemas Xuân Thủy",
  ...Object.fromEntries(MOCK_CINEMAS.map((c) => [c.id, c.name])),
};

const SALES_CUTOFF_MS_AFTER_START = 0; // ngừng bán vé khi suất chiếu bắt đầu
const SOLD_RETENTION_HOURS_AFTER_START = 48;

/* -------------------------------------------------------------------------- */
/*  Validate đầu vào                                                          */
/* -------------------------------------------------------------------------- */

export function parseSeats(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new BookingError(400, "INVALID_SEATS", "Vui lòng chọn ít nhất một ghế.");
  }
  if (raw.length > MAX_SEATS_PER_HOLD) {
    throw new BookingError(400, "TOO_MANY_SEATS", `Mỗi lần chỉ được giữ tối đa ${MAX_SEATS_PER_HOLD} ghế.`);
  }
  const seats = new Set<string>();
  for (const item of raw) {
    const seat = normalizeSeatId(item);
    if (!seat) throw new BookingError(400, "INVALID_SEATS", "Có ghế không tồn tại trong sơ đồ phòng chiếu.");
    seats.add(seat);
  }
  return Array.from(seats).sort();
}

export function parseHoldId(raw: unknown): string {
  if (typeof raw !== "string" || !HOLD_ID_PATTERN.test(raw)) {
    throw new BookingError(400, "INVALID_HOLD", "Mã giữ ghế không hợp lệ.");
  }
  return raw;
}

interface Customer {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?:\+84|84|0)\d{9,10}$/;

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const compact = raw.replace(/[\s.\-()]/g, "");
  return PHONE_PATTERN.test(compact) ? compact : null;
}

function parseCustomer(raw: unknown): Customer {
  const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const phone = normalizePhone(record.phone);

  if (!name || name.length > 200) throw new BookingError(400, "INVALID_CUSTOMER", "Họ tên không hợp lệ.");
  if (!phone) throw new BookingError(400, "INVALID_CUSTOMER", "Số điện thoại không hợp lệ.");
  if (email && (email.length > 200 || !EMAIL_PATTERN.test(email))) {
    throw new BookingError(400, "INVALID_CUSTOMER", "Email không hợp lệ.");
  }
  return { customerName: name, customerEmail: email, customerPhone: phone };
}

/** posterPath chỉ để hiển thị trên vé, không ảnh hưởng tiền/ghế: chỉ nhận đường dẫn tương đối hoặc https. */
function sanitizePosterPath(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (value.length > 300 || value.includes("..")) return "";
  return value.startsWith("/") || value.startsWith("https://") ? value : "";
}

/* -------------------------------------------------------------------------- */
/*  Suất chiếu                                                                */
/* -------------------------------------------------------------------------- */

function showtimeStartMs(showtime: StoredShowtime): number {
  return Date.parse(`${showtime.date}T${showtime.time}:00+07:00`); // giờ chiếu theo múi giờ Việt Nam
}

export async function loadSellableShowtime(rawId: unknown): Promise<StoredShowtime> {
  if (typeof rawId !== "string" || !SHOWTIME_ID_PATTERN.test(rawId)) {
    throw new BookingError(400, "INVALID_SHOWTIME", "Mã suất chiếu không hợp lệ.");
  }
  const showtime = await getShowtimeStore().getById(rawId);
  if (!showtime) throw new BookingError(404, "SHOWTIME_NOT_FOUND", "Suất chiếu không tồn tại.");

  const start = showtimeStartMs(showtime);
  if (!Number.isFinite(start)) {
    throw new BookingError(500, "SHOWTIME_CORRUPT", "Dữ liệu suất chiếu không hợp lệ.");
  }

  // Suất chiếu đã bắt đầu -> chặn đặt vé ở mọi môi trường (kể cả demo có thanh toán giả lập).
  // Chỉ cho phép bỏ qua khi cố ý bật ALLOW_PAST_SHOWTIMES=true trong môi trường test/dev.
  const allowPast = process.env.NODE_ENV !== "production" && process.env.ALLOW_PAST_SHOWTIMES === "true";
  if (!allowPast && Date.now() >= start + SALES_CUTOFF_MS_AFTER_START) {
    throw new BookingError(409, "SHOWTIME_STARTED", "Suất chiếu này đã bắt đầu, không thể đặt thêm.");
  }
  return showtime;
}

/* -------------------------------------------------------------------------- */
/*  Giữ / nhả ghế                                                             */
/* -------------------------------------------------------------------------- */

export interface HoldResult {
  hold: HoldRecord;
  quote: PriceBreakdown;
}

export async function holdSeats(input: {
  showtimeId: unknown;
  seats: unknown;
  holdId?: unknown;
}): Promise<HoldResult> {
  const seats = parseSeats(input.seats);
  const showtime = await loadSellableShowtime(input.showtimeId);
  const holdId = input.holdId === undefined ? newHoldId() : parseHoldId(input.holdId);

  const outcome = await getSeatStore().hold({ showtimeId: showtime.id, seats, holdId });
  if (outcome.outcome === "expired") {
    throw new BookingError(410, "HOLD_EXPIRED", "Thời gian giữ ghế tối đa (15 phút) đã hết. Vui lòng chọn lại ghế.");
  }
  if (outcome.outcome === "conflict") {
    throw new BookingError(409, "SEAT_TAKEN", "Một số ghế vừa được người khác chọn. Vui lòng chọn ghế khác.", {
      seats: outcome.seats,
    });
  }

  const priced = calculatePrice({ format: showtime.format, date: showtime.date, seats, concessions: [] });
  if (!priced.ok) throw new BookingError(500, "PRICING_FAILED", priced.error);
  return { hold: outcome.hold, quote: priced.price };
}

export async function releaseHold(showtimeId: unknown, holdId: unknown): Promise<void> {
  if (typeof showtimeId !== "string" || !SHOWTIME_ID_PATTERN.test(showtimeId)) {
    throw new BookingError(400, "INVALID_SHOWTIME", "Mã suất chiếu không hợp lệ.");
  }
  await getSeatStore().release(showtimeId, parseHoldId(holdId));
}

/* -------------------------------------------------------------------------- */
/*  Chốt đặt vé                                                               */
/* -------------------------------------------------------------------------- */

export interface ChargeContext {
  amount: number;
  currency: string;
  holdId: string;
}
export type ChargeResult = { ok: true; reference: string } | { ok: false; reason: string };

export interface ConfirmInput {
  showtimeId: unknown;
  holdId: unknown;
  seats: unknown; // client gửi để đối chiếu, KHÔNG dùng làm nguồn sự thật (nguồn là bản ghi hold)
  customer: unknown;
  concessions: unknown;
  expectedTotal?: unknown; // chỉ để phát hiện lệch giá và báo lại cho UI; không bao giờ được dùng để tính tiền
  posterPath: unknown;
  /** Bước thanh toán (mô phỏng hoặc cổng thật). Được gọi SAU khi mọi kiểm tra hợp lệ và TRƯỚC khi chốt ghế. */
  charge: (context: ChargeContext) => Promise<ChargeResult>;
  /** Hoàn tiền khi chốt ghế hoặc phát hành vé thất bại sau khi đã thanh toán */
  refund?: (context: { reference: string; amount: number; reason: string }) => Promise<{ ok: boolean }>;
}

export interface ConfirmResult {
  ticket: BookingInfo;
  qrToken: string;
  replayed: boolean;
  storeMode: string;
}

async function buildTicketPayload(ticket: BookingInfo): Promise<{ ticket: BookingInfo; qrToken: string }> {
  const qrToken = buildTicketToken(ticket.bookingId);
  const qrCodeUrl = await QRCode.toDataURL(qrToken, {
    width: 280,
    margin: 2,
    color: { dark: "#0b0c10", light: "#ffffff" },
  });
  return { ticket: { ...ticket, qrToken, qrCodeUrl }, qrToken };
}

/**
 * Sinh mã đặt vé tất định (deterministic) từ holdId bằng hàm băm SHA-256.
 * Đảm bảo 100% tính lũy đẳng (idempotent): cùng một holdId luôn sinh ra duy nhất một bookingId,
 * loại bỏ việc phải duy trì bảng phụ tra cứu holdId -> bookingId.
 */
export function deriveBookingId(holdId: string): string {
  return "bk-" + createHash("sha256").update(holdId).digest("hex").slice(0, 12);
}

export async function confirmBooking(input: ConfirmInput): Promise<ConfirmResult> {
  // 0) Kiểm tra khóa bảo mật ký vé ngay từ đầu: nếu server thiếu secret thì dừng ngay,
  // tuyệt đối không thu tiền khách khi vé không thể ký hợp lệ.
  try {
    ensureSigningSecretConfigured();
  } catch (err) {
    throw new BookingError(500, "CONFIG_ERROR", "Chưa cấu hình khóa bảo mật ký vé an toàn.");
  }

  const holdId = parseHoldId(input.holdId);
  const customer = parseCustomer(input.customer);
  const showtimeId = typeof input.showtimeId === "string" ? input.showtimeId : "";
  if (!SHOWTIME_ID_PATTERN.test(showtimeId)) {
    throw new BookingError(400, "INVALID_SHOWTIME", "Mã suất chiếu không hợp lệ.");
  }

  const seatStore = getSeatStore();
  const ticketStore = getTicketStore();
  const bookingId = deriveBookingId(holdId);

  // 1) Idempotency: request lặp (bấm 2 lần, mạng chập chờn) trả lại đúng vé cũ, không tạo vé mới.
  const previousBookingId = await seatStore.getCommittedBookingId(showtimeId, holdId);
  if (previousBookingId) {
    return replay(previousBookingId, customer.customerPhone);
  }

  // 2) Hold còn hiệu lực và khớp với những gì client tuyên bố.
  const hold = await seatStore.getHold(showtimeId, holdId);
  if (!hold) {
    throw new BookingError(410, "HOLD_EXPIRED", "Thời gian giữ ghế đã hết. Vui lòng chọn lại ghế.");
  }

  // Chặn thanh toán nếu thời gian giữ ghế còn lại dưới 30 giây (tránh race condition hết hạn đúng lúc giao dịch ngân hàng)
  const MIN_HOLD_REMAINING_FOR_PAYMENT_MS = 30_000;
  if (hold.expiresAt - Date.now() < MIN_HOLD_REMAINING_FOR_PAYMENT_MS) {
    throw new BookingError(
      410,
      "HOLD_EXPIRED",
      "Thời gian giữ ghế sắp hết (dưới 30 giây). Vui lòng chọn lại ghế để đảm bảo giao dịch không bị gián đoạn.",
    );
  }

  const claimedSeats = parseSeats(input.seats);
  if (claimedSeats.length !== hold.seats.length || !claimedSeats.every((s) => hold.seats.includes(s))) {
    throw new BookingError(409, "SEAT_MISMATCH", "Ghế thanh toán không khớp với ghế đã giữ.");
  }

  // 3) Thông tin suất chiếu & giá luôn lấy/tính ở server.
  const showtime = await loadSellableShowtime(showtimeId);
  const priced = calculatePrice({
    format: showtime.format,
    date: showtime.date,
    seats: hold.seats,
    concessions: input.concessions,
  });
  if (!priced.ok) throw new BookingError(400, "INVALID_CONCESSION", priced.error);
  const price = priced.price;

  if (input.expectedTotal !== undefined && Number(input.expectedTotal) !== price.total) {
    throw new BookingError(409, "PRICE_CHANGED", "Giá đã thay đổi, vui lòng kiểm tra lại đơn hàng.", { price });
  }

  // 4) Tạo vé ở trạng thái PENDING trước khi thu tiền.
  const record: BookingInfo = {
    bookingId,
    movieTitle: showtime.movieTitle,
    posterPath: sanitizePosterPath(input.posterPath),
    cinemaName: CINEMA_NAMES[showtime.cinemaId] ?? showtime.cinemaId,
    roomName: showtime.roomName,
    format: showtime.format,
    showDate: showtime.date,
    showTime: showtime.time,
    seats: hold.seats,
    totalAmount: price.total,
    ...customer,
    concessions: price.concessions,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const pendingOutcome = await ticketStore.createPending(record);
  if (pendingOutcome.outcome === "already_exists") {
    const existing = pendingOutcome.ticket;
    if (existing.status === "valid" || existing.status === "used") {
      return replay(bookingId, customer.customerPhone);
    }
    if (existing.status === "void") {
      throw new BookingError(410, "TICKET_VOID", "Đơn hàng này đã bị hủy trước đó.");
    }
  }

  // 5) Thu tiền khách (mô phỏng hoặc cổng thật).
  const charge = await input.charge({ amount: price.total, currency: price.currency, holdId });
  if (!charge.ok) {
    await ticketStore.voidTicket(bookingId, "PAYMENT_FAILED").catch(() => {});
    throw new BookingError(402, "PAYMENT_FAILED", "Thanh toán không thành công.", { reason: charge.reason });
  }

  // 6) Chốt ghế nguyên tử (held -> sold).
  const soldTtlSeconds =
    Math.max(3600, Math.ceil((showtimeStartMs(showtime) - Date.now()) / 1000)) + SOLD_RETENTION_HOURS_AFTER_START * 3600;

  const commit = await seatStore.commit(hold, bookingId, soldTtlSeconds);
  if (commit.outcome === "already_committed") {
    await ticketStore.promotePendingToValid(commit.bookingId);
    return replay(commit.bookingId, customer.customerPhone);
  }
  if (commit.outcome === "lost") {
    // Đã thu tiền mà mất ghế (hết TTL đúng lúc thanh toán). PHẢI hoàn tiền và hủy vé (void)
    console.error("[booking] SEAT_LOST_AFTER_PAYMENT cần hoàn tiền", {
      holdId,
      showtimeId,
      bookingId,
      amount: price.total,
      paymentReference: charge.reference,
      seats: commit.seats,
    });
    if (input.refund) {
      await input.refund({ reference: charge.reference, amount: price.total, reason: "SEAT_LOST" }).catch(() => {});
    }
    await ticketStore.voidTicket(bookingId, "SEAT_LOST").catch(() => {});
    throw new BookingError(409, "SEAT_LOST", "Ghế không còn được giữ, giao dịch sẽ được hoàn tiền.", {
      seats: commit.seats,
      refundRequired: true,
    });
  }

  // 7) Kích hoạt vé (pending -> valid) SAU KHI chốt ghế thành công.
  try {
    const validTicket = await ticketStore.promotePendingToValid(bookingId);
    if (!validTicket) throw new Error("Không thể chuyển trạng thái vé sang valid");
    const payload = await buildTicketPayload(validTicket);
    return { ...payload, replayed: false, storeMode: ticketStore.name };
  } catch (error) {
    // Hoàn tác để ghế không bị kẹt ở "sold" mà không có vé. Hoàn tiền và đánh dấu void vé.
    await seatStore.rollbackCommit(hold, bookingId).catch((rollbackError: unknown) => {
      console.error("[booking] Rollback ghế thất bại, cần đối soát thủ công:", { bookingId, rollbackError });
    });
    if (input.refund) {
      await input.refund({ reference: charge.reference, amount: price.total, reason: "PROMOTION_FAILED" }).catch(() => {});
    }
    await ticketStore.voidTicket(bookingId, "PROMOTION_FAILED").catch(() => {});
    console.error("[booking] Kích hoạt vé thất bại sau khi thanh toán, cần hoàn tiền:", {
      bookingId,
      paymentReference: charge.reference,
      error,
    });
    throw new BookingError(500, "TICKET_CREATE_FAILED", "Lỗi hệ thống khi lưu vé, giao dịch chưa hoàn tất.", {
      refundRequired: true,
    });
  }

  async function replay(bookingIdToReplay: string, phone: string): Promise<ConfirmResult> {
    const existing = await ticketStore.get(bookingIdToReplay);
    if (!existing) {
      // Instance khác đang giữa chừng commit -> tạo vé. Báo client thử lại sau giây lát.
      throw new BookingError(409, "BOOKING_IN_PROGRESS", "Đơn hàng đang được xử lý, vui lòng thử lại sau giây lát.");
    }
    // Chỉ trả lại vé (kèm QR) cho người khai đúng số điện thoại của đơn.
    if (!safeEqual(existing.customerPhone, phone)) {
      throw new BookingError(403, "REPLAY_FORBIDDEN", "Thông tin không khớp với đơn hàng.");
    }
    if (existing.status === "void") {
      throw new BookingError(410, "TICKET_VOID", "Vé này đã bị hủy hoặc giao dịch không thành công.");
    }

    // Nếu vé vẫn ở pending nhưng đã vào replay (ví dụ crash sau commit ghế), tự động promote lên valid
    let activeTicket = existing;
    if (existing.status === "pending") {
      const promoted = await ticketStore.promotePendingToValid(bookingIdToReplay);
      if (promoted) {
        activeTicket = promoted;
      }
    }

    const payload = await buildTicketPayload(activeTicket);
    return { ...payload, replayed: true, storeMode: ticketStore.name };
  }
}

export { HOLD_TTL_SECONDS };

