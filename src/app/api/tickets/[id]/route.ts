import { NextRequest, NextResponse } from "next/server";
import { getTicketStore, verifyTicketToken } from "@/lib/ticketStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/tickets/[id]?sig=<hmac>
 * Endpoint dành cho khách hàng kiểm tra và tự động đồng bộ trạng thái vé (valid / used)
 * trong modal "Vé Của Tôi" (MyTicketsModal).
 * Yêu cầu kèm chữ ký HMAC qua query parameter ?sig=... để chống duyệt quét mã vé ngẫu nhiên.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const bookingId = params.id;
  if (!bookingId || typeof bookingId !== "string") {
    return NextResponse.json({ error: "Thiếu mã vé hợp lệ." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const sig = searchParams.get("sig");

  // Bắt buộc phải có chữ ký HMAC hợp lệ để truy vấn thông tin vé (chống duyệt quét đoán ID vé)
  if (!sig) {
    return NextResponse.json(
      { error: "Yêu cầu chữ ký xác thực vé (?sig=...)." },
      { status: 401 }
    );
  }

  const { valid } = verifyTicketToken(`${bookingId}.${sig}`);
  if (!valid) {
    return NextResponse.json(
      { error: "Chữ ký vé không hợp lệ hoặc đã bị thay đổi." },
      { status: 403 }
    );
  }

  try {
    const ticket = await getTicketStore().get(bookingId);
    if (!ticket) {
      return NextResponse.json({ error: "Không tìm thấy vé trong hệ thống." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        bookingId: ticket.bookingId,
        movieTitle: ticket.movieTitle,
        cinemaName: ticket.cinemaName,
        roomName: ticket.roomName,
        format: ticket.format,
        showDate: ticket.showDate,
        showTime: ticket.showTime,
        seats: ticket.seats,
        status: ticket.status,
        usedAt: ticket.usedAt,
        scannedBy: ticket.scannedBy,
        concessions: ticket.concessions,
        totalAmount: ticket.totalAmount,
      },
    });
  } catch (error) {
    console.error(`[GET /api/tickets/${bookingId}] Lỗi truy vấn vé:`, error);
    return NextResponse.json({ error: "Lỗi hệ thống khi đọc dữ liệu vé." }, { status: 500 });
  }
}
