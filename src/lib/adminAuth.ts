import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** So sánh chuỗi bí mật với thời gian không phụ thuộc vị trí ký tự khác nhau đầu tiên. */
export function safeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

/**
 * Xác thực API quản trị bằng header: Authorization: Bearer <ADMIN_API_SECRET>.
 * Chấp nhận ADMIN_SYNC_SECRET làm tên cũ để không phải đổi cấu hình đang chạy.
 *
 * - Môi trường không phải production: cho qua (cùng quy ước với /api/tickets/check-in).
 * - Production mà chưa đặt secret: từ chối hết (đóng kín theo mặc định).
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const secret = process.env.ADMIN_API_SECRET || process.env.ADMIN_SYNC_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  return safeEqual(header.slice(prefix.length), secret);
}
