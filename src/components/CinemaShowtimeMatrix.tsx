"use client";

import React, { useState, useMemo } from "react";
import { Movie } from "@/types";
import { MOCK_CINEMAS, getShowtimesForMovie } from "@/lib/mockData";
import { MapPin, Calendar, Film, Sparkles, ChevronRight } from "lucide-react";

interface CinemaShowtimeMatrixProps {
  movies: Movie[];
  onSelectShowtime: (
    movie: Movie,
    cinemaName: string,
    date: string,
    time: string,
    format: string,
    showtimeId?: string
  ) => void;
}

function getVnDate(offsetDays: number): { date: string; shortDow: string; fullDate: string; isToday: boolean; isTomorrow: boolean } {
  const d = new Date(Date.now() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const dateStr = d.toISOString().slice(0, 10);
  const [, m, day] = dateStr.split("-");
  const dayOfWeek = d.getUTCDay();
  const dowShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dayOfWeek];
  return {
    date: dateStr,
    shortDow: offsetDays === 0 ? "Hôm nay" : offsetDays === 1 ? "Ngày mai" : dowShort,
    fullDate: `${day}/${m}`,
    isToday: offsetDays === 0,
    isTomorrow: offsetDays === 1,
  };
}

export const CinemaShowtimeMatrix: React.FC<CinemaShowtimeMatrixProps> = ({
  movies,
  onSelectShowtime,
}) => {
  // 9 ngày liên tiếp theo format T5, 15/10 chuẩn hiện đại
  const dateOptions = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => getVnDate(i));
  }, []);

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].date);

  const currentCinema = useMemo(
    () => MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0],
    [selectedCinemaId]
  );

  // Nhãn độ tuổi chính thức chuẩn Bộ VHTTDL
  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case "T18":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#EA580C] text-white">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D97706] text-white">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#16A34A] text-white">P</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white">{rating || "P"}</span>;
    }
  };

  return (
    <section className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-10" id="showtimes-matrix">
      {/* Tiêu đề Section chuẩn CineMax */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#e71a0f] text-xs font-bold uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" /> Lịch Chiếu Trực Tiếp CineMax
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            <span>LỊCH CHIẾU PHIM CINEMAX</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-[#e71a0f] border border-rose-200">
              Live Matrix
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Bấm chọn giờ chiếu bất kỳ để mở thẳng sơ đồ chọn ghế và nhận giá vé ưu đãi
          </p>
        </div>
      </div>

      {/* Toolbar phối hợp ngang hàng: Bộ chọn rạp + Bộ chọn ngày 7-10 ngày cuộn ngang */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Bộ lọc rạp đặt ngang hàng */}
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 rounded-xl text-xs flex-shrink-0 lg:w-72">
          <MapPin className="w-4 h-4 text-[#e71a0f] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] uppercase font-bold text-neutral-400">Chọn Cụm Rạp</span>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full bg-transparent border-none text-neutral-900 font-bold focus:outline-none cursor-pointer truncate text-xs"
            >
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="text-neutral-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thanh chọn ngày (7-10 ngày liên tiếp) cuộn ngang mượt mà */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {dateOptions.map((item) => {
            const isActive = selectedDate === item.date;
            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`flex flex-col items-center justify-center py-2 px-3 sm:px-3.5 rounded-xl border text-center transition-all flex-shrink-0 min-w-[76px] cursor-pointer ${
                  isActive
                    ? "bg-[#e71a0f] border-[#e71a0f] text-white shadow-md shadow-rose-600/30 font-bold"
                    : "bg-white border-neutral-200 text-neutral-700 hover:text-[#e71a0f] hover:border-rose-300 hover:bg-neutral-50"
                }`}
              >
                <span className={`text-[11px] font-black ${isActive ? "text-white" : "text-neutral-600"}`}>
                  {item.shortDow}
                </span>
                <span className={`text-xs mt-0.5 font-bold ${isActive ? "text-white/95" : "text-neutral-900"}`}>
                  {item.fullDate}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách phim và khung giờ chiếu tại rạp đã chọn */}
      <div className="space-y-4">
        {movies.slice(0, 6).map((movie) => {
          // Lấy showtime thực tế từ mock store
          const rawShowtimes = getShowtimesForMovie(movie.id).filter(
            (st) => st.cinemaId === selectedCinemaId && st.date === selectedDate
          );

          // Nếu ngày đó chưa có suất, fallback các khung giờ đặc trưng CineMax
          const showtimesForMovie =
            rawShowtimes.length > 0
              ? rawShowtimes
              : [
                  { id: `st-${movie.id}-1`, time: "10:15", format: "2D Phụ Đề", roomName: "Phòng CineMax 01 (Dolby 7.1)" },
                  { id: `st-${movie.id}-2`, time: "13:30", format: "IMAX Laser", roomName: "Phòng IMAX Laser 01" },
                  { id: `st-${movie.id}-3`, time: "16:45", format: "4DX Motion", roomName: "Phòng 4DX Motion" },
                  { id: `st-${movie.id}-4`, time: "19:30", format: "2D Phụ Đề", roomName: "Phòng CineMax Deluxe 02" },
                  { id: `st-${movie.id}-5`, time: "21:45", format: "CineMax Luxe Lounge", roomName: "Phòng Luxe Lounge VIP" },
                ];

          return (
            <div
              key={movie.id}
              className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 hover:border-[#e71a0f] transition-all shadow-sm"
            >
              {/* Poster nhỏ và thông tin phim */}
              <div className="flex gap-4 md:w-80 shrink-0">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-sm border border-neutral-100 shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {getAgeRatingBadge(movie.ageRating)}
                      <span className="text-[11px] text-neutral-500 font-semibold">{movie.durationMinutes} phút</span>
                    </div>
                    <h3 className="font-bold text-neutral-900 text-sm sm:text-base line-clamp-1 hover:text-[#e71a0f] transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                      {movie.genres.slice(0, 2).join(", ")}
                    </p>
                  </div>

                  <span className="text-[11px] text-amber-500 font-bold flex items-center gap-1">
                    ★ {movie.voteAverage} / 10 IMDb
                  </span>
                </div>
              </div>

              {/* Bảng các khung giờ chiếu */}
              <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
                <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2.5 block">
                  Chọn suất chiếu để đặt vé & giữ ghế ({currentCinema.name}):
                </span>

                <div className="flex flex-wrap gap-2.5">
                  {showtimesForMovie.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onSelectShowtime(
                          movie,
                          currentCinema.name,
                          selectedDate,
                          st.time,
                          st.format,
                          st.id
                        )
                      }
                      className="group/btn px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-[#e71a0f] hover:bg-rose-50/60 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span className="block text-sm font-black text-neutral-900 group-hover/btn:text-[#e71a0f]">
                        {st.time}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#e71a0f] font-bold">{st.format}</span>
                        <span className="text-[9px] text-neutral-400">• {st.roomName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
