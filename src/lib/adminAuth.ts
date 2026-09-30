import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "cinemax_admin_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 giờ

/** So sánh chuỗi bí mật với thời gian không phụ thuộc vị trí ký tự khác nhau đầu tiên (Timing Safe). */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_SYNC_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET hoặc ADMIN_SYNC_SECRET bắt buộc phải được cấu hình trên production để ký cookie phiên quản trị.",
    );
  }
  return "cinemax-dev-insecure-admin-session-secret";
}

/**
 * Sinh token phiên đăng nhập quản trị viên (Admin Session Token).
 * Định dạng: admin.<expiresAtMs>.<signatureHex>
 */
export function createAdminSessionToken(durationMs: number = SESSION_DURATION_MS): string {
  const expiresAt = Date.now() + durationMs;
  const payload = `admin:${expiresAt}`;
  const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `admin.${expiresAt}.${sig}`;
}

/**
 * Xác thực token phiên quản trị viên.
 * Kiểm tra hạn dùng, cấu trúc và chữ ký HMAC thời gian an toàn.
 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false; // Hết hạn phiên
  }

  const payload = `admin:${expiresAt}`;
  let expectedSig: string;
  try {
    expectedSig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  } catch {
    return false;
  }

  const providedSig = parts[2];
  let providedBuffer: Buffer;
  let expectedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(providedSig, "hex");
    expectedBuffer = Buffer.from(expectedSig, "hex");
  } catch {
    return false;
  }

  return (
    providedBuffer.length === expectedBuffer.length &&
    providedBuffer.length > 0 &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

/**
 * Xác thực API quản trị (/api/admin/*) chấp nhận cả 2 luồng:
 * 1. Máy gọi máy (Cron/Crawler/Server-to-Server): Header `Authorization: Bearer <ADMIN_SYNC_SECRET>`.
 * 2. Người quản trị đăng nhập trên trình duyệt: Cookie phiên HttpOnly `cinemax_admin_session`.
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  // 1. Kiểm tra Bearer Token (Máy gọi máy)
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (header.startsWith(prefix)) {
    const provided = header.slice(prefix.length).trim();
    const serverSecret = (process.env.ADMIN_SYNC_SECRET || process.env.ADMIN_API_SECRET)?.trim();
    if (serverSecret && safeEqual(provided, serverSecret)) {
      return true;
    }
  }

  // 2. Kiểm tra Cookie Phiên HttpOnly (Người quản trị)
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionCookie && verifyAdminSessionToken(sessionCookie)) {
    return true;
  }

  // 3. Môi trường Dev/Demo: nếu chưa đặt mật khẩu quản trị và chưa cấu hình sync secret thì cho phép
  if (process.env.NODE_ENV !== "production") {
    const hasSync = Boolean(process.env.ADMIN_SYNC_SECRET?.trim());
    const hasPass = Boolean(process.env.ADMIN_LOGIN_PASSWORD?.trim());
    if (!hasSync && !hasPass) {
      return true;
    }
  }

  return false;
}
