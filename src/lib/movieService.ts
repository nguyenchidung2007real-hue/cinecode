import { Movie } from "@/types";
import { MOCK_MOVIES } from "./mockData";

// Sử dụng api.tmdb.org làm cổng chính (tránh bị chặn/reset kết nối tại các nhà mạng Việt Nam)
const TMDB_PRIMARY_URL = "https://api.tmdb.org/3";
const TMDB_SECONDARY_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

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

async function fetchFromTMDB(path: string, apiKey: string): Promise<any> {
  const queryDelim = path.includes("?") ? "&" : "?";
  const urlPrimary = `${TMDB_PRIMARY_URL}${path}${queryDelim}api_key=${apiKey}`;
  const urlSecondary = `${TMDB_SECONDARY_URL}${path}${queryDelim}api_key=${apiKey}`;

  try {
    const res = await fetch(urlPrimary, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 1800 },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Thử endpoint dự phòng nếu cổng chính bị lỗi mạng
    try {
      const res2 = await fetch(urlSecondary, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 1800 },
      });
      if (res2.ok) return await res2.json();
    } catch {}
  }
  return null;
}

export async function getMovies(category: "all" | "now_playing" | "upcoming" | "trending" = "all"): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    if (category === "all") return MOCK_MOVIES;
    return MOCK_MOVIES.filter((m) => m.status === category);
  }

  try {
    let path = `/movie/now_playing?language=vi-VN&page=1`;
    if (category === "upcoming") {
      path = `/movie/upcoming?language=vi-VN&page=1`;
    } else if (category === "trending") {
      path = `/trending/movie/week?language=vi-VN`;
    }

    const data = await fetchFromTMDB(path, apiKey);
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return MOCK_MOVIES.filter((m) => category === "all" || m.status === category);
    }

    const results: TMDBMovie[] = data.results;

    const mapped: Movie[] = results.slice(0, 16).map((item, idx) => {
      const genres = item.genre_ids?.map((gid) => TMDB_GENRES_MAP[gid]).filter(Boolean) || ["Điện ảnh"];
      const fallbackPoster = MOCK_MOVIES[idx % MOCK_MOVIES.length].posterPath;
      const fallbackBackdrop = MOCK_MOVIES[idx % MOCK_MOVIES.length].backdropPath;

      const overviewText = item.overview?.trim() ||
        `${item.title} (${item.original_title || "Bom tấn"}) - Tác phẩm điện ảnh đỉnh cao đang thu hút sự chú ý tại hệ thống cụm rạp Beta Cinemas. Trải nghiệm âm thanh Dolby 7.1 sống động.`;

      let movieStatus: "now_playing" | "upcoming" | "trending" = "now_playing";
      if (category === "upcoming" || (item.release_date && new Date(item.release_date) > new Date())) {
        movieStatus = "upcoming";
      } else if (category === "trending" || item.vote_average >= 7.8) {
        movieStatus = "trending";
      }

      return {
        id: `tmdb-${item.id}`,
        title: item.title,
        originalTitle: item.original_title,
        overview: overviewText,
        posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : fallbackPoster,
        backdropPath: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : fallbackBackdrop,
        releaseDate: item.release_date || "2024-06-01",
        voteAverage: Number(item.vote_average ? item.vote_average.toFixed(1) : "8.0"),
        voteCount: item.vote_count || 1200,
        genres: genres.length > 0 ? genres : ["Hành động", "Phiêu lưu"],
        durationMinutes: 115 + (item.id % 35),
        director: "Đang cập nhật",
        cast: ["Dàn diễn viên chuẩn quốc tế"],
        trailerYoutubeId: "Way9Dexny3w",
        ageRating: item.vote_average >= 8 ? "T18" : item.vote_average >= 7 ? "T16" : "T13",
        status: category === "all" ? movieStatus : category,
      };
    });

    // Kết hợp phim TMDB trực tiếp và phim rạp Việt Nam
    const combined = [...mapped];
    for (const mock of MOCK_MOVIES) {
      if (!combined.some((m) => m.title.toLowerCase() === mock.title.toLowerCase())) {
        combined.push(mock);
      }
    }

    if (category === "all") return combined;
    return combined.filter((m) => m.status === category);
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

  const rawTmdbId = String(id).replace("tmdb-", "");
  if (!/^\d+$/.test(rawTmdbId)) return null;

  try {
    const item = await fetchFromTMDB(`/movie/${rawTmdbId}?language=vi-VN&append_to_response=videos,credits`, apiKey);
    if (!item || !item.title) return null;

    const director = item.credits?.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name || "Đạo diễn danh tiếng";
    const cast = item.credits?.cast?.slice(0, 5).map((c: { name: string }) => c.name) || ["Diễn viên nổi tiếng"];
    const trailer = item.videos?.results?.find((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))?.key || "Way9Dexny3w";

    return {
      id: `tmdb-${item.id}`,
      title: item.title,
      originalTitle: item.original_title,
      overview: item.overview || `${item.title} - Siêu phẩm điện ảnh bom tấn tại rạp Beta Cinemas.`,
      posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : MOCK_MOVIES[0].posterPath,
      backdropPath: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : MOCK_MOVIES[0].backdropPath,
      releaseDate: item.release_date,
      voteAverage: Number(item.vote_average ? item.vote_average.toFixed(1) : "8.0"),
      voteCount: item.vote_count || 1000,
      genres: item.genres?.map((g: { name: string }) => g.name) || ["Điện ảnh"],
      durationMinutes: item.runtime || 120,
      director,
      cast,
      trailerYoutubeId: trailer,
      ageRating: item.vote_average >= 8 ? "T18" : "T16",
      status: "now_playing",
    };
  } catch {
    return null;
  }
}
