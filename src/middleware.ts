import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "cinemax_admin_session";

// Chuyển hex string sang Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Chuyển Uint8Array sang hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// So sánh an toàn thời gian trên Edge Runtime
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyEdgeToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_SYNC_SECRET?.trim() || "cinemax-dev-insecure-admin-session-secret";
  const payload = `admin:${expiresAt}`;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedHex = bytesToHex(new Uint8Array(signatureBuffer));
    return safeCompare(parts[2], expectedHex);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ can thiệp các route /admin/* ngoại trừ /admin/login
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      // Nếu đã đăng nhập hợp lệ mà cố vào trang login -> chuyển thẳng vào /admin
      const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (await verifyEdgeToken(session)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Các trang admin còn lại: kiểm tra phiên
    const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyEdgeToken(session);

    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
