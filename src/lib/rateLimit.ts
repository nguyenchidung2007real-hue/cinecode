import type { NextRequest } from "next/server";
import { getKvConfig, kvCommand } from "@/lib/kvRest";

/**
 * Rate limit cửa sổ cố định. Có Redis: đếm phân tán bằng script INCR+EXPIRE nguyên tử
 * (không để lại key "vĩnh viễn" nếu process chết giữa hai lệnh). Không có Redis: Map trong bộ nhớ (dev).
 * Đây là kiểm soát "mềm": nếu Redis lỗi thì cho qua (fail-open) và ghi log,
 * vì nếu Redis chết thì các bước nghiệp vụ (giữ ghế, bán vé) cũng tự thất bại an toàn.
 */

const RATE_LUA =
  "local c = redis.call('INCR', KEYS[1]) if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return c";

const memory = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: NextRequest): string {
  // Trên Vercel, x-real-ip / x-forwarded-for do nền tảng đặt, client không giả mạo được.
  // Nếu tự host sau proxy khác: chỉ tin header mà proxy của bạn ghi đè.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function isRateLimited(
  scope: string,
  clientId: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `cinemax:rl:${scope}:${clientId}`;
  const config = getKvConfig();

  if (config) {
    try {
      const count = await kvCommand(config, ["EVAL", RATE_LUA, "1", key, String(windowSeconds)]);
      return typeof count === "number" && count > max;
    } catch (error) {
      console.warn("[rateLimit] Redis lỗi, bỏ qua giới hạn tần suất lần này:", error);
      return false;
    }
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
