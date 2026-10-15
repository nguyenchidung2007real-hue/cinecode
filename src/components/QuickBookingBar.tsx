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

export const QuickBookingBar: React.FC<QuickBookingBarProps> = ({ movies, onQuickBook }) => {
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>("");

  // 10 ngày liên tiếp
  const dateOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const val = getVnDateString(i);
      return {
        value: val,
        label: formatVnDisplayDate(val, i),
      };
    });
  }, []);

  // Khi người dùng chọn phim, kích hoạt bước 2 và tự động cascade
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

  // Tự động gán suất chiếu đầu tiên khi có danh sách suất chiếu mới
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
    if (!isComplete || !currentMovie || !currentCinema) return;
    const st = currentShowtime || availableShowtimes[0];
    onQuickBook(
      currentMovie,
      currentCinema.name,
      selectedDate,
      st?.time || "19:00",
      st?.format || "2D Phụ Đề",
      st?.id
    );
  };

  return (
    <section className="relative w-full z-20" aria-label="Thanh đặt vé nhanh CineMax">
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all">
        {/* Header nhỏ thanh đặt vé nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#e71a0f]">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-neutral-900 tracking-wide uppercase">
                ĐẶT VÉ NHANH CINEMAX
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-neutral-500 font-medium">
                • 4 bước chọn nhanh vào thẳng sơ đồ ghế
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            {isComplete ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng đặt vé
              </span>
            ) : (
              <span className="font-medium text-neutral-400">
                Vui lòng hoàn tất {selectedMovieId ? (selectedCinemaId ? (selectedDate ? "chọn suất chiếu" : "chọn ngày") : "chọn rạp") : "chọn phim"}
              </span>
            )}
          </div>
        </div>

        {/* 4 Khối Dropdown xếp ngang + Nút Mua Vé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* 1. Chọn Phim */}
          <div
            className={`rounded-xl px-3 py-2.5 border transition-all ${
              selectedMovieId
                ? "bg-neutral-50/80 border-neutral-300 hover:border-[#e71a0f]"
                : "bg-white border-neutral-200 hover:border-neutral-400 ring-2 ring-rose-500/10"
            }`}
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-[#e71a0f] text-[10px] font-black flex items-center justify-center">
                1
              </span>
              <Film className="w-3 h-3 text-[#e71a0f]" /> Chọn Phim
            </span>
            <select
              value={selectedMovieId}
              onChange={(e) => handleMovieChange(e.target.value)}
              className="w-full bg-transparent border-none text-neutral-900 text-xs font-bold focus:outline-none cursor-pointer truncate"
            >
              <option value="" disabled className="text-neutral-400">
                -- Chọn bộ phim --
              </option>
              {movies.map((m) => (
                <option key={m.id} value={m.id} className="text-neutral-800">
                  [{m.ageRating}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Rạp */}
          <div
            className={`rounded-xl px-3 py-2.5 border transition-all ${
              !selectedMovieId
                ? "opacity-60 bg-neutral-100 border-neutral-200 cursor-not-allowed"
                : selectedCinemaId
                ? "bg-neutral-50/80 border-neutral-300 hover:border-[#e71a0f]"
                : "bg-white border-neutral-300 ring-2 ring-rose-500/10"
            }`}
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-black flex items-center justify-center">
                2
              </span>
              <MapPin className="w-3 h-3 text-[#e71a0f]" /> Chọn Rạp
            </span>
            <select
              disabled={!selectedMovieId}
              value={selectedCinemaId}
              onChange={(e) => handleCinemaChange(e.target.value)}
              className="w-full bg-transparent border-none text-neutral-900 text-xs font-bold focus:outline-none cursor-pointer truncate disabled:cursor-not-allowed"
            >
              <option value="" disabled className="text-neutral-400">
                -- Chọn cụm rạp CineMax --
              </option>
              {MOCK_CINEMAS.map((c) => (
                <option key={c.id} value={c.id} className="text-neutral-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Ngày */}
          <div
            className={`rounded-xl px-3 py-2.5 border transition-all ${
              !selectedCinemaId
                ? "opacity-60 bg-neutral-100 border-neutral-200 cursor-not-allowed"
                : selectedDate
                ? "bg-neutral-50/80 border-neutral-300 hover:border-[#e71a0f]"
                : "bg-white border-neutral-300 ring-2 ring-rose-500/10"
            }`}
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-black flex items-center justify-center">
                3
              </span>
              <Calendar className="w-3 h-3 text-[#e71a0f]" /> Chọn Ngày
            </span>
            <select
              disabled={!selectedCinemaId}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-transparent border-none text-neutral-900 text-xs font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" disabled className="text-neutral-400">
                -- Chọn ngày chiếu --
              </option>
              {dateOptions.map((d) => (
                <option key={d.value} value={d.value} className="text-neutral-800">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Chọn Suất Chiếu */}
          <div
            className={`rounded-xl px-3 py-2.5 border transition-all ${
              !selectedDate || availableShowtimes.length === 0
                ? "opacity-60 bg-neutral-100 border-neutral-200 cursor-not-allowed"
                : selectedShowtimeId
                ? "bg-neutral-50/80 border-neutral-300 hover:border-[#e71a0f]"
                : "bg-white border-neutral-300 ring-2 ring-rose-500/10"
            }`}
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-black flex items-center justify-center">
                4
              </span>
              <Clock className="w-3 h-3 text-[#e71a0f]" /> Suất Chiếu
            </span>
            <select
              disabled={!selectedDate || availableShowtimes.length === 0}
              value={selectedShowtimeId}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full bg-transparent border-none text-neutral-900 text-xs font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed truncate"
            >
              {availableShowtimes.length === 0 ? (
                <option value="" disabled className="text-neutral-400">
                  {selectedDate ? "Hết suất cho ngày này" : "-- Chọn suất --"}
                </option>
              ) : (
                availableShowtimes.map((st) => (
                  <option key={st.id} value={st.id} className="text-neutral-800">
                    {st.time} - {st.format} ({st.roomName})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 5. Nút Mua Vé Nhanh */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              disabled={!isComplete}
              onClick={handleBookNow}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 ${
                isComplete
                  ? "bg-[#e71a0f] hover:bg-[#c81007] text-white shadow-lg shadow-rose-600/30 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-60 shadow-none"
              }`}
            >
              <span>MUA VÉ NGAY</span>
              <ArrowRight className={`w-4 h-4 ${isComplete ? "text-white" : "text-neutral-400"}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
