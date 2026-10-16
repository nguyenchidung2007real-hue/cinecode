"use client";

import React, { useState, useEffect } from "react";
import { Movie } from "@/types";
import { ChevronLeft, ChevronRight, Play, Ticket, Sparkles, Star } from "lucide-react";

interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  onWatchTrailer: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

interface DesignedBanner {
  id: string;
  movieId: string;
  movieTitle: string;
  tagline: string;
  releaseNote: string;
  badge: string;
  badgeBg: string;
  formatTag: string;
  bgGradient: string;
  bgImage: string;
  accentColor: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies = [],
  onWatchTrailer,
  onBookTicket,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Danh mục 5 Banner ngang Key Visual thiết kế đồ họa chuẩn phong cách rạp chiếu phim CGV
  const designedBanners: DesignedBanner[] = [
    {
      id: "b-dune-2",
      movieId: "dune-2",
      movieTitle: "DUNE: PHẦN HAI",
      tagline: "SIÊU BOM TẤN KHOA HỌC VIỄN TƯỞNG ĐOẠT GIẢI OSCAR",
      releaseNote: "TRẢI NGHIỆM ĐỈNH CAO VỚI ĐỊNH DẠNG IMAX LASER 4K",
      badge: "KHỞI CHIẾU TOÀN QUỐC",
      badgeBg: "bg-amber-500 text-neutral-900",
      formatTag: "IMAX Laser 4K • 2D Digital",
      bgGradient: "from-[#1a0f07] via-[#3b1d08] to-[#120a05]",
      bgImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
      accentColor: "#e5a93b",
    },
    {
      id: "b-godzilla-kong",
      movieId: "godzilla-x-kong",
      movieTitle: "GODZILLA X KONG: ĐẾ CHẾ MỚI",
      tagline: "HAI ĐẠI QUÁI THÚ BẮT TAY TRONG TRẬN CHIẾN TRÁI ĐẤT RỖNG",
      releaseNote: "HIỆU ỨNG GHẾ RUNG & GIÓ NƯỚC SỐNG ĐỘNG TẠI PHÒNG 4DX",
      badge: "BOM TẤN HÀNH ĐỘNG",
      badgeBg: "bg-rose-600 text-white",
      formatTag: "4DX Motion • IMAX 3D",
      bgGradient: "from-[#08151f] via-[#122e3d] to-[#0a1b24]",
      bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
      accentColor: "#38bdf8",
    },
    {
      id: "b-conan",
      movieId: "conan-movie-27",
      movieTitle: "CONAN: NGÔI SAO 5 CÁNH 1 TRIỆU ĐÔ",
      tagline: "SIÊU ĐẠO CHÍCH KID ĐỐI ĐẦU CONAN & HEIJI HATTORI",
      releaseNote: "TẶNG THẺ SƯU TẦM BẢN QUYỀN VÀ POSTER HOLOGRAM ĐỘC QUYỀN",
      badge: "ANIME BOM TẤN SỐ 1 NHẬT BẢN",
      badgeBg: "bg-emerald-600 text-white",
      formatTag: "2D Lồng Tiếng • Phụ Đề",
      bgGradient: "from-[#1a0a2a] via-[#351457] to-[#140624]",
      bgImage: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&auto=format&fit=crop&q=80",
      accentColor: "#c084fc",
    },
    {
      id: "b-doraemon",
      movieId: "doraemon-earth-symphony",
      movieTitle: "DORAEMON: BẢN GIAO HƯỞNG ĐỊA CẦU",
      tagline: "GIAI ĐIỆU ÂM NHẠC KỲ DIỆU GIẢI CỨU TRÁI ĐẤT KHỎI DIỆT VONG",
      releaseNote: "ƯU ĐÃI ĐỒNG GIÁ VÉ TRẺ EM & COMBO LY NƯỚC NHÂN VẬT",
      badge: "PHIM HOẠT HÌNH GIA ĐÌNH",
      badgeBg: "bg-sky-500 text-white",
      formatTag: "2D Lồng Tiếng Chuẩn Rạp",
      bgGradient: "from-[#051c2c] via-[#0b3c5d] to-[#041624]",
      bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
      accentColor: "#38bdf8",
    },
    {
      id: "b-happy-wednesday",
      movieId: "dune-2",
      movieTitle: "CINEMAX HAPPY WEDNESDAY",
      tagline: "NGÀY THỨ TƯ VUI VẺ - ĐỒNG GIÁ VÉ 45.000Đ TOÀN BỘ CỤM RẠP",
      releaseNote: "MIỄN HOÀN TOÀN PHỤ THU GHẾ VIP • ÁP DỤNG CẢ TUẦN THỨ 4",
      badge: "ƯU ĐÃI ĐẶC QUYỀN THÀNH VIÊN",
      badgeBg: "bg-amber-400 text-neutral-900",
      formatTag: "Áp dụng toàn bộ hệ thống CineMax",
      bgGradient: "from-[#660c07] via-[#a8140a] to-[#450502]",
      bgImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80",
      accentColor: "#facc15",
    },
  ];

  const total = designedBanners.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const activeBanner = designedBanners[currentIndex];
  const targetMovie = movies.find((m) => m.id === activeBanner.movieId) || movies[0];

  const handleClickBanner = () => {
    if (targetMovie) {
      onBookTicket(targetMovie);
    }
  };

  return (
    <section className="w-full select-none" aria-label="Hero Banner CineMax">
      {/* KHUNG CHUẨN 1080px ĐÓNG KHUNG CĂN GIỮA THEO ĐÚNG CHẤT CGV */}
      <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={handleClickBanner}
          className="relative w-full aspect-[980/448] sm:aspect-[980/420] rounded-2xl overflow-hidden border-3 border-neutral-900 shadow-2xl group cursor-pointer bg-neutral-900"
        >
          {/* Background Image với hiệu ứng chuyển đổi Key Visual */}
          <div
            key={activeBanner.id}
            className={`absolute inset-0 bg-gradient-to-r ${activeBanner.bgGradient} transition-all duration-700`}
          >
            {/* Ảnh nền mờ kết hợp ánh sáng điện ảnh */}
            <img
              src={activeBanner.bgImage}
              alt={activeBanner.movieTitle}
              className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay scale-105 group-hover:scale-100 transition-transform duration-700"
            />
            {/* Lớp phủ điện ảnh sâu lắng */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
          </div>

          {/* NỘI DUNG NGHỆ THUẬT TÍCH HỢP TRONG BANNER (POSTER KEY VISUAL ART) */}
          <div className="relative z-10 w-full h-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between text-white">
            {/* Top Bar Banner: Logo & Badge sự kiện */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tighter text-white drop-shadow-md">
                  CINE<span className="text-[#e71a0f]">MAX</span>
                </span>
                <span className="text-amber-300 text-xs">✦</span>
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest hidden sm:inline">
                  CULTUREPLEX
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${activeBanner.badgeBg}`}>
                  {activeBanner.badge}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {activeBanner.formatTag}
                </span>
              </div>
            </div>

            {/* Middle: Typography nghệ thuật tên phim chuẩn Key Visual rạp */}
            <div className="max-w-2xl space-y-1.5 sm:space-y-2 my-auto">
              <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase drop-shadow block" style={{ color: activeBanner.accentColor }}>
                {activeBanner.tagline}
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {activeBanner.movieTitle}
              </h1>

              <p className="text-[11px] sm:text-xs text-neutral-200 line-clamp-2 max-w-xl font-medium drop-shadow leading-relaxed">
                {activeBanner.releaseNote}
              </p>
            </div>

            {/* Bottom: Nút bấm trực quan & Hướng dẫn bấm */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetMovie) onBookTicket(targetMovie);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/40 flex items-center gap-1.5 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>ĐẶT VÉ NGAY</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetMovie) onWatchTrailer(targetMovie);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Xem Trailer</span>
                </button>
              </div>

              <span className="text-[10px] text-neutral-300 font-medium hidden sm:inline-block">
                Bấm vào banner để xem lịch chiếu & đặt vé ➔
              </span>
            </div>
          </div>

          {/* MŨI TÊN CHUYỂN SLIDE TRÁI / PHẢI CHUẨN CGV */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide trước"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide tiếp theo"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* THANH CHẤM CHỈ SỐ SLIDE (DOTS) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            {designedBanners.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 h-1.5 bg-[#e71a0f]"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white"
                }`}
                title={item.movieTitle}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
