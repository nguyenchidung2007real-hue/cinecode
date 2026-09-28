import { NextRequest, NextResponse } from "next/server";
import {
  BookingError,
  holdSeats,
  loadSellableShowtime,
  parseHoldId,
  releaseHold,
} from "@/lib/bookingService";
import { HOLD_TTL_SECONDS, getSeatStore } from "@/lib/seatStore";
import { allSeatIds } from "@/lib/seatLayout";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function errorResponse(error: unknown): NextResponse {
  if (error instanceof BookingError) {
    return NextResponse.json(
      { error: error.message, code: error.code, ...error.extra },
      { status: error.status, headers: NO_STORE },
    );
  }
  console.error("[api/seats] Lỗi hệ thống:", error);
  return NextResponse.json(
    { error: "Lỗi hệ thống, vui lòng thử lại.", code: "INTERNAL" },
    { status: 500, headers: NO_STORE },
  );
}

async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* rơi xuống lỗi bên dưới */
  }
  throw new BookingError(400, "INVALID_JSON", "Dữ liệu gửi lên không đúng định dạng JSON.");
}

/** GET /api/seats?showtimeId=... — trạng thái từng ghế. Header X-Hold-Id (tuỳ chọn) để nhận biết ghế "của mình". */
export async function GET(request: NextRequest) {
  try {
    if (await isRateLimited("seats-read", getClientIp(request), 600, 60)) {
      throw new BookingError(429, "RATE_LIMITED", "Quá nhiều yêu cầu, vui lòng thử lại sau.");
    }
    const showtime = await loadSellableShowtime(request.nextUrl.searchParams.get("showtimeId"));

    const holdHeader = request.headers.get("x-hold-id");
    const viewerHoldId = holdHeader ? parseHoldId(holdHeader) : undefined;

    const seats = await getSeatStore().statuses(showtime.id, allSeatIds(), viewerHoldId);
    return NextResponse.json({ showtimeId: showtime.id, seats, holdTtlSeconds: HOLD_TTL_SECONDS }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/seats — giữ ghế. Body: { showtimeId, seats: string[], holdId? }. Cùng holdId = đổi ghế/làm mới TTL. */
export async function POST(request: NextRequest) {
  try {
    if (await isRateLimited("seats-hold", getClientIp(request), 20, 60)) {
      throw new BookingError(429, "RATE_LIMITED", "Quá nhiều yêu cầu, vui lòng thử lại sau.");
    }
    const body = await readJson(request);
    const { hold, quote } = await holdSeats({ showtimeId: body.showtimeId, seats: body.seats, holdId: body.holdId });

    return NextResponse.json(
      {
        holdId: hold.holdId,
        showtimeId: hold.showtimeId,
        seats: hold.seats,
        expiresAt: new Date(hold.expiresAt).toISOString(), // client đếm ngược theo mốc này, không tự đặt TTL
        expiresInSeconds: Math.max(0, Math.round((hold.expiresAt - Date.now()) / 1000)),
        quote, // chỉ để hiển thị; server sẽ tính lại khi thanh toán
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/seats — nhả ghế sớm. Body: { showtimeId, holdId }. Idempotent. */
export async function DELETE(request: NextRequest) {
  try {
    if (await isRateLimited("seats-release", getClientIp(request), 30, 60)) {
      throw new BookingError(429, "RATE_LIMITED", "Quá nhiều yêu cầu, vui lòng thử lại sau.");
    }
    const body = await readJson(request);
    await releaseHold(body.showtimeId, body.holdId);
    return NextResponse.json({ released: true }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}
