import type { BookingInfo } from "@/types";
import type { PriceBreakdown } from "@/lib/pricing";

/**
 * CineMax AI - Client gọi API Module 3 (giữ ghế + đặt vé).
 * Server là nguồn sự thật: file này KHÔNG tính tiền, KHÔNG tự đặt TTL, chỉ gọi API và phân loại lỗi.
 */

export type { PriceBreakdown };
export type SeatStatus = "free" | "held" | "mine" | "sold";

export interface HoldResponse {
  holdId: string;
  showtimeId: string;
  seats: string[];
  expiresAt: string;
  expiresInSeconds: number;
  quote: PriceBreakdown;
}

export interface AvailabilityResponse {
  showtimeId: string;
  seats: Record<string, SeatStatus>;
  holdTtlSeconds: number;
}

export interface BookingPayload {
  showtimeId: string;
  holdId: string;
  seats: string[];
  customer: { name: string; phone: string; email?: string };
  concessions?: unknown[];
  /** Tổng tiền UI đang hiển thị: chỉ để server phát hiện lệch giá (PRICE_CHANGED), không dùng để tính tiền. */
  expectedTotal?: number;
  posterPath?: string;
  payment?: { simulate?: "fail" };
}

export interface BookingResponse {
  success: true;
  message: string;
  data: BookingInfo;
  qrToken: string;
  storeMode: string;
  replayed: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: Record<string, unknown>;

  constructor(status: number, code: string, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError(0, "NETWORK", "Mất kết nối mạng. Vui lòng kiểm tra và thử lại.");
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof body.code === "string" ? body.code : "UNKNOWN",
      typeof body.error === "string" ? body.error : "Đã có lỗi xảy ra, vui lòng thử lại.",
      body,
    );
  }
  return body as T;
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export const seatApi = {
  availability(showtimeId: string, holdId?: string, signal?: AbortSignal): Promise<AvailabilityResponse> {
    return request<AvailabilityResponse>(`/api/seats?showtimeId=${encodeURIComponent(showtimeId)}`, {
      method: "GET",
      headers: holdId ? { "X-Hold-Id": holdId } : {},
      signal,
    });
  },

  hold(input: { showtimeId: string; seats: string[]; holdId?: string }): Promise<HoldResponse> {
    return request<HoldResponse>("/api/seats", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    });
  },

  /** keepalive: true để yêu cầu vẫn được gửi khi người dùng đóng tab / chuyển trang. */
  release(showtimeId: string, holdId: string, options: { keepalive?: boolean } = {}): Promise<{ released: boolean }> {
    return request<{ released: boolean }>("/api/seats", {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify({ showtimeId, holdId }),
      keepalive: options.keepalive === true,
    });
  },
};

const BOOKING_IN_PROGRESS_RETRIES = 3;
const BOOKING_IN_PROGRESS_DELAY_MS = 1000;

/**
 * Gửi đặt vé. Tự thử lại vài lần khi server báo BOOKING_IN_PROGRESS (đơn đang được instance khác hoàn tất);
 * vì server idempotent theo holdId nên việc thử lại không thể tạo vé thứ hai.
 */
export async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request<BookingResponse>("/api/booking", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const retryable = error instanceof ApiError && error.code === "BOOKING_IN_PROGRESS";
      if (!retryable || attempt >= BOOKING_IN_PROGRESS_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, BOOKING_IN_PROGRESS_DELAY_MS));
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Ánh xạ mã lỗi -> thông điệp + hành động UI nên làm                        */
/* -------------------------------------------------------------------------- */

export type ErrorAction =
  | "reselect" // quay lại bước chọn ghế (hold không còn dùng được)
  | "review_price" // cập nhật tổng tiền từ error.body.price rồi cho khách xác nhận lại
  | "fix_input" // ở lại form, sửa thông tin
  | "retry" // ở lại, cho bấm thử lại
  | "fatal"; // không thể tiếp tục với suất chiếu này

export interface ErrorDescription {
  message: string;
  action: ErrorAction;
}

export function describeError(error: unknown): ErrorDescription {
  if (!(error instanceof ApiError)) {
    return { message: "Đã có lỗi không xác định, vui lòng thử lại.", action: "retry" };
  }
  switch (error.code) {
    case "SEAT_TAKEN":
      return { message: "Một số ghế vừa được người khác chọn. Vui lòng chọn ghế khác.", action: "reselect" };
    case "HOLD_EXPIRED":
      return { message: "Đã hết thời gian giữ ghế. Vui lòng chọn lại ghế.", action: "reselect" };
    case "SEAT_LOST":
      return {
        message: "Ghế không còn được giữ đúng lúc thanh toán. Giao dịch sẽ được hoàn tiền, vui lòng chọn lại ghế.",
        action: "reselect",
      };
    case "SEAT_MISMATCH":
      return { message: "Danh sách ghế đã thay đổi, vui lòng chọn lại ghế.", action: "reselect" };
    case "SHOWTIME_STARTED":
    case "SHOWTIME_NOT_FOUND":
      return { message: error.message, action: "fatal" };
    case "PRICE_CHANGED":
      return { message: "Giá vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.", action: "review_price" };
    case "INVALID_CUSTOMER":
    case "INVALID_CONCESSION":
    case "REPLAY_FORBIDDEN":
      return { message: error.message, action: "fix_input" };
    case "PAYMENT_FAILED":
      return { message: "Thanh toán không thành công. Bạn có thể thử lại trong thời gian giữ ghế.", action: "retry" };
    case "BOOKING_IN_PROGRESS":
      return { message: "Đơn hàng đang được xử lý, vui lòng đợi giây lát rồi thử lại.", action: "retry" };
    case "RATE_LIMITED":
      return { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.", action: "retry" };
    case "NETWORK":
      return { message: error.message, action: "retry" };
    default:
      return { message: error.message, action: "retry" };
  }
}
