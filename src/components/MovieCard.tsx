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
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0B2046]/40 hover:bg-[#0B2046]/70 border border-[#034EA2]/30 hover:border-[#00B2FF]/80 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(3,78,162,0.35)] hover:-translate-y-1.5 flex-shrink-0 w-[205px] sm:w-[230px]">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Ribbon HOT (Beta Cinemas style) */}
        {isHot && (
          <div className="absolute -top-1 -right-1 z-10 overflow-hidden w-20 h-20 pointer-events-none">
            <div className="absolute transform rotate-45 bg-gradient-to-r from-[#FF5722] to-[#E8175D] text-white font-black text-[9px] py-1 right-[-25px] top-[14px] w-[95px] text-center shadow-md uppercase tracking-wider flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-current" /> HOT
            </div>
          </div>
        )}

        {/* Lớp phủ hover với nút Play Trailer & Mua vé */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2046]/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 gap-2">
          {/* Nút Play Trailer tròn ở giữa */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#00B2FF]/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/40">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          <button
            onClick={() => onOpenDetail(movie)}
            className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/30"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Chi tiết & Trailer</span>
          </button>

          <button
            onClick={() => onBookTicket(movie)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#034EA2] via-[#0070BA] to-[#00B2FF] hover:from-[#0070BA] hover:to-[#38B6FF] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#034EA2]/50 transition-all border border-white/20"
          >
            <Ticket className="w-4 h-4 text-amber-300" />
            <span>MUA VÉ</span>
          </button>
        </div>

        {/* Badge Độ tuổi & Định dạng góc trên bên trái */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#0B2046]/80 text-[#00B2FF] border border-[#00B2FF]/40 backdrop-blur-sm shadow">
            2D Beta
          </span>
        </div>

        {/* Điểm đánh giá góc trên bên phải (nếu không có HOT ribbon đè) */}
        {!isHot && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#0B2046]/90 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-amber-400 backdrop-blur-sm shadow border border-[#034EA2]/40">
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
            className="font-black text-sm text-white line-clamp-1 group-hover:text-[#00B2FF] cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
            {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-[#00B2FF]" />
            {movie.durationMinutes} phút
          </span>
          <span className="font-bold text-amber-400">
            ★ {movie.voteAverage}
          </span>
        </div>
      </div>
    </div>
  );
};
