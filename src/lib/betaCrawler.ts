import type { Movie, ShowTime } from "@/types";
import { MOCK_MOVIES, MOCK_SHOWTIMES } from "./mockData";

export interface SyncResult {
  success: boolean;
  source: "curated_demo" | "custom_seed";
  syncedAt: string;
  cinemaName: string;
  cinemaAddress: string;
  totalMovies: number;
  totalShowtimes: number;
  movies: { id: string | number; title: string; showtimesCount: number }[];
  message: string;
}

// In-memory cache cho dữ liệu mô phỏng Beta Cinemas
let cachedSyncedMovies: Movie[] = [...MOCK_MOVIES];
let cachedSyncedShowtimes: ShowTime[] = [...MOCK_SHOWTIMES];
let lastSyncTime: string = new Date().toISOString();

/**
 * Cung cấp dữ liệu lịch chiếu và giá vé mô phỏng cho chi nhánh Beta Cinemas Xuân Thủy (Demo)
 * Tránh việc cào dữ liệu trái phép ngoài production, đảm bảo an toàn và tính minh bạch.
 */
export async function syncBetaXuanThuyMovies(): Promise<SyncResult> {
  const cinemaId = "beta-cinemas-xuan-thuy";
  const cinemaName = "Beta Cinemas Xuân Thủy (Dữ liệu mô phỏng Demo)";
  const cinemaAddress = "Tầng 4, Tòa nhà HITC, 239 Xuân Thủy, Cầu Giấy, Hà Nội";

  lastSyncTime = new Date().toISOString();

  return {
    success: true,
    source: "curated_demo",
    syncedAt: lastSyncTime,
    cinemaName,
    cinemaAddress,
    totalMovies: cachedSyncedMovies.length,
    totalShowtimes: cachedSyncedShowtimes.filter((st) => st.cinemaId === cinemaId).length,
    movies: cachedSyncedMovies.map((m) => ({
      id: m.id,
      title: m.title,
      showtimesCount: cachedSyncedShowtimes.filter((st) => st.movieId === m.id).length,
    })),
    message: `Đã làm mới danh mục 8 suất chiếu mô phỏng chi nhánh Beta Cinemas Xuân Thủy (HITC Cầu Giấy) với bảng giá vé sinh viên ưu đãi.`,
  };
}

export function getCachedBetaShowtimes(): ShowTime[] {
  return cachedSyncedShowtimes;
}

export function getLastSyncTime(): string {
  return lastSyncTime;
}
