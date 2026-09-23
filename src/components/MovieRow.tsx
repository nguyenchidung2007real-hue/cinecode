"use client";

import React, { useRef } from "react";
import { Movie } from "@/types";
import { MovieCard } from "./MovieCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  subtitle,
  movies,
  onOpenDetail,
  onBookTicket,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 sm:my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề & Phụ đề */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Nút điều hướng mũi tên */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => handleScroll("left")}
            aria-label="Cuộn trái"
            className="w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            aria-label="Cuộn phải"
            className="w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Danh sách cuộn ngang */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onOpenDetail={onOpenDetail}
            onBookTicket={onBookTicket}
          />
        ))}
      </div>
    </section>
  );
};
