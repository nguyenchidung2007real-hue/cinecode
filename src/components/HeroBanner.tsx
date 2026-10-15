"use client";

import React, { useState, useEffect } from "react";
import { Movie } from "@/types";
import { Play, Ticket, Star, Clock, Calendar, ChevronLeft, ChevronRight, Sparkles, Flame } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  onWatchTrailer: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies = [],
  onWatchTrailer,
  onBookTicket,
}) => {
  // Ưu tiên danh sách movies nếu có, tối thiểu 3-5 phim bom tấn để trượt carousel
  const bannerList = movies.length > 0 ? movies.slice(0, 5) : movie ? [movie] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentMovie = bannerList[currentIndex] || movie;

  // Tự động xoay vòng slide sau mỗi 5 giây
  useEffect(() => {
    if (bannerList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerList.length, isPaused]);

  if (!currentMovie) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bannerList.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[540px] sm:h-[600px] lg:h-[660px] overflow-hidden select-none group"
    >
      {/* Background Image với hiệu ứng chuyển đổi mượt mà */}
      <div
        key={currentMovie.id}
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform scale-100 animate-in fade-in zoom-in-105"
        style={{ backgroundImage: `url(${currentMovie.backdropPath || currentMovie.posterPath})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#fdfcf0] via-[#fdfcf0]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fdfcf0] via-[#fdfcf0]/85 to-transparent" />
      </div>

      {/* Nội dung Banner */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 sm:pb-20 z-10">
        <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Badge & Thể loại */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded font-black bg-[#e71a0f] text-white shadow-md uppercase tracking-wider">
              {currentMovie.ageRating || "P"}
            </span>

            <span className="px-2.5 py-0.5 rounded font-bold bg-white/95 text-neutral-800 border border-[#e5e0d8] shadow-sm">
              {currentMovie.genres.join(" • ")}
            </span>

            {currentMovie.genres.includes("Hoạt hình") && (
              <span className="px-2.5 py-0.5 rounded font-black bg-amber-500 text-white shadow-sm flex items-center gap-1">
                ⭐ SIÊU PHẨM HOẠT HÌNH
              </span>
            )}

            <div className="flex items-center gap-1 text-amber-600 font-bold bg-white/95 px-2.5 py-0.5 rounded border border-[#e5e0d8] shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>{currentMovie.voteAverage}</span>
              <span suppressHydrationWarning className="text-neutral-500 font-normal">
                ({formatNumber(currentMovie.voteCount)} vote)
              </span>
            </div>
          </div>

          {/* Tiêu đề phim */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1c1c1c] tracking-tight leading-tight uppercase drop-shadow-sm">
            {currentMovie.title}
          </h1>

          {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
            <p className="text-sm sm:text-base font-medium text-neutral-600 italic">
              {currentMovie.originalTitle} ({currentMovie.releaseDate?.split("-")[0] || "2024"})
            </p>
          )}

          {/* Thời lượng & Đạo diễn */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#e71a0f]" />
              <span>{currentMovie.durationMinutes} phút</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#e71a0f]" />
              <span>Khởi chiếu: <strong className="text-neutral-900">{currentMovie.releaseDate}</strong></span>
            </div>
            <span>Đạo diễn: <strong className="text-neutral-900">{currentMovie.director}</strong></span>
          </div>

          {/* Tóm tắt */}
          <p className="text-xs sm:text-sm text-neutral-700 line-clamp-3 leading-relaxed font-normal">
            {currentMovie.overview}
          </p>

          {/* Nhóm nút bấm hành động chuẩn CGV Cultureplex */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onBookTicket(currentMovie)}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#e71a0f]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>ĐẶT VÉ NGAY</span>
            </button>

            <button
              onClick={() => onWatchTrailer(currentMovie)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-sm border border-[#e5e0d8] shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-neutral-900" />
              <span>Xem Trailer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mũi tên chuyển Slide Trái / Phải */}
      {bannerList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Slide trước"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Slide tiếp theo"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Thanh chấm chỉ số Slide (Dots) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {bannerList.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-7 h-2 bg-[#e71a0f]"
                    : "w-2 h-2 bg-white/60 hover:bg-white"
                }`}
                title={item.title}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
