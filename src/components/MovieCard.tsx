"use client";

import React from "react";
import { Movie } from "@/types";
import { Star, Play, Ticket, Info } from "lucide-react";

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
  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-surface border border-surfaceBorder hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1.5 flex-shrink-0 w-[210px] sm:w-[240px]">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
        <img
          src={movie.posterPath}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Lớp phủ chuyển màu khi hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 gap-2">
          <button
            onClick={() => onOpenDetail(movie)}
            className="w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Trailer & Chi Tiết</span>
          </button>

          <button
            onClick={() => onBookTicket(movie)}
            className="w-full py-2 rounded-lg bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-accent-red/30 transition-colors"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Mua Vé</span>
          </button>
        </div>

        {/* Badge Độ tuổi & Điểm đánh giá góc trên */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-red text-white shadow">
            {movie.ageRating}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-accent-gold backdrop-blur-sm shadow border border-white/10">
          <Star className="w-3 h-3 fill-current" />
          <span>{movie.voteAverage}</span>
        </div>
      </div>

      {/* Thông tin phim bên dưới poster */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3
            onClick={() => onOpenDetail(movie)}
            className="font-bold text-sm text-white line-clamp-1 group-hover:text-accent-cyan cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
            {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
          <span>{movie.durationMinutes} phút</span>
          <span>{movie.releaseDate.split("-")[0]}</span>
        </div>
      </div>
    </div>
  );
};
