import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/lib/movieService";
import { semanticSearchMovies } from "@/lib/hfRagService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API Search Phim Ngữ Nghĩa (Semantic Search & RAG - Goal 5)
 * GET /api/search?q=...&limit=...
 * POST /api/search { query: string, limit?: number }
 */

export async function GET(request: NextRequest): Promise<Response> {
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
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body JSON không hợp lệ" }, { status: 400 });
    }

    const query = (body.query || body.q || "") as string;
    const limit = typeof body.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Thiếu trường 'query' trong body" },
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
