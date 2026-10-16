"use client";

import React from "react";
import { Movie } from "@/types";
import { Play, Ticket } from "lucide-react";

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow-sm">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#EA580C] text-white shadow-sm">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D97706] text-white shadow-sm">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#16A34A] text-white shadow-sm">P</span>;
      case "K":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white shadow-sm">K</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow-sm">{rating || "P"}</span>;
    }
  };

  return (
    <div className="group flex flex-col w-full select-none">
      {/* THẺ POSTER CHUẨN CGV: Aspect 2/3, Hover hiện nút Play & 2 nút Xem chi tiết / Mua vé */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-neutral-300 shadow-md bg-neutral-900">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Nhãn Độ Tuổi Góc Trên Trái */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
        </div>

        {/* Lớp Phủ Tối Khi Rê Chuột (CGV Card Overlay) */}
        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between items-center p-3.5 z-20">
          {/* Top spacer */}
          <div className="w-full h-6" />

          {/* Nút Play Trailer tròn đỏ ở chính giữa */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(movie);
            }}
            aria-label="Xem trailer"
            className="w-13 h-13 rounded-full bg-[#e71a0f]/90 hover:bg-[#e71a0f] text-white border-2 border-white flex items-center justify-center shadow-xl transform scale-80 group-hover:scale-100 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>

          {/* 2 Nút Hành Động Trồi Lên Ở Cạnh Dưới: XEM CHI TIẾT & MUA VÉ */}
          <div className="w-full flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(movie);
              }}
              className="flex-1 py-2 px-1 text-center bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              XEM CHI TIẾT
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookTicket(movie);
              }}
              className="flex-1 py-2 px-1 text-center bg-[#e71a0f] hover:bg-[#c81007] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md shadow-[#e71a0f]/40 transition-colors cursor-pointer"
            >
              MUA VÉ
            </button>
          </div>
        </div>
      </div>

      {/* Tên phim & Thể loại chuẩn phong cách CGV bên dưới poster */}
      <div className="pt-2.5 pb-1 text-center">
        <h3
          onClick={() => onOpenDetail(movie)}
          title={movie.title}
          className="font-black text-sm sm:text-base text-neutral-900 uppercase tracking-tight line-clamp-1 group-hover:text-[#e71a0f] cursor-pointer transition-colors"
        >
          {movie.title}
        </h3>
        <p className="text-[11px] text-neutral-500 font-medium mt-0.5 line-clamp-1">
          {movie.genres.slice(0, 2).join(", ")} • {movie.durationMinutes} phút
        </p>
      </div>
    </div>
  );
};
