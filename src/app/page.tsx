"use client";

import React, { useState, useMemo } from "react";
import { Movie } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieRow } from "@/components/MovieRow";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { BookingModal } from "@/components/BookingModal";
import { AiChatWidget } from "@/components/AiChatWidget";
import { Footer } from "@/components/Footer";
import { Sparkles, Flame, Film, Clapperboard, Award, SearchX } from "lucide-react";

const GENRE_FILTERS = ["Tất cả", "Hành động", "Khoa học viễn tưởng", "Kinh dị", "Hoạt hình", "Chính kịch"];

export default function HomePage() {
  const [movies] = useState<Movie[]>(MOCK_MOVIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");

  // State các Modal
  const [activeDetailMovie, setActiveDetailMovie] = useState<Movie | null>(null);
  const [activeBookingMovie, setActiveBookingMovie] = useState<Movie | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Phim nổi bật nhất cho Hero Banner
  const heroMovie = movies[0]; // Dune: Phần Hai

  // Danh sách phân loại
  const nowPlayingMovies = useMemo(() => movies.filter((m) => m.status === "now_playing"), [movies]);
  const trendingMovies = useMemo(() => movies.filter((m) => m.status === "trending"), [movies]);
  const upcomingMovies = useMemo(() => movies.filter((m) => m.status === "upcoming"), [movies]);

  // Lọc theo tìm kiếm và thể loại
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cast.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGenre = selectedGenre === "Tất cả" || m.genres.includes(selectedGenre);

      return matchSearch && matchGenre;
    });
  }, [movies, searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-red selection:text-white">
      {/* Header thanh điều hướng */}
      <Navbar
        onSearchChange={setSearchQuery}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      <main className="flex-1">
        {/* NẾU ĐANG TÌM KIẾM HOẶC LỌC THỂ LOẠI RIÊNG */}
        {searchQuery.trim() !== "" ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  Kết quả tìm kiếm cho: <span className="text-accent-cyan">"{searchQuery}"</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Tìm thấy {filteredMovies.length} bộ phim phù hợp
                </p>
              </div>

              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-accent-red hover:underline font-semibold"
              >
                Xóa tìm kiếm
              </button>
            </div>

            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onOpenDetail={setActiveDetailMovie}
                    onBookTicket={setActiveBookingMovie}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <SearchX className="w-12 h-12 text-neutral-600" />
                <h3 className="text-lg font-bold text-neutral-300">Không tìm thấy bộ phim phù hợp</h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Thử tìm kiếm với từ khóa khác hoặc bấm nút **"Hỏi AI"** để trợ lý gợi ý phim hợp ý bạn nhất!
                </p>
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="px-4 py-2 rounded-xl bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan text-xs font-bold flex items-center gap-1.5 mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hỏi CineBot AI ngay</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* GIAO DIỆN TRANG CHỦ TIÊU CHUẨN PHONG CÁCH NETFLIX / CGV */
          <>
            {/* Hero Banner với phim tâm điểm */}
            {heroMovie && (
              <HeroBanner
                movie={heroMovie}
                onWatchTrailer={setActiveDetailMovie}
                onBookTicket={setActiveBookingMovie}
              />
            )}

            {/* Thanh Tab bộ lọc thể loại nhanh */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-2 flex-shrink-0">
                  Thể loại:
                </span>
                {GENRE_FILTERS.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                      selectedGenre === genre
                        ? "bg-accent-red text-white shadow-md shadow-accent-red/30"
                        : "bg-surface border border-surfaceBorder text-neutral-400 hover:text-white hover:border-neutral-700"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner quảng bá Trợ lý AI Groq */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-accent-red/15 via-purple-950/20 to-accent-cyan/15 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-red to-accent-cyan flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>Bạn chưa biết nên xem phim gì tối nay?</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40">
                        Groq AI ~500 tokens/s
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Hỏi CineBot AI để được phân tích gu xem phim, tóm tắt đánh giá và tư vấn vị trí ghế ngồi đẹp nhất rạp chỉ trong 1 giây!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-neutral-200 transition-all flex-shrink-0 transform hover:scale-105 active:scale-95"
                >
                  Trò chuyện với AI ngay
                </button>
              </div>
            </div>

            {/* Hàng 1: Phim Đang Chiếu Rạp */}
            <MovieRow
              title="🔥 Phim Đang Chiếu Rạp"
              subtitle="Những bộ phim bom tấn đang gây sốt tại các phòng vé toàn quốc"
              movies={nowPlayingMovies}
              onOpenDetail={setActiveDetailMovie}
              onBookTicket={setActiveBookingMovie}
            />

            {/* Hàng 2: Phim Được Đánh Giá Cao Nhất */}
            <MovieRow
              title="🌟 Phim Thịnh Hành & Đánh Giá Cao"
              subtitle="Tuyệt tác điện ảnh nhận điểm số xuất sắc từ giới phê bình và khán giả"
              movies={trendingMovies}
              onOpenDetail={setActiveDetailMovie}
              onBookTicket={setActiveBookingMovie}
            />

            {/* Hàng 3: Phim Sắp Ra Mắt */}
            <MovieRow
              title="🎬 Sắp Khởi Chiếu"
              subtitle="Đặt trước để không bỏ lỡ những tựa phim được mong chờ nhất năm"
              movies={upcomingMovies}
              onOpenDetail={setActiveDetailMovie}
              onBookTicket={setActiveBookingMovie}
            />
          </>
        )}
      </main>

      {/* Modal xem Trailer & Chi tiết phim */}
      <MovieModal
        movie={activeDetailMovie}
        onClose={() => setActiveDetailMovie(null)}
        onBookTicket={(m) => {
          setActiveDetailMovie(null);
          setActiveBookingMovie(m);
        }}
      />

      {/* Modal Đặt Vé, Chọn Ghế & Xuất Vé QR Code */}
      <BookingModal
        movie={activeBookingMovie}
        onClose={() => setActiveBookingMovie(null)}
      />

      {/* Trợ lý AI Chat Widget phản hồi siêu tốc */}
      <AiChatWidget
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen(!isAiChatOpen)}
      />

      {/* Chân trang Footer */}
      <Footer />
    </div>
  );
}
