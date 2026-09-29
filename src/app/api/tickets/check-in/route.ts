import { NextRequest, NextResponse } from "next/server";
import { getTicketStore, verifyTicketToken, type TicketRecord } from "@/lib/ticketStore";
import { safeEqual } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route đặc quyền dành cho nhân viên soát vé (/scanner). Xác thực qua STAFF_SCAN_SECRET
 * trong header Authorization: Bearer <STAFF_SCAN_SECRET>.
 * Sử dụng safeEqual (timingSafeEqual) để chống tấn công timing attack.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.STAFF_SCAN_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  return safeEqual(header.slice(prefix.length), secret);
}

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length <= 6) return clean;
  return clean.slice(0, 3) + "****" + clean.slice(-3);
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7) dạng YYYY-MM-DD */
function todayInVietnam(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}

function sanitizeTicketForStaff(ticket: TicketRecord) {
  return {
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
    customerName: ticket.customerName,
    customerPhone: maskPhone(ticket.customerPhone),
    concessions: ticket.concessions,
    totalAmount: ticket.totalAmount,
  };
}

interface CheckInBody {
  token?: unknown;
  scannedBy?: unknown;
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Không có quyền soát vé." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const body = raw as CheckInBody;
  const token = typeof body.token === "string" ? body.token : null;
  const scannedBy = typeof body.scannedBy === "string" ? body.scannedBy.slice(0, 100) : undefined;

  if (!token) {
    return NextResponse.json({ error: "Thiếu mã vé (token)." }, { status: 400 });
  }

  const { valid, bookingId } = verifyTicketToken(token);
  if (!valid || !bookingId) {
    return NextResponse.json(
      { outcome: "invalid", error: "Mã vé không hợp lệ hoặc có dấu hiệu giả mạo." },
      { status: 400 },
    );
  }

  try {
    const store = getTicketStore();
    const result = await store.markUsed(bookingId, scannedBy);

    if (result.outcome === "not_found") {
      return NextResponse.json(
        { outcome: "not_found", error: "Không tìm thấy vé trong hệ thống." },
        { status: 404 },
      );
    }

    const sanitizedTicket = sanitizeTicketForStaff(result.ticket);

    // Cảnh báo nếu vé sai ngày chiếu (khác hôm nay theo giờ Việt Nam)
    const today = todayInVietnam();
    const dateWarning =
      result.ticket.showDate !== today
        ? `Vé này có ngày chiếu ${result.ticket.showDate} (hôm nay là ${today})`
        : undefined;

    if (result.outcome === "invalid_status") {
      const msg =
        result.status === "pending"
          ? "Vé đang trong trạng thái chờ xử lý (chưa hoàn tất đặt vé hoặc chưa thanh toán)."
          : result.status === "void"
          ? "Vé đã bị hủy (void) và không còn hiệu lực."
          : "Trạng thái vé không hợp lệ để vào rạp.";
      return NextResponse.json(
        { outcome: "invalid_status", error: msg, ticket: sanitizeTicketForStaff(result.ticket) },
        { status: 400 },
      );
    }

    if (result.outcome === "already_used") {
      return NextResponse.json(
        { outcome: "already_used", ticket: sanitizedTicket, warning: dateWarning },
        { status: 409 },
      );
    }

    return NextResponse.json({
      outcome: "checked_in",
      ticket: sanitizedTicket,
      warning: dateWarning,
    });
  } catch (error) {
    console.error("[POST /api/tickets/check-in] Lỗi soát vé:", error);
    return NextResponse.json({ error: "Không soát vé được lúc này." }, { status: 500 });
  }
}
