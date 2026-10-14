"use client";

import React from "react";
import { Movie } from "@/types";
import { Star, Play, Ticket, Sparkles, Flame, Clock } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  onOpenDetail: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onOpenDetail,
  onBookTicket,
}) => {
  // Nhãn phân loại độ tuổi chính thức chuẩn Bộ VHTTDL Việt Nam
  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case "T18":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#EA580C] text-white shadow">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D97706] text-white shadow">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#16A34A] text-white shadow">P</span>;
      case "K":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white shadow">K</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow">{rating}</span>;
    }
  };

  const isHot = movie.voteAverage >= 8.0 || movie.status === "trending";

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex-shrink-0 w-[205px] sm:w-[230px]">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Ribbon HOT (Beta Cinemas style) */}
        {isHot && (
          <div className="absolute -top-1 -right-1 z-10 overflow-hidden w-20 h-20 pointer-events-none">
            <div className="absolute transform rotate-45 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[9px] py-1 right-[-25px] top-[14px] w-[95px] text-center shadow-md uppercase tracking-wider flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-current" /> HOT
            </div>
          </div>
        )}

        {/* Lớp phủ hover với nút Play Trailer & Mua vé */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 gap-2">
          {/* Nút Play Trailer tròn ở giữa */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/40">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          <button
            onClick={() => onOpenDetail(movie)}
            className="w-full py-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-slate-800" />
            <span>Chi tiết & Trailer</span>
          </button>

          <button
            onClick={() => onBookTicket(movie)}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/40 transition-all"
          >
            <Ticket className="w-4 h-4 text-sky-200" />
            <span>MUA VÉ</span>
          </button>
        </div>

        {/* Badge Độ tuổi & Định dạng góc trên bên trái */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-white/90 text-sky-700 border border-slate-200 backdrop-blur-sm shadow-sm">
            2D Beta
          </span>
        </div>

        {/* Điểm đánh giá góc trên bên phải (nếu không có HOT ribbon đè) */}
        {!isHot && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-amber-500 backdrop-blur-sm shadow-sm border border-slate-200">
            <Star className="w-3 h-3 fill-current" />
            <span>{movie.voteAverage}</span>
          </div>
        )}
      </div>

      {/* Thông tin phim bên dưới poster */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3
            onClick={() => onOpenDetail(movie)}
            className="font-black text-sm text-slate-900 line-clamp-1 group-hover:text-sky-600 cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
            {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="w-3 h-3 text-sky-600" />
            {movie.durationMinutes} phút
          </span>
          <span className="font-bold text-amber-500">
            ★ {movie.voteAverage}
          </span>
        </div>
      </div>
    </div>
  );
};
