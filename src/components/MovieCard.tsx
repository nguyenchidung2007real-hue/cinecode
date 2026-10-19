"use client";

import React from "react";
import { Movie } from "@/types";
import { Play, Ticket, Star } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  onOpenDetail: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
  isHalloween?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onOpenDetail,
  onBookTicket,
  isHalloween = false,
}) => {
  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case "T18":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow-md">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#EA580C] text-white shadow-md">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D97706] text-white shadow-md">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#16A34A] text-white shadow-md">P</span>;
      case "K":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white shadow-md">K</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626] text-white shadow-md">{rating || "P"}</span>;
    }
  };

  const isHorror = movie.genres.some(
    (g) => g.toLowerCase().includes("kinh dị") || g.toLowerCase().includes("horror")
  );

  // Định dạng chiếu chính
  const formatBadge = movie.title.toLowerCase().includes("dune") || movie.title.toLowerCase().includes("conan")
    ? "IMAX"
    : movie.title.toLowerCase().includes("godzilla")
    ? "4DX"
    : "2D";

  return (
    <div className="group flex flex-col w-full select-none">
      {/* THẺ POSTER CHUẨN CINEMATIC: Aspect 2/3, Hover nhô lên (-translate-y-2), viền sáng đỏ / cam neon */}
      <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border shadow-lg bg-[#12141C] transition-all duration-300 group-hover:-translate-y-2 ${
        isHalloween && isHorror
          ? "border-orange-500/50 shadow-[0_0_20px_rgba(255,117,24,0.35)] group-hover:border-[#FF7518] group-hover:shadow-[0_15px_35px_rgba(255,117,24,0.5)]"
          : isHalloween
          ? "border-white/10 group-hover:border-[#FF7518] group-hover:shadow-[0_15px_35px_rgba(255,117,24,0.35)]"
          : "border-white/10 group-hover:border-[#E50914] group-hover:shadow-[0_15px_35px_rgba(229,9,20,0.35)]"
      }`}>
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Nhãn Độ Tuổi Góc Trên Trái */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
        </div>

        {/* Nhãn Định Dạng Phim Góc Trên Phải (IMAX, 4DX, 2D) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#F5C518] border border-white/20 shadow-md">
            {formatBadge}
          </span>
        </div>

        {/* Huy hiệu Lễ Hội Phim Kinh Dị (Khi Halloween Mode bật) */}
        {isHalloween && isHorror && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-purple-700 text-white shadow-lg border border-orange-400 animate-pulse">
              🎃 Phim Kinh Dị
            </span>
          </div>
        )}

        {/* Lớp Phủ Tối Khi Rê Chuột (Cinema Card Overlay) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between items-center p-3.5 z-20">
          <div className="w-full h-4" />

          {/* Nút Play Trailer tròn đỏ ở chính giữa */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(movie);
            }}
            aria-label="Xem trailer"
            className={`w-12 h-12 rounded-full text-white border-2 border-white flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-all duration-300 hover:scale-110 cursor-pointer ${
              isHalloween ? "bg-[#FF7518] hover:bg-[#e0620f]" : "bg-[#E50914] hover:bg-[#b80710]"
            }`}
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>

          {/* 2 Nút Hành Động Trượt Nhẹ Từ Dưới Lên: TRAILER & ĐẶT VÉ */}
          <div className="w-full flex items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(movie);
              }}
              className="flex-1 py-2 px-2 text-center bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors shadow-sm cursor-pointer border border-white/20 backdrop-blur-md flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>TRAILER</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookTicket(movie);
              }}
              className={`flex-1 py-2 px-2 text-center text-white font-heading font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-colors cursor-pointer border flex items-center justify-center gap-1 ${
                isHalloween
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-orange-400 shadow-orange-500/40"
                  : "bg-[#E50914] hover:bg-[#b80710] border-red-500/40 shadow-red-600/50"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>ĐẶT VÉ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tên phim, Đánh giá sao & Thể loại bên dưới poster */}
      <div className="pt-3 pb-1 text-center">
        <h3
          onClick={() => onOpenDetail(movie)}
          title={movie.title}
          className={`font-heading font-bold text-base sm:text-lg text-white uppercase tracking-tight line-clamp-1 cursor-pointer transition-colors ${
            isHalloween ? "group-hover:text-[#FF7518]" : "group-hover:text-[#E50914]"
          }`}
        >
          {movie.title}
        </h3>
        <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF] mt-1">
          <span className="flex items-center gap-1 font-bold text-[#F5C518]">
            <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
            {movie.voteAverage ? movie.voteAverage.toFixed(1) : "8.9"}
          </span>
          <span className="text-white/20">•</span>
          <span className="font-medium text-[#9CA3AF]">{movie.durationMinutes} phút</span>
          <span className="text-white/20">•</span>
          <span className="font-medium text-[#9CA3AF] truncate max-w-[90px]">{movie.genres[0] || "Hành Động"}</span>
        </div>
      </div>
    </div>
  );
};
