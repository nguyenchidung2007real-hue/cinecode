"use client";

import React, { useState, useMemo } from "react";
import { Movie } from "@/types";
import { Film, Search, X, Clock, Star, Sparkles, ChevronRight, Check } from "lucide-react";

interface MovieSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  title?: string;
  subtitle?: string;
  badge?: string;
  onSelectMovie: (movie: Movie) => void;
  isHalloween?: boolean;
}

export const MovieSelectModal: React.FC<MovieSelectModalProps> = ({
  isOpen,
  onClose,
  movies,
  title = "Chọn Phim Bạn Muốn Xem",
  subtitle = "Vui lòng chọn bộ phim bạn yêu thích để tiếp tục chọn suất chiếu và giữ chỗ ngồi:",
  badge = "ĐANG CHIẾU RẠP",
  onSelectMovie,
  isHalloween = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "now_playing" | "trending" | "upcoming">("all");

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchSearch =
        !searchTerm.trim() ||
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.genres.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === "all" ? true : m.status === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [movies, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-white transition-all animate-in zoom-in-95 duration-200 ${
          isHalloween
            ? "bg-[#140B22] border-orange-500/30 shadow-[0_0_50px_rgba(255,117,24,0.15)]"
            : "bg-[#111625] border-white/10 shadow-[0_0_50px_rgba(229,9,20,0.15)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 shrink-0 bg-black/30">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isHalloween
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                  : "bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40"
              }`}>
                {badge}
              </span>
              <span className="text-xs text-neutral-400">
                • {movies.length} phim sẵn sàng phục vụ
              </span>
            </div>
            <h3 className="font-heading text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Film className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nhanh */}
        <div className="p-4 sm:px-6 py-3 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm phim theo tên hoặc thể loại..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Phân loại nhanh */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "Tất cả phim" },
              { id: "now_playing", label: "Đang chiếu" },
              { id: "trending", label: "Suất đặc biệt" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? isHalloween
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                      : "bg-[#E50914] text-white shadow-md shadow-red-900/40"
                    : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách Phim Dạng Lưới */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredMovies.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <Film className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
              <p className="font-bold text-sm text-white">Không tìm thấy phim phù hợp</p>
              <p className="text-xs text-neutral-500">Vui lòng thử tìm với từ khóa khác hoặc đặt lại bộ lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredMovies.map((movie) => {
                const ageRatingColor =
                  movie.ageRating === "P"
                    ? "bg-emerald-500 text-white"
                    : movie.ageRating === "T13"
                    ? "bg-amber-500 text-white"
                    : movie.ageRating === "T16"
                    ? "bg-orange-500 text-white"
                    : movie.ageRating === "T18"
                    ? "bg-red-600 text-white"
                    : "bg-blue-500 text-white";

                return (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-red-500/60 bg-[#161B26] hover:bg-[#1E2433] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-950/40 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Poster Phim */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";
                        }}
                      />

                      {/* Độ tuổi & Đánh giá */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-md ${ageRatingColor}`}>
                          {movie.ageRating || "P"}
                        </span>
                        {movie.voteAverage > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/70 text-amber-400 backdrop-blur-sm flex items-center gap-0.5 shadow-md">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{movie.voteAverage.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      {/* Định dạng chiếu */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
                          2D
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                          Dolby 7.1
                        </span>
                      </div>

                      {/* Overlay hover CTA */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                        <span className="px-3 py-1.5 rounded-lg bg-[#E50914] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-900/60 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <span>Chọn Phim Này</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Thông tin Phim */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                          {movie.title}
                        </h4>
                        {movie.originalTitle && movie.originalTitle !== movie.title && (
                          <p className="text-[10px] text-neutral-400 line-clamp-1 italic">
                            {movie.originalTitle}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="truncate max-w-[100px]">{movie.genres[0] || "Điện ảnh"}</span>
                        <span className="flex items-center gap-1 font-mono text-neutral-300 shrink-0">
                          <Clock className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{movie.durationMinutes}p</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 sm:py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="hidden sm:inline">
            💡 Mẹo: Bấm vào poster phim bất kỳ để chuyển thẳng đến màn hình chọn suất chiếu và giữ ghế.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs ml-auto transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
