"use client";

import React, { useState, useMemo } from "react";
import { Movie } from "@/types";
import { MOCK_CINEMAS, getShowtimesForMovie } from "@/lib/mockData";
import { MapPin, Film } from "lucide-react";

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
  const dateOptions = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => getVnDate(i));
  }, []);

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].date);

  const currentCinema = useMemo(
    () => MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0],
    [selectedCinemaId]
  );

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
    <section className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-10" id="matrix-section">
      {/* Tiêu đề Section chuẩn Điện Ảnh: Căn trái, thanh dọc đỏ, xóa nhãn Live Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3 border-b border-white/10 pb-4">
        <div className="border-l-4 border-[#E50914] pl-4">
          <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider block mb-1">
            Lịch Chiếu Trực Tiếp Toàn Hệ Thống
          </span>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold text-white tracking-tight uppercase">
            LỊCH CHIẾU PHIM CINEMAX
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Chọn suất chiếu phù hợp để vào thẳng sơ đồ chọn ghế và nhận giá vé ưu đãi
          </p>
        </div>
      </div>

      {/* Toolbar: Chọn rạp + Chọn ngày */}
      <div className="bg-[#12141C] border border-white/10 rounded-xl p-3 sm:p-4 shadow-xl mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Bộ lọc rạp */}
        <div className="flex items-center gap-2 bg-[#0B0C10] border border-white/10 px-3.5 py-2.5 rounded-lg text-xs flex-shrink-0 lg:w-72">
          <MapPin className="w-4 h-4 text-[#E50914] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] uppercase font-bold text-[#9CA3AF]">Chọn Cụm Rạp</span>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full bg-transparent border-none text-white font-bold focus:outline-none cursor-pointer truncate text-xs"
            >
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#12141C] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thanh chọn ngày */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {dateOptions.map((item) => {
            const isActive = selectedDate === item.date;
            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`flex flex-col items-center justify-center py-2 px-3 sm:px-3.5 rounded-lg border text-center transition-all flex-shrink-0 min-w-[76px] cursor-pointer ${
                  isActive
                    ? "bg-[#E50914] border-[#E50914] text-white shadow-lg shadow-red-600/40 font-bold"
                    : "bg-[#0B0C10] border-white/10 text-[#9CA3AF] hover:text-white hover:border-[#E50914]/50 hover:bg-[#161922]"
                }`}
              >
                <span className={`text-[11px] font-black ${isActive ? "text-white" : "text-[#9CA3AF]"}`}>
                  {item.shortDow}
                </span>
                <span className={`text-xs mt-0.5 font-bold ${isActive ? "text-white" : "text-white/80"}`}>
                  {item.fullDate}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách phim và khung giờ chiếu tại rạp */}
      <div className="space-y-4">
        {movies.slice(0, 6).map((movie) => {
          const rawShowtimes = getShowtimesForMovie(movie.id).filter(
            (st) => st.cinemaId === selectedCinemaId && st.date === selectedDate
          );

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
              className="bg-[#12141C] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 hover:border-[#E50914]/40 transition-all shadow-md"
            >
              {/* Poster nhỏ và thông tin phim */}
              <div className="flex gap-4 md:w-80 shrink-0">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-lg shadow-sm border border-white/10 shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {getAgeRatingBadge(movie.ageRating)}
                      <span className="text-[11px] text-[#9CA3AF] font-semibold">{movie.durationMinutes} phút</span>
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 hover:text-[#E50914] transition-colors cursor-pointer">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-[#9CA3AF] line-clamp-1 mt-0.5">
                      {movie.genres.slice(0, 2).join(", ")}
                    </p>
                  </div>

                  <span className="text-[11px] text-[#F5C518] font-bold flex items-center gap-1">
                    ★ {movie.voteAverage} / 10 IMDb
                  </span>
                </div>
              </div>

              {/* Bảng các khung giờ chiếu */}
              <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold mb-2.5 block">
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
                      className="group/btn px-3.5 py-2 rounded-lg bg-[#161922] border border-white/10 hover:border-[#E50914] hover:bg-[#E50914]/10 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span className="block text-sm font-black text-white group-hover/btn:text-[#E50914]">
                        {st.time}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#E50914] font-bold">{st.format}</span>
                        <span className="text-[9px] text-[#9CA3AF]">• {st.roomName}</span>
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
