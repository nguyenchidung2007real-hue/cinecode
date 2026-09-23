import { Movie } from "@/types";
import { MOCK_MOVIES } from "./mockData";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

const TMDB_GENRES_MAP: Record<number, string> = {
  28: "Hành động",
  12: "Phiêu lưu",
  16: "Hoạt hình",
  35: "Hài hước",
  80: "Tội phạm",
  99: "Tài liệu",
  18: "Chính kịch",
  10751: "Gia đình",
  14: "Giả tưởng",
  36: "Lịch sử",
  27: "Kinh dị",
  10402: "Âm nhạc",
  9648: "Bí ẩn",
  10749: "Lãng mạn",
  878: "Khoa học viễn tưởng",
  10770: "Phim truyền hình",
  53: "Giật gân",
  10752: "Chiến tranh",
  37: "Miền Tây",
};

export async function getMovies(category: "all" | "now_playing" | "upcoming" | "trending" = "all"): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    if (category === "all") return MOCK_MOVIES;
    return MOCK_MOVIES.filter((m) => m.status === category);
  }

  try {
    let endpoint = `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=vi-VN&page=1`;
    if (category === "upcoming") {
      endpoint = `${TMDB_BASE_URL}/movie/upcoming?api_key=${apiKey}&language=vi-VN&page=1`;
    } else if (category === "trending") {
      endpoint = `${TMDB_BASE_URL}/trending/movie/week?api_key=${apiKey}&language=vi-VN`;
    }

    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return MOCK_MOVIES.filter((m) => category === "all" || m.status === category);
    }

    const data = await res.json();
    const results: TMDBMovie[] = data.results || [];

    const mapped: Movie[] = results.slice(0, 10).map((item) => ({
      id: item.id.toString(),
      title: item.title,
      originalTitle: item.original_title,
      overview: item.overview || "Đang cập nhật nội dung...",
      posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : MOCK_MOVIES[0].posterPath,
      backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : MOCK_MOVIES[0].backdropPath,
      releaseDate: item.release_date || "2024-01-01",
      voteAverage: Number(item.vote_average.toFixed(1)),
      voteCount: item.vote_count,
      genres: item.genre_ids?.map((gid) => TMDB_GENRES_MAP[gid]).filter(Boolean) || ["Điện ảnh"],
      durationMinutes: 120,
      director: "Đang cập nhật",
      cast: ["Diễn viên nổi tiếng"],
      trailerYoutubeId: "dQw4w9WgXcQ",
      ageRating: item.vote_average > 8 ? "T18" : "T13",
      status: category === "all" ? "now_playing" : category,
    }));

    return mapped.length > 0 ? mapped : MOCK_MOVIES;
  } catch (error) {
    console.error("Lỗi khi tải TMDB API, sử dụng mock data dự phòng:", error);
    return MOCK_MOVIES.filter((m) => category === "all" || m.status === category);
  }
}

export async function getMovieById(id: string | number): Promise<Movie | null> {
  const match = MOCK_MOVIES.find((m) => m.id.toString() === id.toString());
  if (match) return match;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&language=vi-VN&append_to_response=videos,credits`);
    if (!res.ok) return null;
    const item = await res.json();
    return {
      id: item.id.toString(),
      title: item.title,
      originalTitle: item.original_title,
      overview: item.overview,
      posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : MOCK_MOVIES[0].posterPath,
      backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : MOCK_MOVIES[0].backdropPath,
      releaseDate: item.release_date,
      voteAverage: Number(item.vote_average.toFixed(1)),
      voteCount: item.vote_count,
      genres: item.genres?.map((g: { name: string }) => g.name) || ["Điện ảnh"],
      durationMinutes: item.runtime || 120,
      director: item.credits?.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name || "Đạo diễn danh tiếng",
      cast: item.credits?.cast?.slice(0, 5).map((c: { name: string }) => c.name) || [],
      trailerYoutubeId: item.videos?.results?.[0]?.key || "Way9Dexny3w",
      ageRating: "T16",
      status: "now_playing",
    };
  } catch {
    return null;
  }
}
