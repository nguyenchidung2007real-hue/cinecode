"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Movie } from "@/types";
import { MOCK_CINEMAS, getShowtimesForMovie } from "@/lib/mockData";
import { Ticket, Film, MapPin, Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface QuickBookingBarProps {
  movies: Movie[];
  onQuickBook: (
    movie: Movie,
    cinemaName: string,
    date: string,
    time: string,
    format: string,
    showtimeId?: string
  ) => void;
  onRequestSelectMovie?: () => void;
}

function getVnDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatVnDisplayDate(dateStr: string, index: number): string {
  if (index === 0) return `Hôm nay (${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)})`;
  if (index === 1) return `Ngày mai (${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)})`;
  
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dowNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return `${dowNames[dayOfWeek]} (${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")})`;
}

export const QuickBookingBar: React.FC<QuickBookingBarProps> = ({ movies, onQuickBook, onRequestSelectMovie }) => {
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>("");

  // 8 ngày liên tiếp
  const dateOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const val = getVnDateString(i);
      return {
        value: val,
        label: formatVnDisplayDate(val, i),
      };
    });
  }, []);

  // Khi chọn phim
  const handleMovieChange = (movieId: string) => {
    setSelectedMovieId(movieId);
    if (!selectedCinemaId) {
      setSelectedCinemaId(MOCK_CINEMAS[0].id);
    }
    if (!selectedDate) {
      setSelectedDate(dateOptions[0].value);
    }
    setSelectedShowtimeId("");
  };

  // Khi chọn rạp
  const handleCinemaChange = (cinemaId: string) => {
    setSelectedCinemaId(cinemaId);
    if (!selectedDate) {
      setSelectedDate(dateOptions[0].value);
    }
    setSelectedShowtimeId("");
  };

  // Khi chọn ngày
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedShowtimeId("");
  };

  // Lọc danh sách suất chiếu khả dụng
  const availableShowtimes = useMemo(() => {
    if (!selectedMovieId || !selectedCinemaId || !selectedDate) return [];
    return getShowtimesForMovie(selectedMovieId).filter(
      (st) => st.cinemaId === selectedCinemaId && st.date === selectedDate
    );
  }, [selectedMovieId, selectedCinemaId, selectedDate]);

  useEffect(() => {
    if (availableShowtimes.length > 0 && !selectedShowtimeId) {
      setSelectedShowtimeId(availableShowtimes[0].id);
    }
  }, [availableShowtimes, selectedShowtimeId]);

  const currentMovie = useMemo(
    () => movies.find((m) => String(m.id) === String(selectedMovieId)),
    [movies, selectedMovieId]
  );

  const currentCinema = useMemo(
    () => MOCK_CINEMAS.find((c) => c.id === selectedCinemaId),
    [selectedCinemaId]
  );

  const currentShowtime = useMemo(
    () => availableShowtimes.find((st) => st.id === selectedShowtimeId),
    [availableShowtimes, selectedShowtimeId]
  );

  const isComplete = Boolean(
    selectedMovieId && selectedCinemaId && selectedDate && selectedShowtimeId && currentMovie && currentCinema
  );

  const handleBookNow = () => {
    if (!currentMovie) {
      if (onRequestSelectMovie) {
        onRequestSelectMovie();
      }
      return;
    }
    const cinema = currentCinema || MOCK_CINEMAS[0];
    const date = selectedDate || dateOptions[0]?.value;
    const st = currentShowtime || availableShowtimes[0];
    if (currentMovie && cinema && date) {
      onQuickBook(
        currentMovie,
        cinema.name,
        date,
        st?.time || "19:00",
        st?.format || "2D Phụ Đề",
        st?.id
      );
    }
  };

  return (
    <section className="relative w-full z-20" aria-label="Thanh đặt vé nhanh CineMax">
      <div className="bg-[#161922]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 shadow-2xl shadow-black/80 transition-all">
        {/* Header thanh đặt vé nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                ĐẶT VÉ NHANH CINEMAX
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-[#9CA3AF] font-medium">
                • 4 bước chọn nhanh vào thẳng sơ đồ ghế
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {isComplete ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng đặt vé
              </span>
            ) : (
              <span className="font-medium text-[#9CA3AF]">
                Vui lòng hoàn tất {selectedMovieId ? (selectedCinemaId ? (selectedDate ? "chọn suất chiếu" : "chọn ngày") : "chọn rạp") : "chọn phim"}
              </span>
            )}
          </div>
        </div>

        {/* 4 Khối Dropdown xếp ngang + Nút Mua Vé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* 1. Chọn Phim */}
          <div
            className={`rounded-lg px-3 py-2.5 border transition-all ${
              selectedMovieId
                ? "bg-[#12141C] border-white/20 hover:border-[#E50914]"
                : "bg-[#0B0C10]/80 border-white/10 hover:border-white/30"
            }`}
          >
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded bg-[#E50914] text-white text-[10px] font-black flex items-center justify-center">
                1
              </span>
              <Film className="w-3 h-3 text-[#E50914]" /> Chọn Phim
            </span>
            <select
              value={selectedMovieId}
              onChange={(e) => handleMovieChange(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer truncate"
            >
              <option value="" disabled className="bg-[#12141C] text-neutral-400">
                -- Chọn bộ phim --
              </option>
              {movies.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#12141C] text-white">
                  [{m.ageRating}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Rạp */}
          <div
            className={`rounded-lg px-3 py-2.5 border transition-all ${
              !selectedMovieId
                ? "opacity-50 bg-[#0B0C10] border-white/5 cursor-not-allowed"
                : selectedCinemaId
                ? "bg-[#12141C] border-white/20 hover:border-[#E50914]"
                : "bg-[#0B0C10]/80 border-white/10"
            }`}
          >
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                2
              </span>
              <MapPin className="w-3 h-3 text-[#E50914]" /> Chọn Rạp
            </span>
            <select
              disabled={!selectedMovieId}
              value={selectedCinemaId}
              onChange={(e) => handleCinemaChange(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer truncate disabled:cursor-not-allowed"
            >
              <option value="" disabled className="bg-[#12141C] text-neutral-400">
                -- Chọn cụm rạp CineMax --
              </option>
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#12141C] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Ngày */}
          <div
            className={`rounded-lg px-3 py-2.5 border transition-all ${
              !selectedCinemaId
                ? "opacity-50 bg-[#0B0C10] border-white/5 cursor-not-allowed"
                : selectedDate
                ? "bg-[#12141C] border-white/20 hover:border-[#E50914]"
                : "bg-[#0B0C10]/80 border-white/10"
            }`}
          >
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
              <Calendar className="w-3 h-3 text-[#E50914]" /> Chọn Ngày
            </span>
            <select
              disabled={!selectedCinemaId}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" disabled className="bg-[#12141C] text-neutral-400">
                -- Chọn ngày chiếu --
              </option>
              {dateOptions.map((d) => (
                <option key={d.value} value={d.value} className="bg-[#12141C] text-white">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Chọn Suất Chiếu */}
          <div
            className={`rounded-lg px-3 py-2.5 border transition-all ${
              !selectedDate || availableShowtimes.length === 0
                ? "opacity-50 bg-[#0B0C10] border-white/5 cursor-not-allowed"
                : selectedShowtimeId
                ? "bg-[#12141C] border-white/20 hover:border-[#E50914]"
                : "bg-[#0B0C10]/80 border-white/10"
            }`}
          >
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                4
              </span>
              <Clock className="w-3 h-3 text-[#E50914]" /> Suất Chiếu
            </span>
            <select
              disabled={!selectedDate || availableShowtimes.length === 0}
              value={selectedShowtimeId}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed truncate"
            >
              {availableShowtimes.length === 0 ? (
                <option value="" disabled className="bg-[#12141C] text-neutral-400">
                  {selectedDate ? "Hết suất cho ngày này" : "-- Chọn suất --"}
                </option>
              ) : (
                availableShowtimes.map((st) => (
                  <option key={st.id} value={st.id} className="bg-[#12141C] text-white">
                    {st.time} - {st.format} ({st.roomName})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 5. Nút Mua Vé Nhanh (CTA) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleBookNow}
              className={`w-full py-3.5 px-4 rounded-lg font-heading font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                isComplete
                  ? "bg-gradient-to-r from-[#E50914] to-[#B80710] hover:from-[#f01a24] hover:to-[#cf0812] text-white shadow-xl shadow-red-600/40 hover:-translate-y-0.5 border border-red-500/50"
                  : "bg-gradient-to-r from-red-950/80 via-red-900/40 to-neutral-900/90 hover:from-red-900/80 hover:to-neutral-800 text-red-200 border border-red-600/40 shadow-lg shadow-red-950/40 hover:border-red-500"
              }`}
            >
              <span>{currentMovie ? "MUA VÉ NGAY" : "CHỌN PHIM ĐẶT VÉ"}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
