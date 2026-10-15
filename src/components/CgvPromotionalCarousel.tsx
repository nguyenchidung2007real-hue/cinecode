"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Popcorn, Sparkles, Gift, Ticket, ArrowRight, Heart, ShieldCheck, Film, Star } from "lucide-react";
import { Movie } from "@/types";

interface CgvPromotionalCarouselProps {
  movies?: Movie[];
  onSelectGenre?: (genre: string) => void;
  onOpenDetail?: (movie: Movie) => void;
  onBookTicket?: (movie: Movie) => void;
}

export const CgvPromotionalCarousel: React.FC<CgvPromotionalCarouselProps> = ({
  movies = [],
  onSelectGenre,
  onOpenDetail,
  onBookTicket,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = 5;

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[#d6cfbe] select-none group bg-neutral-900"
      style={{ minHeight: "440px" }}
    >
      {/* ============================================================ */}
      {/* SLIDE 1: CINEFAN - CHÍNH SÁCH ĐỘC QUYỀN THÀNH VIÊN CINEMAX */}
      {/* ============================================================ */}
      {currentSlide === 0 && (
        <div className="relative w-full h-[440px] sm:h-[460px] bg-gradient-to-br from-[#4b1d6f] via-[#c22055] to-[#f7941d] p-4 sm:p-7 flex flex-col justify-between overflow-hidden animate-in fade-in duration-500 text-white">
          {/* Logo CineMax ở góc trên bên trái */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-white drop-shadow">CINEMAX</span>
              <span className="text-amber-300 text-xs ml-0.5">✦</span>
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest hidden sm:inline">CULTUREPLEX</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-wider">
              Ưu Đãi Độc Quyền 2026
            </span>
          </div>

          {/* Nội dung trung tâm: 3 khối (Card Trái - Phone Marquee - Card Phải) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center my-auto">
            
            {/* Khối Trái: CINEMAX BIRTHDAY COMBO */}
            <div className="hidden md:flex md:col-span-3 bg-white/95 text-neutral-800 rounded-2xl p-3.5 shadow-xl border border-white/60 flex-col justify-center transform hover:scale-105 transition-all">
              <div className="text-center mb-2">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-[#e71a0f] text-white uppercase tracking-wider">
                  CINEMAX BIRTHDAY COMBO
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] font-bold text-neutral-700">
                <li className="flex items-start gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#e71a0f] shrink-0 mt-0.5 fill-current" />
                  <span>Miễn phí 1 bắp 2 nước vào tháng sinh nhật</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 fill-current" />
                  <span>Tặng 01 vé xem phim vào sinh nhật 23 tuổi</span>
                </li>
              </ul>
            </div>

            {/* Khối Giữa: CINEFAN VÀ KHUNG VÀNG MARQUEE (TÂM ĐIỂM ƯU ĐÃI) */}
            <div className="col-span-1 md:col-span-6 flex flex-col items-center justify-center text-center">
              {/* Logo CineFan cách điệu */}
              <div className="flex items-center gap-1 drop-shadow-lg mb-1">
                <span className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                  Cine
                </span>
                <span className="text-5xl sm:text-7xl font-black text-rose-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  Fan
                </span>
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-rose-300 fill-current animate-pulse ml-1" />
              </div>

              {/* Khung Vàng Marquee */}
              <div className="w-full max-w-sm bg-gradient-to-b from-[#ffdf00] via-[#ffd000] to-[#f39c12] rounded-2xl p-2.5 sm:p-3 shadow-2xl border-4 border-amber-200 text-neutral-900">
                <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider mb-1.5 shadow-sm">
                  CHÍNH SÁCH ĐỘC QUYỀN
                </span>

                <div className="space-y-1 bg-white/90 rounded-xl p-2 shadow-inner">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-neutral-800 uppercase">MUA VÉ ONLINE</span>
                    <span className="text-xs font-bold text-neutral-500">Chỉ từ</span>
                    <strong className="text-base sm:text-xl font-black text-[#e71a0f]">60.000đ</strong>
                  </div>

                  <div className="h-[1px] bg-neutral-200 my-1" />

                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-neutral-800 uppercase">MUA BẮP NƯỚC ONLINE</span>
                    <span className="text-xs font-bold text-neutral-500">Chỉ từ</span>
                    <strong className="text-base sm:text-xl font-black text-[#e71a0f]">79.000đ</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối Phải: ĐẶC QUYỀN THÀNH VIÊN */}
            <div className="hidden md:flex md:col-span-3 bg-white/95 text-neutral-800 rounded-2xl p-3.5 shadow-xl border border-white/60 flex-col justify-center transform hover:scale-105 transition-all">
              <div className="text-center mb-2">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-neutral-900 uppercase tracking-wider">
                  ĐẶC QUYỀN THÀNH VIÊN
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] font-bold text-neutral-700">
                <li className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hoàn vé chủ động 2 lượt / tháng tiện lợi</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 fill-current" />
                  <span>Tích lũy điểm thưởng, giảm giá lần mua sau</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Họa tiết trang trí nổi */}
          <div className="absolute left-6 bottom-4 opacity-40 md:opacity-80 pointer-events-none flex items-center gap-2">
            <Popcorn className="w-12 h-12 text-amber-300 drop-shadow" />
            <div className="w-8 h-8 rounded-full bg-rose-500/50 blur-md" />
          </div>
          <div className="absolute right-6 top-6 opacity-40 md:opacity-80 pointer-events-none">
            <Ticket className="w-12 h-12 text-rose-200 rotate-12 drop-shadow" />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SLIDE 2: CINEMAX HAPPY WEDNESDAY - THỨ 4 VUI VẺ 45.000đ */}
      {/* ============================================================ */}
      {currentSlide === 1 && (
        <div className="relative w-full h-[440px] sm:h-[460px] bg-gradient-to-r from-[#e71a0f] via-[#b71007] to-[#800700] p-6 sm:p-10 flex flex-col justify-between overflow-hidden animate-in fade-in duration-500 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white drop-shadow">CINEMAX</span>
              <span className="font-black text-2xl tracking-tight text-amber-300">HAPPY DAY</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-neutral-900 uppercase tracking-wider">
              Thứ 4 Hàng Tuần
            </span>
          </div>

          <div className="relative z-10 max-w-xl space-y-3 my-auto">
            <span className="text-xs font-bold text-amber-200 uppercase tracking-widest block">
              Chương Trình Ưu Đãi Truyền Thống Được Yêu Thích Nhất
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase drop-shadow-md">
              CINEMAX HAPPY WEDNESDAY
            </h2>
            <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase text-amber-200 font-bold">Đồng Giá Vé:</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-300">45.000đ</span>
                <span className="text-xs text-white/80">/ vé 2D</span>
              </div>
              <p className="text-xs text-neutral-200 mt-1">
                ⭐ Miễn hoàn toàn phụ thu ghế VIP • Áp dụng mọi suất chiếu Thứ 4 toàn quốc
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#commercial-tabs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-900 font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Đặt vé thứ 4 ngay</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SLIDE 3: ĐẶC QUYỀN THÀNH VIÊN U22 PASS (45K - 50K) */}
      {/* ============================================================ */}
      {currentSlide === 2 && (
        <div className="relative w-full h-[440px] sm:h-[460px] bg-gradient-to-r from-[#1c1c1c] via-[#2d2538] to-[#1c1c1c] p-6 sm:p-10 flex flex-col justify-between overflow-hidden animate-in fade-in duration-500 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white drop-shadow">CINEMAX</span>
              <span className="font-black text-2xl tracking-tight text-[#ff4d42]">MEMBER</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#e71a0f] text-white uppercase tracking-wider">
              Dành Cho Khán Giả 12 - 22 Tuổi
            </span>
          </div>

          <div className="relative z-10 max-w-xl space-y-3 my-auto">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Ưu Đãi Học Sinh - Sinh Viên & Gen Z
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase drop-shadow-md">
              ĐẶC QUYỀN CINEMAX U22 PASS
            </h2>
            <div className="inline-block bg-neutral-800/80 backdrop-blur-md border border-neutral-700 rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase text-neutral-300 font-bold">Giá Vé Chỉ Từ:</span>
                <span className="text-3xl sm:text-4xl font-black text-[#ff4d42]">45k - 50k</span>
                <span className="text-xs text-neutral-300">+ Giảm 20% Combo Solo</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1">
                🍿 Tặng thêm 01 bắp rang bơ phô mai nóng giòn miễn phí trong tuần lễ sinh nhật!
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#promo-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Xem điều kiện & Đăng ký</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SLIDE 4: ĐẠI TIỆC PHIM HOẠT HÌNH & QUÀ TẶNG ANIME 2026 */}
      {/* ============================================================ */}
      {currentSlide === 3 && (
        <div className="relative w-full h-[440px] sm:h-[460px] bg-gradient-to-r from-[#0d5c3a] via-[#117a4e] to-[#0a422a] p-6 sm:p-10 flex flex-col justify-between overflow-hidden animate-in fade-in duration-500 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white drop-shadow">CINEMAX</span>
              <span className="font-black text-2xl tracking-tight text-emerald-300">ANIMATION</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-neutral-900 uppercase tracking-wider">
              Lễ Hội Hoạt Hình 2026
            </span>
          </div>

          <div className="relative z-10 max-w-xl space-y-3 my-auto">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest block">
              Doraemon • Thám Tử Conan • Shaun the Sheep • Kung Fu Panda
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase drop-shadow-md">
              ĐẠI TIỆC PHIM HOẠT HÌNH
            </h2>
            <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">TẶNG THẺ HOLOGRAM</span>
                <span className="text-xs text-white/80">Số lượng có hạn</span>
              </div>
              <p className="text-xs text-neutral-200 mt-1">
                Tặng kèm thẻ nhân vật anime bản quyền chính hãng khi mua từ 2 vé xem phim hoạt hình!
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (onSelectGenre) onSelectGenre("Hoạt hình");
                  const el = document.getElementById("commercial-tabs");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-emerald-900 font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Lọc phim hoạt hình ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SLIDE 5: CULTUREPLEX - RẠP ĐẶC BIỆT IMAX & 4DX */}
      {/* ============================================================ */}
      {currentSlide === 4 && (
        <div className="relative w-full h-[440px] sm:h-[460px] bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 sm:p-10 flex flex-col justify-between overflow-hidden animate-in fade-in duration-500 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white drop-shadow">CINEMAX</span>
              <span className="font-black text-2xl tracking-tight text-[#ff4d42]">SPECIAL</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#e71a0f] text-white uppercase tracking-wider">
              Cultureplex
            </span>
          </div>

          <div className="relative z-10 max-w-xl space-y-3 my-auto">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
              Công Nghệ Chiếu Phim Vượt Xa Khung Hình
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase drop-shadow-md">
              IMAX LASER & 4DX MOTION
            </h2>
            <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">TRẢI NGHIỆM 7 TẦNG</span>
                <span className="text-xs text-white/80">Âm thanh 12 kênh</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1">
                Ghế chuyển động 3 chiều, hiệu ứng gió, nước, mùi hương và sương mù chân thực nhất.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#special-cinema-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Khám phá rạp đặc biệt</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ĐIỀU HƯỚNG MŨI TÊN TRÁI & PHẢI */}
      {/* ============================================================ */}
      <button
        onClick={handlePrev}
        aria-label="Slide trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/30 shadow-xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Slide tiếp theo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/30 shadow-xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* ============================================================ */}
      {/* HÀNG CHẤM TRÒN CHỈ SỐ SLIDE (DOTS) */}
      {/* ============================================================ */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Chuyển đến slide ${idx + 1}`}
            className={`transition-all rounded-full cursor-pointer ${
              currentSlide === idx
                ? "w-6 h-2 bg-[#e71a0f] shadow-sm"
                : "w-2 h-2 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
