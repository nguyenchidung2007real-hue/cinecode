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
  posterImage: string;
  accentColor: string;
  titleGradient: string;
  ageRating?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies = [],
  onWatchTrailer,
  onBookTicket,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Danh mục 5 Banner ngang Key Visual nghệ thuật điện ảnh chuẩn rạp chiếu phim CGV & CineMax
  const designedBanners: DesignedBanner[] = [
    {
      id: "b-dune-2",
      movieId: "dune-2",
      movieTitle: "DUNE: PHẦN HAI",
      tagline: "SIÊU BOM TẤN KHOA HỌC VIỄN TƯỞNG ĐOẠT GIẢI OSCAR",
      releaseNote: "TRẢI NGHIỆM ĐỈNH CAO VỚI ĐỊNH DẠNG IMAX LASER 4K VÀ ÂM THANH RUNG CHUYỂN",
      badge: "KHỞI CHIẾU TOÀN QUỐC",
      badgeBg: "bg-amber-500 text-neutral-900 font-black",
      formatTag: "IMAX Laser 4K • 2D Digital",
      bgGradient: "from-[#1a0f07] via-[#3b1d08] to-[#120a05]",
      bgImage: "/images/posters/dune-2-backdrop.jpg",
      posterImage: "/images/posters/dune-2.jpg",
      accentColor: "#f59e0b",
      titleGradient: "from-amber-200 via-amber-400 to-orange-500",
      ageRating: "T16",
    },
    {
      id: "b-godzilla-kong",
      movieId: "godzilla-x-kong",
      movieTitle: "GODZILLA X KONG: ĐẾ CHẾ MỚI",
      tagline: "HAI ĐẠI QUÁI THÚ BẮT TAY TRONG TRẬN CHIẾN TRÁI ĐẤT RỖNG",
      releaseNote: "HIỆU ỨNG GHẾ RUNG ĐA CHIỀU & GIÓ NƯỚC SỐNG ĐỘNG TẠI PHÒNG 4DX",
      badge: "BOM TẤN HÀNH ĐỘNG",
      badgeBg: "bg-rose-600 text-white font-black",
      formatTag: "4DX Motion • IMAX 3D",
      bgGradient: "from-[#08151f] via-[#122e3d] to-[#0a1b24]",
      bgImage: "/images/posters/godzilla-x-kong-backdrop.jpg",
      posterImage: "/images/posters/godzilla-x-kong.jpg",
      accentColor: "#38bdf8",
      titleGradient: "from-cyan-200 via-sky-400 to-rose-400",
      ageRating: "T13",
    },
    {
      id: "b-conan",
      movieId: "conan-movie-27",
      movieTitle: "CONAN: NGÔI SAO 5 CÁNH 1 TRIỆU ĐÔ",
      tagline: "SIÊU ĐẠO CHÍCH KID ĐỐI ĐẦU CONAN & HEIJI HATTORI",
      releaseNote: "TẶNG THẺ SƯU TẦM BẢN QUYỀN VÀ POSTER HOLOGRAM ĐỘC QUYỀN TẠI QUẦY",
      badge: "ANIME SỐ 1 NHẬT BẢN",
      badgeBg: "bg-emerald-600 text-white font-black",
      formatTag: "2D Lồng Tiếng • Phụ Đề",
      bgGradient: "from-[#1a0a2a] via-[#351457] to-[#140624]",
      bgImage: "/images/posters/conan-backdrop.jpg",
      posterImage: "/images/posters/conan-movie-27.jpg",
      accentColor: "#c084fc",
      titleGradient: "from-purple-200 via-fuchsia-400 to-pink-500",
      ageRating: "T13",
    },
    {
      id: "b-doraemon",
      movieId: "doraemon-earth-symphony",
      movieTitle: "DORAEMON: BẢN GIAO HƯỞNG ĐỊA CẦU",
      tagline: "GIAI ĐIỆU ÂM NHẠC KỲ DIỆU GIẢI CỨU TRÁI ĐẤT KHỎI DIỆT VONG",
      releaseNote: "ƯU ĐÃI ĐỒNG GIÁ VÉ TRẺ EM & COMBO LY NƯỚC NHÂN VẬT ĐỘC QUYỀN",
      badge: "HOẠT HÌNH GIA ĐÌNH",
      badgeBg: "bg-sky-500 text-white font-black",
      formatTag: "2D Lồng Tiếng Chuẩn Rạp",
      bgGradient: "from-[#051c2c] via-[#0b3c5d] to-[#041624]",
      bgImage: "/images/posters/doraemon-backdrop.jpg",
      posterImage: "/images/posters/doraemon-earth-symphony.jpg",
      accentColor: "#38bdf8",
      titleGradient: "from-sky-200 via-blue-400 to-teal-300",
      ageRating: "P",
    },
    {
      id: "b-happy-wednesday",
      movieId: "dune-2",
      movieTitle: "CINEMAX HAPPY WEDNESDAY",
      tagline: "NGÀY THỨ TƯ VUI VẺ - ĐỒNG GIÁ VÉ 45.000Đ TOÀN BỘ CỤM RẠP",
      releaseNote: "MIỄN HOÀN TOÀN PHỤ THU GHẾ VIP • ÁP DỤNG CẢ NGÀY THỨ 4 HÀNG TUẦN",
      badge: "ƯU ĐÃI ĐẶC BIỆT",
      badgeBg: "bg-amber-400 text-neutral-900 font-black",
      formatTag: "Toàn bộ hệ thống CineMax",
      bgGradient: "from-[#660c07] via-[#a8140a] to-[#450502]",
      bgImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80",
      posterImage: "/images/posters/shaun-the-sheep.jpg",
      accentColor: "#facc15",
      titleGradient: "from-yellow-200 via-amber-400 to-rose-400",
      ageRating: "P",
    },
  ];

  const total = designedBanners.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);
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
          className="relative w-full aspect-[980/480] sm:aspect-[980/450] rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.5)] group cursor-pointer bg-black"
        >
          {/* Background Image với hiệu ứng đại cảnh điện ảnh rực rỡ */}
          <div
            key={activeBanner.id}
            className="absolute inset-0 bg-neutral-950 transition-all duration-700 overflow-hidden"
          >
            {/* Ảnh đại cảnh Backdrop gốc của phim */}
            <img
              src={activeBanner.bgImage}
              alt={activeBanner.movieTitle}
              className="absolute inset-0 w-full h-full object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-1000"
            />

            {/* Vầng sáng điện ảnh hắt từ poster ở góc phải */}
            <div
              className="absolute -right-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-45 pointer-events-none"
              style={{ backgroundColor: activeBanner.accentColor }}
            />

            {/* Gradient phủ mờ thông minh: Tối êm ái về bên trái để làm nổi bật chữ, mở sáng rực rỡ đại cảnh ở bên phải */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 via-35% to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
          </div>

          {/* NỘI DUNG NGHỆ THUẬT TÍCH HỢP TRONG BANNER (POSTER KEY VISUAL ART) */}
          <div className="relative z-10 w-full h-full p-4 sm:p-6 lg:p-7 flex flex-col justify-between text-white">
            {/* Top Bar Banner: Logo & Badge sự kiện */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  CINE<span className="text-[#e71a0f]">MAX</span>
                </span>
                <span className="text-amber-300 text-xs">✦</span>
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest hidden sm:inline">
                  CULTUREPLEX
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${activeBanner.badgeBg}`}>
                  {activeBanner.badge}
                </span>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/25 shadow-sm">
                  {activeBanner.formatTag}
                </span>
              </div>
            </div>

            {/* Middle: Bố cục 2 cột tạo ĐIỂM NHẤN ĐIỆN ẢNH VƯỢT TRỘI */}
            <div className="my-auto flex items-center justify-between gap-6 lg:gap-8">
              {/* Cột Trái: Typography nghệ thuật tên phim chuẩn Key Visual rạp */}
              <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeBanner.accentColor }} />
                  <span
                    className="text-[10px] sm:text-xs font-black tracking-widest uppercase drop-shadow block truncate"
                    style={{ color: activeBanner.accentColor }}
                  >
                    ✦ {activeBanner.tagline}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black tracking-tight uppercase leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                  <span className={`bg-gradient-to-r ${activeBanner.titleGradient} bg-clip-text text-transparent`}>
                    {activeBanner.movieTitle}
                  </span>
                </h1>

                <p className="text-[11px] sm:text-xs text-neutral-200 line-clamp-2 max-w-lg font-medium drop-shadow leading-relaxed">
                  {activeBanner.releaseNote}
                </p>

                {/* Dải nhãn công nghệ phòng chiếu nổi bật */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-neutral-900/80 border border-white/20 text-neutral-200 uppercase tracking-wider backdrop-blur-md shadow-sm">
                    {activeBanner.formatTag}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-[#e71a0f]/20 border border-[#e71a0f]/40 text-rose-300 uppercase tracking-wider backdrop-blur-md">
                    CineMax Cultureplex
                  </span>
                </div>
              </div>

              {/* Cột Phải: POSTER PHIM NỔI BẬT LỚN HƠN, ĐỔ BÓNG NỔI KHỐI */}
              <div className="relative shrink-0 flex items-center justify-center mr-2 sm:mr-5 lg:mr-8 my-auto">
                {/* Vầng hào quang sáng rực quanh Poster */}
                <div
                  className="absolute -inset-4 rounded-3xl opacity-60 blur-2xl transition-all duration-700 group-hover:opacity-90 group-hover:scale-110"
                  style={{ backgroundColor: activeBanner.accentColor }}
                />

                {/* Khung Poster nổi khối tỷ lệ 2/3 viền sáng đổ bóng sâu */}
                <div className="relative w-24 sm:w-36 md:w-44 lg:w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.95)] transform rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 bg-neutral-900 ring-1 ring-white/20">
                  <img
                    src={activeBanner.posterImage}
                    alt={activeBanner.movieTitle}
                    className="w-full h-full object-cover"
                  />
                  {/* Badge độ tuổi trên góc poster */}
                  {activeBanner.ageRating && (
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white shadow-lg ${
                          activeBanner.ageRating === "T18"
                            ? "bg-red-600"
                            : activeBanner.ageRating === "T16"
                            ? "bg-amber-600"
                            : activeBanner.ageRating === "T13"
                            ? "bg-yellow-500 text-neutral-900"
                            : "bg-sky-600"
                        }`}
                      >
                        {activeBanner.ageRating}
                      </span>
                    </div>
                  )}
                  {/* Huy hiệu rạp chiếu ở góc dưới poster */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-black text-amber-300 border border-amber-400/30 uppercase tracking-wider shadow">
                      CineMax
                    </span>
                  </div>
                  {/* Lớp phủ phản quang kính */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bottom: Nút bấm trực quan & Hướng dẫn bấm */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetMovie) onBookTicket(targetMovie);
                  }}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#e71a0f] to-[#ff2b1d] hover:from-[#c81007] hover:to-[#e71a0f] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(231,26,15,0.7)] flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
                >
                  <Ticket className="w-4 h-4" />
                  <span>ĐẶT VÉ NGAY</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetMovie) onWatchTrailer(targetMovie);
                  }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/30 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Xem Trailer</span>
                </button>
              </div>

              {/* Dot Indicators tích hợp tinh tế bên phải */}
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {designedBanners.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Slide ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      currentIndex === idx
                        ? "w-6 h-2 bg-[#e71a0f]"
                        : "w-2 h-2 bg-white/40 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
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
        </div>
      </div>
    </section>
  );
};
