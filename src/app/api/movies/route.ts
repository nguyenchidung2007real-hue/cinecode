import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/lib/movieService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "all") as "all" | "now_playing" | "upcoming" | "trending";
  const search = searchParams.get("search")?.toLowerCase().trim() || "";

  let movies = await getMovies(category);

  if (search) {
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(search) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(search)) ||
        m.genres.some((g) => g.toLowerCase().includes(search)) ||
        m.director.toLowerCase().includes(search) ||
        m.cast.some((c) => c.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    success: true,
    total: movies.length,
    data: movies,
  });
}
