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

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("beta-cinemas-xuan-thuy");
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
      {/* Tiêu đề Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" /> Lịch Chiếu Trực Tiếp
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>LỊCH CHIẾU PHIM TẠI RẠP</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-50 text-sky-600 border border-sky-200">
              Live Matrix
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bấm chọn giờ chiếu bất kỳ để mở thẳng sơ đồ chọn ghế
          </p>
        </div>

        {/* Dropdown chọn rạp */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs shadow-sm">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
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
              className={`flex flex-col items-center justify-center px-5 py-2.5 rounded-2xl border transition-all flex-shrink-0 min-w-[100px] ${
                isActive
                  ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/30 scale-105"
                  : "bg-white border-slate-200 text-slate-700 hover:text-sky-600 hover:border-sky-300"
              }`}
            >
              <span className="text-xs font-bold">{item.dayLabel}</span>
              <span className="text-[11px] opacity-90 mt-0.5">{item.subLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Danh sách phim và khung giờ chiếu tại rạp */}
      <div className="space-y-4">
        {movies.slice(0, 5).map((movie) => {
          // Các suất chiếu mẫu chuẩn phòng Beta Cinemas
          const showtimesForMovie = [
            { id: "st-1", time: "18:15", format: "2D Phụ Đề", room: "Phòng Beta 01" },
            { id: "st-2", time: "19:30", format: "2D Phụ Đề", room: "Phòng Beta 02" },
            { id: "st-3", time: "20:45", format: "2D Laser", room: "Phòng Beta 03" },
            { id: "st-4", time: "21:30", format: "2D Phụ Đề", room: "Phòng Beta 01" },
            { id: "st-5", time: "22:15", format: "2D Lồng Tiếng", room: "Phòng Beta 02" },
          ];

          return (
            <div
              key={movie.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 hover:border-sky-400 transition-all shadow-sm"
            >
              {/* Poster nhỏ và thông tin phim */}
              <div className="flex gap-4 md:w-80 shrink-0">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-100 shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {getAgeRatingBadge(movie.ageRating)}
                      <span className="text-[11px] text-slate-500 font-semibold">{movie.durationMinutes} phút</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 hover:text-sky-600 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {movie.genres.slice(0, 2).join(", ")}
                    </p>
                  </div>

                  <span className="text-[11px] text-amber-500 font-bold flex items-center gap-1">
                    ★ {movie.voteAverage} / 10 IMDb
                  </span>
                </div>
              </div>

              {/* Bảng các khung giờ chiếu */}
              <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-2.5 block">
                  Chọn suất chiếu để đặt ghế:
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
                      className="group/btn px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-left transition-all hover:scale-105 active:scale-95"
                    >
                      <span className="block text-sm font-black text-slate-800 group-hover/btn:text-sky-600">
                        {st.time}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-sky-600 font-semibold">{st.format}</span>
                        <span className="text-[9px] text-slate-400">• {st.room}</span>
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
