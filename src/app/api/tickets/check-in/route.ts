import { NextRequest, NextResponse } from "next/server";
import { getTicketStore, verifyTicketToken } from "@/lib/ticketStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route đặc quyền dành cho nhân viên soát vé (/scanner). Dùng chung ADMIN_SYNC_SECRET
 * với /api/admin/sync-beta để không phải thêm biến môi trường mới cho bản demo này.
 * Khi có hệ thống tài khoản nhân viên thật, nên đổi sang token riêng theo từng người.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.ADMIN_SYNC_SECRET;
  const header = request.headers.get("authorization");
  return Boolean(secret) && header === `Bearer ${secret}`;
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
    const result = await getTicketStore().markUsed(bookingId, scannedBy);

    if (result.outcome === "not_found") {
      return NextResponse.json(
        { outcome: "not_found", error: "Không tìm thấy vé trong hệ thống." },
        { status: 404 },
      );
    }
    if (result.outcome === "already_used") {
      return NextResponse.json({ outcome: "already_used", ticket: result.ticket }, { status: 409 });
    }
    return NextResponse.json({ outcome: "checked_in", ticket: result.ticket });
  } catch (error) {
    console.error("[POST /api/tickets/check-in] Lỗi soát vé:", error);
    return NextResponse.json({ error: "Không soát vé được lúc này." }, { status: 500 });
  }
}
