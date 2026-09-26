import { NextRequest, NextResponse } from "next/server";
import { buildTicketToken, getTicketStore, validateBookingInput } from "@/lib/ticketStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ⚠️ Chưa có xác thực: Goal 2 mới là giả lập thanh toán (VietQR/MoMo mock), chưa có
 * cổng thanh toán thật đứng trước endpoint này. Nên chỉ chặn được bằng validate dữ liệu
 * và rate limit dưới đây — không phải hàng rào tuyệt đối chống spam. Khi có thanh toán
 * thật, endpoint này nên được gọi từ webhook cổng thanh toán, không phải trực tiếp từ client.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest): Promise<Response> {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const input = validateBookingInput(raw);
  if (!input) {
    return NextResponse.json({ error: "Thiếu hoặc sai định dạng thông tin vé." }, { status: 400 });
  }

  try {
    const store = getTicketStore();
    const result = await store.create(input);
    const qrToken = buildTicketToken(input.bookingId);

    return NextResponse.json({
      success: true,
      alreadyExisted: result.outcome === "already_exists",
      ticket: result.ticket,
      qrToken,
      storeMode: store.name,
    });
  } catch (error) {
    console.error("[POST /api/tickets] Lỗi lưu vé:", error);
    return NextResponse.json({ error: "Không lưu được vé lúc này, vui lòng thử lại." }, { status: 500 });
  }
}
