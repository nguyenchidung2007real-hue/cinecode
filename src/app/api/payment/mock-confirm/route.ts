import { NextRequest, NextResponse } from "next/server";
import { getTicketStore } from "@/lib/ticketStore";
import { getSeatStore } from "@/lib/seatStore";
import { getShowtimeStore } from "@/lib/showtimeStore";
import { computeSoldTtlSeconds } from "@/lib/bookingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment/mock-confirm
 * Body: { bookingId: string, holdId: string, showtimeId: string }
 *
 * Chỉ cho phép chạy ở môi trường development hoặc khi cấu hình cờ ALLOW_MOCK_PAYMENT="true".
 * Chốt ghế thật trên Redis (bằng Lua script nguyên tử) và nâng trạng thái vé sang valid.
 */
export async function POST(request: NextRequest) {
  const isMockAllowed =
    process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENT === "true";

  if (!isMockAllowed) {
    return NextResponse.json(
      { error: "Chức năng giả lập thanh toán đã bị khóa trên môi trường Production." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const holdId = typeof body.holdId === "string" ? body.holdId.trim() : "";
    const showtimeId = typeof body.showtimeId === "string" ? body.showtimeId.trim() : "";

    if (!bookingId || !holdId || !showtimeId) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc: bookingId, holdId, showtimeId." },
        { status: 400 }
      );
    }

    const ticketStore = getTicketStore();
    const seatStore = getSeatStore();

    // 1. Kiểm tra đơn vé đang ở trạng thái pending
    const ticket = await ticketStore.get(bookingId);
    if (!ticket) {
      return NextResponse.json({ error: "Không tìm thấy đơn vé." }, { status: 404 });
    }

    if (ticket.status === "valid") {
      return NextResponse.json({
        success: true,
        message: "Đơn vé đã được xác nhận trước đó.",
        ticket,
      });
    }

    if (ticket.status !== "pending") {
      return NextResponse.json(
        { error: `Đơn vé không ở trạng thái chờ thanh toán (trạng thái: ${ticket.status}).` },
        { status: 409 }
      );
    }

    // 2. Kiểm tra holdId còn hiệu lực trên Redis
    const hold = await seatStore.getHold(showtimeId, holdId);
    if (!hold) {
      await ticketStore.voidTicket(bookingId, "Phiên giữ ghế đã hết hạn khi xác nhận thanh toán demo.");
      return NextResponse.json(
        { error: "Phiên giữ ghế đã hết hạn trên máy chủ, vui lòng chọn ghế lại." },
        { status: 410 }
      );
    }

    // 3. Chốt ghế nguyên tử (commit) trên Redis
    const showtime = await getShowtimeStore().getById(showtimeId);
    const soldTtlSeconds = showtime ? computeSoldTtlSeconds(showtime) : 7 * 24 * 3600;

    const commitOutcome = await seatStore.commit(hold, bookingId, soldTtlSeconds);
    if (commitOutcome.outcome === "lost") {
      await ticketStore.voidTicket(bookingId, "Ghế bị tranh chấp khi xác nhận thanh toán.");
      return NextResponse.json(
        { error: "Ghế đã bị tranh chấp hoặc đã có người khác đặt thành công." },
        { status: 409 }
      );
    }

    // 4. Nâng vé pending sang valid
    const txnRef = `MOCK-VIETQR-${Date.now()}`;
    const confirmedTicket = await ticketStore.promotePendingToValid(bookingId, txnRef);

    if (!confirmedTicket) {
      await seatStore.rollbackCommit(hold, bookingId).catch(() => {});
      return NextResponse.json(
        { error: "Không thể cập nhật trạng thái vé sau khi khóa ghế." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Xác thực thanh toán demo thành công, ghế đã được chốt trên máy chủ.",
      ticket: confirmedTicket,
    });
  } catch (error) {
    console.error("[mock-confirm] Lỗi xử lý xác nhận thanh toán:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ khi xác nhận thanh toán." },
      { status: 500 }
    );
  }
}
