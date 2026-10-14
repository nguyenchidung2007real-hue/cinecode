"use client";

import React, { useEffect } from "react";
import { Movie } from "@/types";
import { X, Star, Clock, Calendar, Ticket, User, Film } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBookTicket: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  onBookTicket,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl my-auto text-slate-800">
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center transition-colors border border-slate-200 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung nhúng Trailer YouTube */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={movie.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Nội dung chi tiết phim */}
        <div className="p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  {movie.ageRating}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {movie.genres.join(" • ")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {movie.title}
              </h2>
              {movie.originalTitle && (
                <p className="text-sm text-slate-500 italic">
                  {movie.originalTitle}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onBookTicket(movie);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Ticket className="w-4 h-4" />
              <span>Đặt Vé Ngay</span>
            </button>
          </div>

          {/* Các thông số meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 py-2 border-y border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-current" />
              <span>{movie.voteAverage} / 10</span>
              <span suppressHydrationWarning className="text-slate-400 font-normal">
                ({formatNumber(movie.voteCount)} votes)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{movie.durationMinutes} phút</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Khởi chiếu: {movie.releaseDate}</span>
            </div>
          </div>

          {/* Tóm tắt cốt truyện */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Nội dung phim</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {movie.overview}
            </p>
          </div>

          {/* Đạo diễn & Dàn diễn viên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
            <div>
              <span className="text-slate-400 block mb-0.5">Đạo diễn:</span>
              <span className="font-semibold text-slate-900">{movie.director}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Diễn viên chính:</span>
              <span className="font-semibold text-slate-900">{movie.cast.join(", ")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
