import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { BookingError, confirmBooking, type ChargeResult } from "@/lib/bookingService";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Thanh toán MÔ PHỎNG. Chỉ bật ở môi trường không phải production, hoặc khi cố ý đặt ALLOW_MOCK_PAYMENT=true
 * (ví dụ bản demo công khai). Trên production thật phải thay bằng cổng thanh toán và chốt vé qua webhook có ký số.
 * Nếu không, bất kỳ ai gọi API này đều "mua" được vé miễn phí.
 */
function isMockPaymentAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENT === "true";
}

async function chargeMock(simulate: unknown): Promise<ChargeResult> {
  if (process.env.NODE_ENV !== "production" && simulate === "fail") {
    return { ok: false, reason: "Thẻ bị từ chối (mô phỏng)." };
  }
  return { ok: true, reference: `MOCK-${randomBytes(6).toString("hex")}` };
}

/**
 * POST /api/booking
 * Body: { showtimeId, holdId, seats, customer: { name, phone, email? }, concessions?, expectedTotal?, posterPath?, payment?: { simulate? } }
 * Server tự tra suất chiếu (phim/phòng/giờ/định dạng), tự tính tiền, và chỉ bán đúng những ghế đã được giữ bằng holdId.
 */
export async function POST(request: NextRequest) {
  try {
    if (await isRateLimited("booking", getClientIp(request), 10, 60)) {
      throw new BookingError(429, "RATE_LIMITED", "Quá nhiều yêu cầu, vui lòng thử lại sau.");
    }
    if (!isMockPaymentAllowed()) {
      throw new BookingError(501, "PAYMENT_NOT_CONFIGURED", "Cổng thanh toán chưa được cấu hình.");
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = await request.json();
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not object");
      body = parsed as Record<string, unknown>;
    } catch {
      throw new BookingError(400, "INVALID_JSON", "Dữ liệu gửi lên không đúng định dạng JSON.");
    }

    const payment =
      typeof body.payment === "object" && body.payment !== null ? (body.payment as Record<string, unknown>) : {};

    const result = await confirmBooking({
      showtimeId: body.showtimeId,
      holdId: body.holdId,
      seats: body.seats,
      customer: body.customer,
      concessions: body.concessions,
      expectedTotal: body.expectedTotal,
      posterPath: body.posterPath,
      charge: () => chargeMock(payment.simulate),
      refund: async ({ reference, amount, reason }) => {
        console.log(`[booking/mock-refund] Đã hoàn ${amount} VND cho tham chiếu ${reference} (lý do: ${reason})`);
        return { ok: true };
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: result.replayed ? "Đơn hàng đã được xử lý trước đó." : "Đặt vé thành công!",
        data: result.ticket,
        qrToken: result.qrToken,
        storeMode: result.storeMode,
        replayed: result.replayed,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.message, code: error.code, ...error.extra },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("[api/booking] Lỗi hệ thống:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lưu vé, giao dịch chưa hoàn tất. Vui lòng thử lại.", code: "INTERNAL" },
      { status: 500, headers: NO_STORE },
    );
  }
}
