"use client";

import React, { useState } from "react";
import { Movie, ShowTime } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES } from "@/lib/mockData";
import { MapPin, Calendar, Clock, Sparkles, Film, ArrowRight } from "lucide-react";

interface CinemaShowtimeMatrixProps {
  movies: Movie[];
  onSelectShowtime: (movie: Movie, cinemaName: string, date: string, time: string, format: string) => void;
}

export const CinemaShowtimeMatrix: React.FC<CinemaShowtimeMatrixProps> = ({
  movies,
  onSelectShowtime,
}) => {
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("beta-cinemas-xuan-thuy");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-24");

  const currentCinema = MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0];

  // Danh sách ngày chiếu
  const dateOptions = [
    { date: "2026-09-24", dayLabel: "Hôm nay", subLabel: "26/09" },
    { date: "2026-09-25", dayLabel: "Ngày mai", subLabel: "27/09" },
    { date: "2026-09-26", dayLabel: "Chủ Nhật", subLabel: "28/09" },
    { date: "2026-09-27", dayLabel: "Thứ Hai", subLabel: "29/09" },
  ];

  // Nhãn độ tuổi chính thức chuẩn Bộ VHTTDL
  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case "T18":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">P</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">{rating}</span>;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Tiêu đề Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" /> Lịch Chiếu Trực Tiếp
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>LỊCH CHIẾU PHIM TẠI RẠP</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Live Matrix
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Bấm chọn giờ chiếu bất kỳ để mở thẳng sơ đồ chọn ghế
          </p>
        </div>

        {/* Dropdown chọn rạp */}
        <div className="flex items-center gap-2 bg-[#14151B] border border-white/15 px-3 py-2 rounded-xl text-xs">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            className="bg-transparent border-none text-white font-bold focus:outline-none cursor-pointer"
          >
            {MOCK_CINEMAS.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#14151B] text-white">
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
                  ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40 scale-105"
                  : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span className="text-xs font-bold">{item.dayLabel}</span>
              <span className="text-[11px] opacity-80 mt-0.5">{item.subLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Danh sách phim và khung giờ chiếu tại rạp */}
      <div className="space-y-4">
        {movies.slice(0, 5).map((movie) => {
          // Các suất chiếu mẫu cho phim này tại rạp
          const showtimesForMovie = [
            { id: "st-1", time: "18:15", format: "2D Phụ Đề", room: "Phòng 02" },
            { id: "st-2", time: "19:30", format: "2D Phụ Đề", room: "Phòng 03" },
            { id: "st-3", time: "20:45", format: "IMAX Laser", room: "Phòng IMAX 01" },
            { id: "st-4", time: "21:30", format: "2D Phụ Đề", room: "Phòng 02" },
            { id: "st-5", time: "22:15", format: "2D Lồng Tiếng", room: "Phòng 04" },
          ];

          return (
            <div
              key={movie.id}
              className="bg-[#12131A] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 hover:border-white/20 transition-all shadow-lg"
            >
              {/* Poster nhỏ và thông tin phim */}
              <div className="flex gap-4 md:w-80 shrink-0">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md border border-white/10 shrink-0"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {getAgeRatingBadge(movie.ageRating)}
                      <span className="text-[11px] text-gray-400 font-semibold">{movie.durationMinutes} phút</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base line-clamp-1 hover:text-red-400 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      {movie.genres.slice(0, 2).join(", ")}
                    </p>
                  </div>

                  <span className="text-[11px] text-yellow-500 font-bold flex items-center gap-1">
                    ⭐ {movie.voteAverage} / 10 IMDb
                  </span>
                </div>
              </div>

              {/* Bảng các khung giờ chiếu */}
              <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2.5 block">
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
                      className="group/btn px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-red-500 hover:bg-red-600/10 text-left transition-all hover:scale-105 active:scale-95"
                    >
                      <span className="block text-sm font-extrabold text-white group-hover/btn:text-red-400">
                        {st.time}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-cyan-400 font-semibold">{st.format}</span>
                        <span className="text-[9px] text-gray-500">• {st.room}</span>
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
