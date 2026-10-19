"use client";

import React, { useState } from "react";
import { Movie } from "@/types";
import { Play, Ticket, Flame, Sparkles, Skull, Eye, HeartHandshake, Film } from "lucide-react";

interface HalloweenMovieShowcaseProps {
  movies: Movie[];
  onBookTicket: (movie: Movie) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const HalloweenMovieShowcase: React.FC<HalloweenMovieShowcaseProps> = ({
  movies,
  onBookTicket,
  onWatchTrailer,
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "spiritual" | "thriller" | "monster">("all");

  // Lọc danh sách phim kinh dị & rùng rợn
  const horrorMovies = movies.filter((m) => {
    const isExplicitHorror = m.genres.some(
      (g) =>
        g.toLowerCase().includes("kinh dị") ||
        g.toLowerCase().includes("horror") ||
        g.toLowerCase().includes("giật gân") ||
        g.toLowerCase().includes("tâm linh") ||
        g.toLowerCase().includes("bí ẩn")
    );
    // Danh sách id đặc trưng cho mùa Halloween
    const halloweenIds = [
      "exhuma",
      "the-nun-2",
      "smile-2",
      "a-quiet-place-day-one",
      "alien-romulus",
      "chuyen-ma-gan-nha",
      "terrifier-3",
      "the-conjuring-3",
      "longlegs",
    ];
    return isExplicitHorror || halloweenIds.includes(String(m.id));
  });

  const filteredHorrorList = horrorMovies.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "spiritual") {
      return (
        m.id === "exhuma" ||
        m.id === "the-nun-2" ||
        m.id === "the-conjuring-3" ||
        m.id === "chuyen-ma-gan-nha" ||
        m.genres.some((g) => g.toLowerCase().includes("tâm linh"))
      );
    }
    if (activeFilter === "thriller") {
      return (
        m.id === "smile-2" ||
        m.id === "terrifier-3" ||
        m.id === "longlegs" ||
        m.genres.some((g) => g.toLowerCase().includes("tâm lý") || g.toLowerCase().includes("giật gân") || g.toLowerCase().includes("tội phạm"))
      );
    }
    if (activeFilter === "monster") {
      return (
        m.id === "alien-romulus" ||
        m.id === "a-quiet-place-day-one" ||
        m.genres.some((g) => g.toLowerCase().includes("khoa học viễn tưởng"))
      );
    }
    return true;
  });

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-20">
      {/* KHUNG CHỦ ĐỀ HALLOWEEN SPOOKY GLASSMORPHISM */}
      <div className="relative rounded-3xl p-6 sm:p-8 lg:p-10 border border-orange-500/40 bg-gradient-to-b from-[#19062b]/95 via-[#0e0419]/90 to-[#07020d]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(255,117,24,0.18)] overflow-hidden">
        {/* Vầng sáng nền Neon */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-700/25 rounded-full blur-3xl pointer-events-none" />

        {/* Tiêu đề Section nổi bật */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-orange-500/20 pb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-600/30 to-purple-700/30 border border-orange-500/40 text-orange-300 text-xs font-black uppercase tracking-wider mb-2.5 shadow-sm">
              <span className="animate-bounce">🎃</span>
              <span>LỄ HỘI ĐIỆN ẢNH HALLOWEEN 2026</span>
              <span className="text-orange-400">• ĐỒNG GIÁ VÉ 45K</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-purple-300 tracking-tight uppercase flex items-center gap-2.5">
              <span>ĐỀ XUẤT ĐIỆN ẢNH KINH DỊ RÙNG RỢN</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">
              Tuyển tập các siêu phẩm rùng rợn, giật gân và tâm linh đáng xem nhất mùa Halloween. Trải nghiệm hệ thống âm thanh vòm Dolby Atmos tái hiện tiếng thì thầm rợn gai ốc và hình ảnh Laser sắc nét từng chi tiết!
            </p>
          </div>

          {/* Bộ lọc Thể loại con của Kinh Dị */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-gradient-to-r from-[#FF7518] to-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/5 text-orange-200/80 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              🔥 Tất cả ({horrorMovies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("spiritual")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFilter === "spiritual"
                  ? "bg-gradient-to-r from-[#FF7518] to-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/5 text-orange-200/80 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              👻 Tâm Linh & Trừ Tà
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("thriller")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFilter === "thriller"
                  ? "bg-gradient-to-r from-[#FF7518] to-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/5 text-orange-200/80 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              😱 Giật Gân & Tâm Lý
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("monster")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFilter === "monster"
                  ? "bg-gradient-to-r from-[#FF7518] to-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/5 text-orange-200/80 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              🛸 Quái Vật & Không Gian
            </button>
          </div>
        </div>

        {/* LƯỚI THẺ PHIM KINH DỊ ĐẶC BIỆT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 relative z-10">
          {filteredHorrorList.map((movie) => {
            // Mức độ sợ hãi giả lập theo phim
            const scareIndex =
              movie.id === "the-nun-2" || movie.id === "exhuma"
                ? "9.8/10 • Cực Mạnh"
                : movie.id === "smile-2"
                ? "9.6/10 • Ám Ảnh"
                : movie.id === "alien-romulus"
                ? "9.5/10 • Nghẹt Thở"
                : "9.2/10 • Rùng Rợn";

            return (
              <div
                key={movie.id}
                className="group flex flex-col rounded-2xl overflow-hidden border border-orange-500/30 bg-[#140622]/90 hover:border-orange-500 transition-all duration-300 hover:shadow-[0_12px_35px_rgba(255,117,24,0.3)] hover:-translate-y-1.5"
              >
                {/* Ảnh Poster + Lớp phủ Badge Rùng Rợn */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
                  <img
                    src={movie.posterPath}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140622] via-[#140622]/30 to-transparent" />

                  {/* Badge độ tuổi & định dạng */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-md">
                      {movie.ageRating || "T18"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 backdrop-blur-md text-amber-300 border border-orange-500/30">
                      Dolby Atmos
                    </span>
                  </div>

                  {/* Badge Spooky Pick */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-purple-700 text-white border border-orange-400 shadow-lg animate-pulse">
                      🎃 Spooky Pick
                    </span>
                  </div>

                  {/* Thước đo độ sợ hãi (Scare Meter) */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/75 backdrop-blur-md p-2 rounded-xl border border-orange-500/30 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-red-400 font-bold">
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                      <span>Độ sợ hãi:</span>
                    </div>
                    <span className="font-extrabold text-orange-300">{scareIndex}</span>
                  </div>
                </div>

                {/* Thông tin phim */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-white group-hover:text-orange-400 transition-colors line-clamp-1 uppercase">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 italic mt-0.5">
                      {movie.originalTitle || movie.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-orange-200/70 mt-2">
                      <span>⏱️ {movie.durationMinutes} phút</span>
                      <span>•</span>
                      <span>⭐ {movie.voteAverage}/10</span>
                      <span>•</span>
                      <span className="text-orange-300 font-bold">Đồng giá 45k</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 line-clamp-2 mt-2 leading-relaxed">
                      {movie.overview}
                    </p>
                  </div>

                  {/* Nút hành động Đặt vé & Xem trailer */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => onWatchTrailer(movie)}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      <span>Trailer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onBookTicket(movie)}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF7518] to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-600/30 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Đặt Vé</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thanh Ưu Đãi & Voucher Đêm Halloween Phía Dưới */}
        <div className="mt-8 pt-6 border-t border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-spin" style={{ animationDuration: "12s" }}>
              🕸️
            </span>
            <div>
              <strong className="text-white font-bold block sm:inline mr-2">
                Đặc Quyền Khán Giả Halloween:
              </strong>
              <span>Áp dụng mã voucher <code className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-black">SPOOKY30K</code> giảm ngay 30.000đ khi đặt 2 vé phim kinh dị.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30 flex items-center gap-1.5">
              <span>🍿</span>
              <span>Tặng kèm 1 Bắp Phô Mai Bí Ngô</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
