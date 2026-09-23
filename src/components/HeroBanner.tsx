"use client";

import React from "react";
import { Movie } from "@/types";
import { Play, Ticket, Star, Clock, Calendar } from "lucide-react";

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
      {/* Background Image với lớp phủ chuyển màu đa lớp */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url(${movie.backdropPath})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      </div>

      {/* Nội dung Banner */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Thể loại */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded font-bold bg-accent-red text-white">
              {movie.ageRating}
            </span>
            <span className="px-2 py-0.5 rounded font-semibold bg-white/10 text-white border border-white/20 backdrop-blur-md">
              {movie.genres.join(" • ")}
            </span>
            <div className="flex items-center gap-1 text-accent-gold font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{movie.voteAverage}</span>
              <span className="text-neutral-400 font-normal">({movie.voteCount.toLocaleString()} bình chọn)</span>
            </div>
          </div>

          {/* Tiêu đề phim */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-none">
            {movie.title}
          </h1>

          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="text-sm sm:text-base font-medium text-neutral-300 italic">
              {movie.originalTitle} ({movie.releaseDate.split("-")[0]})
            </p>
          )}

          {/* Thời lượng & Đạo diễn */}
          <div className="flex items-center gap-4 text-xs text-neutral-300">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{movie.durationMinutes} phút</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Khởi chiếu: {movie.releaseDate}</span>
            </div>
            <span>Đạo diễn: <strong className="text-white">{movie.director}</strong></span>
          </div>

          {/* Tóm tắt */}
          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed drop-shadow">
            {movie.overview}
          </p>

          {/* Nhóm nút bấm hành động */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onBookTicket(movie)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm shadow-lg shadow-accent-red/40 hover:shadow-accent-red/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Ticket className="w-4 h-4" />
              <span>Đặt Vé Ngay</span>
            </button>

            <button
              onClick={() => onWatchTrailer(movie)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-md transition-all hover:border-white/40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Xem Trailer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
