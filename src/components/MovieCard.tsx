"use client";

import React from "react";
import { Movie } from "@/types";
import { Star, Play, Ticket, Clock } from "lucide-react";

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
  // Nhãn phân loại độ tuổi tinh gọn chuẩn Bộ VHTTDL Việt Nam
  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case "T18":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#DC2626] text-white shadow-sm">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EA580C] text-white shadow-sm">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D97706] text-white shadow-sm">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#16A34A] text-white shadow-sm">P</span>;
      case "K":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#0284C7] text-white shadow-sm">K</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#DC2626] text-white shadow-sm">{rating || "P"}</span>;
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-white hover:bg-neutral-50/50 border border-neutral-200 hover:border-[#e71a0f] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex-shrink-0 w-[205px] sm:w-[230px]">
      {/* Poster Image Container - Tinh gọn, không bị đè tag rối mắt */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-100">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Chỉ giữ lại DUY NHẤT 1 nhãn độ tuổi nhỏ gọn ở góc trên bên trái */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
        </div>

        {/* Lớp phủ hover mượt mà với nút Play Trailer & Đặt vé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 gap-2">
          {/* Nút Play Trailer tròn ở giữa */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#e71a0f] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/30">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(movie)}
            className="w-full py-2 rounded-xl bg-white/95 hover:bg-white text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-neutral-800" />
            <span>Trailer & Chi tiết</span>
          </button>

          <button
            type="button"
            onClick={() => onBookTicket(movie)}
            className="w-full py-2.5 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/40 transition-all cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-white" />
            <span>MUA VÉ</span>
          </button>
        </div>
      </div>

      {/* Thông tin phim chuẩn typography hiện đại sans-serif bên dưới poster */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          <h3
            onClick={() => onOpenDetail(movie)}
            className="font-bold text-sm text-neutral-900 line-clamp-1 group-hover:text-[#e71a0f] cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>

          <div className="text-[11px] text-neutral-500 space-y-1 mt-1 font-medium">
            <p className="line-clamp-1">
              <span className="text-neutral-400">Thể loại:</span> {movie.genres.slice(0, 2).join(", ")}
            </p>
            <div className="flex items-center justify-between pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                {movie.durationMinutes} phút
              </span>
              <span className="font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 text-[10px]">
                <Star className="w-3 h-3 fill-current" /> {movie.voteAverage}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Nút Bấm: CHI TIẾT & MUA VÉ */}
        <div className="pt-2.5 border-t border-neutral-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(movie)}
            title="Xem chi tiết & Trailer"
            className="px-2.5 py-2 rounded-xl border border-neutral-200 hover:border-[#e71a0f] bg-neutral-50 hover:bg-rose-50 text-neutral-700 hover:text-[#e71a0f] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Chi tiết</span>
          </button>

          <button
            type="button"
            onClick={() => onBookTicket(movie)}
            title="Mua vé xem phim"
            className="flex-1 py-2 px-3 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#e71a0f]/20 hover:shadow-lg transition-all cursor-pointer transform active:scale-95"
          >
            <Ticket className="w-3.5 h-3.5 text-white" />
            <span>MUA VÉ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
