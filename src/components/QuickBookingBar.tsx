"use client";

import React, { useState, useMemo } from "react";
import { Movie, Cinema } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES } from "@/lib/mockData";
import { Ticket, Film, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";

interface QuickBookingBarProps {
  movies: Movie[];
  onQuickBook: (movie: Movie, cinemaName: string, date: string, time: string, format: string) => void;
}

export const QuickBookingBar: React.FC<QuickBookingBarProps> = ({ movies, onQuickBook }) => {
  const [selectedMovieId, setSelectedMovieId] = useState<string | number>(movies[0]?.id || "");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-24");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>("");

  const currentMovie = useMemo(
    () => movies.find((m) => m.id.toString() === selectedMovieId.toString()) || movies[0],
    [movies, selectedMovieId]
  );

  const currentCinema = useMemo(
    () => MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0],
    [selectedCinemaId]
  );

  // Lọc suất chiếu phù hợp
  const availableShowtimes = useMemo(() => {
    return MOCK_SHOWTIMES.filter((st) => st.cinemaId === selectedCinemaId || st.cinemaId === "beta-cinemas-xuan-thuy");
  }, [selectedCinemaId]);

  const currentShowtime = useMemo(() => {
    return availableShowtimes.find((st) => st.id === selectedShowtimeId) || availableShowtimes[0];
  }, [availableShowtimes, selectedShowtimeId]);

  const handleBookNow = () => {
    if (!currentMovie || !currentShowtime) return;
    onQuickBook(
      currentMovie,
      currentCinema.name,
      selectedDate,
      currentShowtime.time,
      currentShowtime.format
    );
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 sm:-mt-10 z-30">
      <div className="bg-[#12131A]/95 border border-white/15 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        
        {/* Header nhỏ thanh đặt vé nhanh */}
        <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
              ĐẶT VÉ NHANH 1-CLICK (QUICK TICKET)
            </span>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Chọn phim & rạp để vào thẳng sơ đồ chọn ghế
          </span>
        </div>

        {/* 4 Khối Dropdown xếp ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
          
          {/* 1. Chọn Phim */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 hover:border-red-500/50 transition-colors">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3 h-3 text-red-500" /> 1. Chọn Phim
            </span>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#14151B] text-white">
                  [{m.ageRating}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Rạp */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 hover:border-red-500/50 transition-colors">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" /> 2. Chọn Rạp
            </span>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#14151B] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Ngày */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 hover:border-red-500/50 transition-colors">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-red-500" /> 3. Chọn Ngày
            </span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              <option value="2026-09-24" className="bg-[#14151B] text-white">Hôm nay (26/09)</option>
              <option value="2026-09-25" className="bg-[#14151B] text-white">Ngày mai (27/09)</option>
              <option value="2026-09-26" className="bg-[#14151B] text-white">Chủ Nhật (28/09)</option>
            </select>
          </div>

          {/* 4. Chọn Suất Chiếu */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 hover:border-red-500/50 transition-colors">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" /> 4. Suất Chiếu
            </span>
            <select
              value={selectedShowtimeId || availableShowtimes[0]?.id}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              {availableShowtimes.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#14151B] text-white">
                  {st.time} - {st.format} ({st.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Nút Mua Vé Nhanh */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleBookNow}
              className="w-full h-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 hover:shadow-red-800/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>MUA VÉ NGAY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
