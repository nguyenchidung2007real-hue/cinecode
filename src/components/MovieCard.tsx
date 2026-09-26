"use client";

import React from "react";
import { Movie } from "@/types";
import { Star, Play, Ticket, Sparkles } from "lucide-react";

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-md">T18</span>;
      case "T16":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white shadow-md">T16</span>;
      case "T13":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black shadow-md">T13</span>;
      case "P":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white shadow-md">P</span>;
      case "K":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white shadow-md">K</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-md">{rating}</span>;
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12131A] border border-white/10 hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(229,9,20,0.2)] hover:-translate-y-1.5 flex-shrink-0 w-[205px] sm:w-[230px]">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Lớp phủ chuyển màu khi hover (Chuẩn CGV / Galaxy) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 gap-2.5">
          <button
            onClick={() => onOpenDetail(movie)}
            className="w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Xem Trailer</span>
          </button>

          <button
            onClick={() => onBookTicket(movie)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40 transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>MUA VÉ NGAY</span>
          </button>
        </div>

        {/* Badge Độ tuổi & Định dạng rạp góc trên bên trái */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {getAgeRatingBadge(movie.ageRating)}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-black/60 text-cyan-400 border border-cyan-400/40 backdrop-blur-sm">
            2D • IMAX
          </span>
        </div>

        {/* Điểm đánh giá góc trên bên phải */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-yellow-400 backdrop-blur-sm shadow border border-white/10">
          <Star className="w-3 h-3 fill-current" />
          <span>{movie.voteAverage}</span>
        </div>
      </div>

      {/* Thông tin phim bên dưới poster */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3
            onClick={() => onOpenDetail(movie)}
            className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-red-400 cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
            {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10">
          <span>{movie.durationMinutes} phút</span>
          <span className="font-semibold text-gray-300">{movie.releaseDate.split("-")[0]}</span>
        </div>
      </div>
    </div>
  );
};
