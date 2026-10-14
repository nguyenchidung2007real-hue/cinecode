"use client";

import React, { useState, useMemo } from "react";
import { Movie, Cinema } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES, getShowtimesForMovie } from "@/lib/mockData";
import { Ticket, Film, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";

interface QuickBookingBarProps {
  movies: Movie[];
  onQuickBook: (movie: Movie, cinemaName: string, date: string, time: string, format: string, showtimeId?: string) => void;
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

  // Lọc suất chiếu phù hợp với phim, rạp và ngày đã chọn
  const availableShowtimes = useMemo(() => {
    const list = getShowtimesForMovie(selectedMovieId).filter(
      (st) => st.cinemaId === selectedCinemaId && st.date === selectedDate
    );
    if (list.length > 0) return list;
    return getShowtimesForMovie(selectedMovieId).filter((st) => st.cinemaId === selectedCinemaId);
  }, [selectedMovieId, selectedCinemaId, selectedDate]);

  const currentShowtime = useMemo(() => {
    return availableShowtimes.find((st) => st.id === selectedShowtimeId) || availableShowtimes[0];
  }, [availableShowtimes, selectedShowtimeId]);

  const handleBookNow = () => {
    if (!currentMovie) return;
    const st = currentShowtime || availableShowtimes[0];
    onQuickBook(
      currentMovie,
      currentCinema.name,
      selectedDate,
      st?.time || "19:30",
      st?.format || "2D Phụ Đề",
      st?.id
    );
  };

  const todayStr = getVnDateString(0);
  const tomorrowStr = getVnDateString(1);
  const dayAfterStr = getVnDateString(2);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 sm:-mt-10 z-30">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl backdrop-blur-xl">
        
        {/* Header nhỏ thanh đặt vé nhanh */}
        <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#e71a0f]">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-[#1c1c1c] tracking-wide uppercase">
              ĐẶT VÉ NHANH 1-CLICK
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
            Chọn phim & rạp để vào thẳng sơ đồ chọn ghế
          </span>
        </div>

        {/* 4 Khối Dropdown xếp ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
          
          {/* 1. Chọn Phim */}
          <div className="bg-[#faf8f2] border border-[#e5e0d8] rounded-xl px-3 py-2 hover:border-[#e71a0f] transition-colors">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3 h-3 text-[#e71a0f]" /> 1. Chọn Phim
            </span>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full bg-transparent border-none text-[#1c1c1c] text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id} className="bg-white text-slate-800">
                  [{m.ageRating}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Rạp */}
          <div className="bg-[#faf8f2] border border-[#e5e0d8] rounded-xl px-3 py-2 hover:border-[#e71a0f] transition-colors">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#e71a0f]" /> 2. Chọn Rạp
            </span>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full bg-transparent border-none text-[#1c1c1c] text-xs font-bold focus:outline-none cursor-pointer mt-0.5 truncate"
            >
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Ngày */}
          <div className="bg-[#faf8f2] border border-[#e5e0d8] rounded-xl px-3 py-2 hover:border-[#e71a0f] transition-colors">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#e71a0f]" /> 3. Chọn Ngày
            </span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent border-none text-[#1c1c1c] text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              <option value={todayStr} className="bg-white text-slate-800">Hôm nay ({todayStr})</option>
              <option value={tomorrowStr} className="bg-white text-slate-800">Ngày mai ({tomorrowStr})</option>
              <option value={dayAfterStr} className="bg-white text-slate-800">Ngày kia ({dayAfterStr})</option>
            </select>
          </div>

          {/* 4. Chọn Suất Chiếu */}
          <div className="bg-[#faf8f2] border border-[#e5e0d8] rounded-xl px-3 py-2 hover:border-[#e71a0f] transition-colors">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#e71a0f]" /> 4. Suất Chiếu
            </span>
            <select
              value={selectedShowtimeId || availableShowtimes[0]?.id}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full bg-transparent border-none text-[#1c1c1c] text-xs font-bold focus:outline-none cursor-pointer mt-0.5"
            >
              {availableShowtimes.map((st) => (
                <option key={st.id} value={st.id} className="bg-white text-slate-800">
                  {st.time} - {st.format} ({st.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Nút Mua Vé Nhanh */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleBookNow}
              className="w-full h-full py-3.5 px-4 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>MUA VÉ NGAY</span>
              <ArrowRight className="w-4 h-4 text-red-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
