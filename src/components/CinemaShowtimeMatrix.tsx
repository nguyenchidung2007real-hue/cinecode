"use client";

import React, { useState, useMemo } from "react";
import { Movie } from "@/types";
import { MOCK_CINEMAS } from "@/lib/mockData";
import { MapPin, Calendar, Clock, Sparkles, Film, ArrowRight } from "lucide-react";

interface CinemaShowtimeMatrixProps {
  movies: Movie[];
  onSelectShowtime: (movie: Movie, cinemaName: string, date: string, time: string, format: string) => void;
}

function getVnDate(offsetDays: number): { date: string; dayLabel: string; subLabel: string } {
  const d = new Date(Date.now() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const dateStr = d.toISOString().slice(0, 10);
  const parts = dateStr.split("-");
  const subLabel = `${parts[2]}/${parts[1]}`;
  const dayOfWeek = d.getUTCDay();
  const dayName = dayOfWeek === 0 ? "Chủ Nhật" : `Thứ ${dayOfWeek + 1}`;
  const dayLabel = offsetDays === 0 ? "Hôm nay" : offsetDays === 1 ? "Ngày mai" : dayName;
  return { date: dateStr, dayLabel, subLabel };
}

export const CinemaShowtimeMatrix: React.FC<CinemaShowtimeMatrixProps> = ({
  movies,
  onSelectShowtime,
}) => {
  const dateOptions = useMemo(() => [
    getVnDate(0),
    getVnDate(1),
    getVnDate(2),
    getVnDate(3),
  ], []);

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].date);

  const currentCinema = MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0];

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white">{rating}</span>;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Tiêu đề Section chuẩn CGV */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-[#e5e0d8] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#e71a0f] text-xs font-bold uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" /> Lịch Chiếu Trực Tiếp CGV
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>LỊCH CHIẾU PHIM CGV CINEMAS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-[#e71a0f] border border-rose-200">
              Live Matrix
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Bấm chọn giờ chiếu bất kỳ để mở thẳng sơ đồ chọn ghế và nhận giá ưu đãi
          </p>
        </div>

        {/* Dropdown chọn rạp CGV */}
        <div className="flex items-center gap-2 bg-white border border-[#e5e0d8] px-3.5 py-2 rounded-xl text-xs shadow-sm">
          <MapPin className="w-4 h-4 text-[#e71a0f] shrink-0" />
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            className="bg-transparent border-none text-neutral-800 font-bold focus:outline-none cursor-pointer"
          >
            {MOCK_CINEMAS.map((c) => (
              <option key={c.id} value={c.id} className="bg-white text-slate-800">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Thanh chọn ngày (Date Pills) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-6">
        {dateOptions.map((item) => {
          const isActive = selectedDate === item.date;
          return (
            <button
              key={item.date}
              onClick={() => setSelectedDate(item.date)}
              className={`flex flex-col items-center justify-center px-5 py-2.5 rounded-2xl border transition-all flex-shrink-0 min-w-[105px] cursor-pointer ${
                isActive
                  ? "bg-[#e71a0f] border-[#e71a0f] text-white shadow-md shadow-red-600/30 scale-105 font-bold"
                  : "bg-white border-[#e5e0d8] text-neutral-700 hover:text-[#e71a0f] hover:border-rose-300"
              }`}
            >
              <span className="text-xs font-black">{item.dayLabel}</span>
              <span className="text-[11px] opacity-90 mt-0.5">{item.subLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Danh sách phim và khung giờ chiếu tại rạp */}
      <div className="space-y-4">
        {movies.slice(0, 6).map((movie) => {
          // Các suất chiếu mẫu chuẩn CGV Cultureplex
          const showtimesForMovie = [
            { id: "st-1", time: "18:15", format: "2D Digital", room: "Cinema 01 (Dolby Atmos)" },
            { id: "st-2", time: "19:30", format: "IMAX Laser", room: "IMAX Laser 01" },
            { id: "st-3", time: "20:45", format: "4DX 3D", room: "Phòng 4DX Motion" },
            { id: "st-4", time: "21:30", format: "2D Digital", room: "Cinema 02" },
            { id: "st-5", time: "22:15", format: "Gold Class", room: "Gold Class Lounge" },
          ];

          return (
            <div
              key={movie.id}
              className="bg-white border border-[#e5e0d8] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 hover:border-[#e71a0f] transition-all shadow-sm"
            >
              {/* Poster nhỏ và thông tin phim */}
              <div className="flex gap-4 md:w-80 shrink-0">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md border border-neutral-100 shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {getAgeRatingBadge(movie.ageRating)}
                      <span className="text-[11px] text-neutral-500 font-semibold">{movie.durationMinutes} phút</span>
                    </div>
                    <h3 className="font-black text-neutral-900 text-sm sm:text-base line-clamp-1 hover:text-[#e71a0f] transition-colors uppercase">
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
                <span className="text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-2.5 block">
                  Chọn suất chiếu để đặt vé & giữ ghế:
                </span>

                <div className="flex flex-wrap gap-2.5">
                  {showtimesForMovie.map((st) => (
                    <button
                      key={st.id}
                      onClick={() =>
                        onSelectShowtime(
                          movie,
                          currentCinema.name,
                          selectedDate,
                          st.time,
                          st.format
                        )
                      }
                      className="group/btn px-3.5 py-2 rounded-xl bg-[#fdfcf0] border border-[#e5e0d8] hover:border-[#e71a0f] hover:bg-rose-50/50 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span className="block text-sm font-black text-neutral-800 group-hover/btn:text-[#e71a0f]">
                        {st.time}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#e71a0f] font-bold">{st.format}</span>
                        <span className="text-[9px] text-neutral-400">• {st.room}</span>
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
