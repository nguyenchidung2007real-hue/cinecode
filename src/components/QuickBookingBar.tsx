"use client";

import React, { useState, useMemo } from "react";
import { Movie, Cinema } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES } from "@/lib/mockData";
import { Ticket, Film, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";

interface QuickBookingBarProps {
  movies: Movie[];
  onQuickBook: (movie: Movie, cinemaName: string, date: string, time: string, format: string) => void;
}

function getVnDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const QuickBookingBar: React.FC<QuickBookingBarProps> = ({ movies, onQuickBook }) => {
  const [selectedMovieId, setSelectedMovieId] = useState<string | number>(movies[0]?.id || "");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(() => getVnDateString(0));
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

  const todayStr = getVnDateString(0);
  const tomorrowStr = getVnDateString(1);
  const dayAfterStr = getVnDateString(2);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 sm:-mt-10 z-30">
      <div className="bg-[#0B2046]/95 border border-[#034EA2]/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_15px_40px_rgba(3,78,162,0.4)] backdrop-blur-xl">
        
        {/* Header nhỏ thanh đặt vé nhanh */}
        <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FF5722]/20 border border-[#FF5722]/40 flex items-center justify-center text-[#FF5722]">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-white tracking-wide">
              ĐẶT VÉ NHANH BETA 1-CLICK
            </span>
          </div>
          <span className="text-[11px] text-blue-200 hidden sm:inline font-medium">
            Chọn phim & rạp để vào thẳng sơ đồ chọn ghế
          </span>
        </div>

        {/* 4 Khối Dropdown xếp ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
          
          {/* 1. Chọn Phim */}
          <div className="bg-[#07152E]/80 border border-[#034EA2]/40 rounded-xl px-3 py-2 hover:border-[#00B2FF] transition-colors">
            <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3 h-3 text-[#00B2FF]" /> 1. Chọn Phim
            </span>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0B2046] text-white">
                  [{m.ageRating}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Rạp */}
          <div className="bg-[#07152E]/80 border border-[#034EA2]/40 rounded-xl px-3 py-2 hover:border-[#00B2FF] transition-colors">
            <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FF5722]" /> 2. Chọn Rạp
            </span>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0B2046] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Ngày */}
          <div className="bg-[#07152E]/80 border border-[#034EA2]/40 rounded-xl px-3 py-2 hover:border-[#00B2FF] transition-colors">
            <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> 3. Chọn Ngày
            </span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              <option value={todayStr} className="bg-[#0B2046] text-white">Hôm nay ({todayStr})</option>
              <option value={tomorrowStr} className="bg-[#0B2046] text-white">Ngày mai ({tomorrowStr})</option>
              <option value={dayAfterStr} className="bg-[#0B2046] text-white">Ngày kia ({dayAfterStr})</option>
            </select>
          </div>

          {/* 4. Chọn Suất Chiếu */}
          <div className="bg-[#07152E]/80 border border-[#034EA2]/40 rounded-xl px-3 py-2 hover:border-[#00B2FF] transition-colors">
            <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> 4. Suất Chiếu
            </span>
            <select
              value={selectedShowtimeId || availableShowtimes[0]?.id}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              {availableShowtimes.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#0B2046] text-white">
                  {st.time} - {st.format} ({st.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Nút Mua Vé Nhanh */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleBookNow}
              className="w-full h-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#034EA2] via-[#0070BA] to-[#00B2FF] hover:from-[#0070BA] hover:to-[#38B6FF] text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#034EA2]/60 hover:shadow-[#00B2FF]/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-white/20"
            >
              <span>MUA VÉ NGAY</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
