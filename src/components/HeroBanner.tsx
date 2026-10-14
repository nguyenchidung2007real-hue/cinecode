"use client";

import React from "react";
import { Movie } from "@/types";
import { Play, Ticket, Star, Clock, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface HeroBannerProps {
  movie: Movie;
  onWatchTrailer: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onWatchTrailer,
  onBookTicket,
}) => {
  return (
    <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] overflow-hidden">
      {/* Background Image với lớp phủ chuyển màu đa lớp sang trắng thanh lịch */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url(${movie.backdropPath})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-transparent" />
      </div>

      {/* Nội dung Banner */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Thể loại */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded font-bold bg-sky-600 text-white shadow-sm">
              {movie.ageRating}
            </span>
            <span className="px-2 py-0.5 rounded font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-sm">
              {movie.genres.join(" • ")}
            </span>
            <div className="flex items-center gap-1 text-amber-600 font-bold bg-white/90 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{movie.voteAverage}</span>
              <span suppressHydrationWarning className="text-slate-500 font-normal">
                ({formatNumber(movie.voteCount)} bình chọn)
              </span>
            </div>
          </div>

          {/* Tiêu đề phim */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {movie.title}
          </h1>

          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="text-sm sm:text-base font-medium text-slate-500 italic">
              {movie.originalTitle} ({movie.releaseDate.split("-")[0]})
            </p>
          )}

          {/* Thời lượng & Đạo diễn */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{movie.durationMinutes} phút</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Khởi chiếu: {movie.releaseDate}</span>
            </div>
            <span>Đạo diễn: <strong className="text-slate-900">{movie.director}</strong></span>
          </div>

          {/* Tóm tắt */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {movie.overview}
          </p>

          {/* Nhóm nút bấm hành động - Màu xanh da trời tiêu chuẩn */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onBookTicket(movie)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Ticket className="w-4 h-4" />
              <span>Đặt Vé Ngay</span>
            </button>

            <button
              onClick={() => onWatchTrailer(movie)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-slate-800" />
              <span>Xem Trailer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
