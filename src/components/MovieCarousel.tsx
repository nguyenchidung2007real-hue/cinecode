"use client";

import React, { useState } from "react";
import { Movie } from "@/types";
import { MovieCard } from "./MovieCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieCarouselProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({
  movies,
  onOpenDetail,
  onBookTicket,
}) => {
  const [startIndex, setStartIndex] = useState(0);

  // Số lượng hiển thị 4 phim trên 1 hàng chuẩn CGV desktop
  const itemsPerPage = 4;
  const maxIndex = Math.max(0, movies.length - itemsPerPage);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - itemsPerPage));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxIndex, prev + itemsPerPage));
  };

  const visibleMovies = movies.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="relative w-full group/slider py-2">
      {/* Lưới 4 Phim Trượt Ngang Chuẩn CGV */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {visibleMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onOpenDetail={onOpenDetail}
            onBookTicket={onBookTicket}
          />
        ))}
      </div>

      {/* Nút Mũi Tên Trái (Prev) */}
      {startIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Xem phim trước"
          className="absolute -left-4 sm:-left-6 top-[38%] -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-[#e71a0f] text-neutral-800 hover:text-white border-2 border-neutral-300 hover:border-[#e71a0f] shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Nút Mũi Tên Phải (Next) */}
      {startIndex < maxIndex && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Xem phim kế tiếp"
          className="absolute -right-4 sm:-right-6 top-[38%] -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-[#e71a0f] text-neutral-800 hover:text-white border-2 border-neutral-300 hover:border-[#e71a0f] shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Chỉ số trang (Dots) nếu danh sách có nhiều hơn 4 phim */}
      {movies.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(movies.length / itemsPerPage) }).map((_, idx) => {
            const pageStart = idx * itemsPerPage;
            const isActive = startIndex === pageStart;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setStartIndex(pageStart)}
                aria-label={`Trang ${idx + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  isActive
                    ? "w-8 h-2 bg-[#e71a0f]"
                    : "w-2 h-2 bg-neutral-300 hover:bg-neutral-500"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
