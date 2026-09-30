import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, safeEqual } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quản lý số lần đăng nhập sai theo IP (8 lần trong 5 phút)
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 phút

function checkLockout(ip: string): { locked: boolean; remainingSeconds: number } {
  const record = failedAttemptsMap.get(ip);
  if (!record) return { locked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    return { locked: true, remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (record.lockedUntil <= now && record.count >= MAX_ATTEMPTS) {
    failedAttemptsMap.delete(ip);
  }
  return { locked: false, remainingSeconds: 0 };
}

function recordFailedAttempt(ip: string): { locked: boolean; remainingAttempts: number } {
  const record = failedAttemptsMap.get(ip) ?? { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
    failedAttemptsMap.set(ip, record);
    return { locked: true, remainingAttempts: 0 };
  }
  failedAttemptsMap.set(ip, record);
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - record.count };
}

function clearFailedAttempts(ip: string) {
  failedAttemptsMap.delete(ip);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const lockout = checkLockout(clientIp);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: `Tài khoản tạm thời bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau ${lockout.remainingSeconds} giây.`,
        locked: true,
      },
      { status: 429 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu JSON không hợp lệ." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu quản trị." }, { status: 400 });
  }

  const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD?.trim();

  // Trên production: bắt buộc phải có biến ADMIN_LOGIN_PASSWORD
  if (process.env.NODE_ENV === "production" && !expectedPassword) {
    return NextResponse.json(
      { error: "Hệ thống chưa cấu hình mật khẩu quản trị ADMIN_LOGIN_PASSWORD trên máy chủ." },
      { status: 500 },
    );
  }

  // Môi trường dev fallback nếu chưa đặt
  const activePassword = expectedPassword || "cinemax2026";

  if (!safeEqual(password, activePassword)) {
    const attempt = recordFailedAttempt(clientIp);
    if (attempt.locked) {
      return NextResponse.json(
        {
          error: "Nhập sai quá 8 lần. Tài khoản bị tạm khóa 5 phút để bảo vệ hệ thống.",
          locked: true,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        error: `Mật khẩu không chính xác. Bạn còn ${attempt.remainingAttempts} lần thử.`,
        remainingAttempts: attempt.remainingAttempts,
      },
      { status: 401 },
    );
  }

  // Đăng nhập thành công -> xóa lịch sử sai
  clearFailedAttempts(clientIp);

  const sessionToken = createAdminSessionToken();
  const response = NextResponse.json({
    success: true,
    message: "Đăng nhập thành công!",
  });

  // Thiết lập HttpOnly Cookie an toàn
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60, // 24 giờ
  });

  return response;
}
