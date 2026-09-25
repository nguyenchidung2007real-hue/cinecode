import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/lib/movieService";
import { semanticSearchMovies } from "@/lib/hfRagService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Giới hạn tần suất gọi API (Rate limiting)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
function isRateLimited(ip: string, maxRequests = 40): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return false;
  }
  if (record.count >= maxRequests) {
    return true;
  }
  record.count++;
  return false;
}

/**
 * API Search Phim Ngữ Nghĩa (Semantic Search & RAG - Goal 5)
 * GET /api/search?q=...&limit=...
 * POST /api/search { query: string, limit?: number }
 */

export async function GET(request: NextRequest): Promise<Response> {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Bạn đã gửi quá nhiều yêu cầu tìm kiếm. Vui lòng chờ 1 phút." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? Math.min(20, Math.max(1, parseInt(rawLimit, 10) || 5)) : 5;

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp từ khóa tìm kiếm (tham số 'q')" },
        { status: 400 }
      );
    }

    const movies = await getMovies("all");
    const searchResult = await semanticSearchMovies(query, movies, { limit });

    return NextResponse.json(
      {
        query,
        count: searchResult.hits.length,
        mode: searchResult.mode,
        results: searchResult.hits,
        fallbackReason: searchResult.fallbackReason,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[/api/search] Lỗi tìm kiếm:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tìm kiếm phim" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Bạn đã gửi quá nhiều yêu cầu tìm kiếm. Vui lòng chờ 1 phút." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body JSON không hợp lệ" }, { status: 400 });
    }

    const rawQuery = body.query ?? body.q;
    if (typeof rawQuery !== "string" || !rawQuery.trim()) {
      return NextResponse.json(
        { error: "Trường 'query' bắt buộc phải là chuỗi ký tự không rỗng." },
        { status: 400 }
      );
    }
    const query = rawQuery.trim();
    const limit = typeof body.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;

    const movies = await getMovies("all");
    const searchResult = await semanticSearchMovies(query, movies, { limit });

    return NextResponse.json(
      {
        query,
        count: searchResult.hits.length,
        mode: searchResult.mode,
        results: searchResult.hits,
        fallbackReason: searchResult.fallbackReason,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[/api/search POST] Lỗi:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tìm kiếm phim" },
      { status: 500 }
    );
  }
}
