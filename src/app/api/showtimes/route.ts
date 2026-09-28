import { NextRequest, NextResponse } from "next/server";
import { getShowtimeStore, type ShowtimeFilter } from "@/lib/showtimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/showtimes?date=YYYY-MM-DD&cinemaId=...&movieId=...
 * Tất cả tham số đều tùy chọn. Trả về { count, showtimes, storeMode, persistent }.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const filter: ShowtimeFilter = {};

  const date = searchParams.get("date");
  if (date !== null) {
    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json({ error: "Tham số date phải có dạng YYYY-MM-DD." }, { status: 400 });
    }
    filter.date = date;
  }

  const cinemaId = searchParams.get("cinemaId");
  if (cinemaId) filter.cinemaId = cinemaId.slice(0, 60);

  const movieId = searchParams.get("movieId");
  if (movieId) filter.movieId = movieId.slice(0, 50);

  try {
    const store = getShowtimeStore();
    const showtimes = await store.list(filter);

    return NextResponse.json(
      { count: showtimes.length, showtimes, storeMode: store.name, persistent: store.persistent },
      {
        status: 200,
        // Suất chiếu đổi không thường xuyên; cho phép CDN giữ ngắn để giảm tải.
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
      },
    );
  } catch (error) {
    console.error("[GET /api/showtimes] Lỗi đọc kho suất chiếu:", error);
    return NextResponse.json(
      { error: "Không đọc được lịch chiếu lúc này." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
