"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Movie, BookingInfo } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieRow } from "@/components/MovieRow";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { BookingModal } from "@/components/BookingModal";
import { MyTicketsModal } from "@/components/MyTicketsModal";
import { AiChatWidget } from "@/components/AiChatWidget";
import { QuickBookingBar } from "@/components/QuickBookingBar";
import { CinemaShowtimeMatrix } from "@/components/CinemaShowtimeMatrix";
import SemanticSearchModal from "@/components/SemanticSearchModal";
import { SideBanners } from "@/components/SideBanners";
import { Footer } from "@/components/Footer";

import { Sparkles, Flame, Film, Clapperboard, Award, SearchX, Smile, Compass, Brain, Heart, Zap, Tag, Gift, Percent } from "lucide-react";

const GENRE_FILTERS = ["Tất cả", "Hành động", "Khoa học viễn tưởng", "Kinh dị", "Hoạt hình", "Chính kịch"];

const MOOD_FILTERS = [
  { id: "all", label: "✨ Tất cả tâm trạng", icon: Compass, color: "from-blue-500/20 to-cyan-500/20 text-cyan-300" },
  { id: "blockbuster", label: "🔥 Bom tấn hành động", icon: Flame, color: "from-red-500/20 to-orange-500/20 text-orange-300" },
  { id: "mindblown", label: "🧠 Căng não viễn tưởng", icon: Brain, color: "from-purple-500/20 to-indigo-500/20 text-purple-300" },
  { id: "chill", label: "🍿 Thư giãn cuối tuần", icon: Smile, color: "from-emerald-500/20 to-teal-500/20 text-emerald-300" },
  { id: "emotional", label: "😢 Cảm động sâu lắng", icon: Heart, color: "from-pink-500/20 to-rose-500/20 text-pink-300" },
];

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [selectedMood, setSelectedMood] = useState("all");

  // Tab chuyển đổi phim chuẩn rạp (Đang chiếu / Sắp chiếu / Suất chiếu đặc biệt)
  const [activeCommercialTab, setActiveCommercialTab] = useState<"now_playing" | "upcoming" | "trending">("now_playing");

  // State các Modal
  const [activeDetailMovie, setActiveDetailMovie] = useState<Movie | null>(null);
  const [activeBookingMovie, setActiveBookingMovie] = useState<Movie | null>(null);
  const [bookingInitialSeats, setBookingInitialSeats] = useState<string[]>([]);
  const [bookingInitialShowtimeId, setBookingInitialShowtimeId] = useState<string | undefined>(undefined);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

  // Tải danh sách phim mới nhất từ TMDB API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/movies?category=all")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const combined = [...data.data];
          for (const mock of MOCK_MOVIES) {
            if (!combined.some((m) => m.id === mock.id)) {
              combined.push(mock);
            }
          }
          setMovies(combined);
        }
      })
      .catch((err) => console.error("Lỗi cập nhật phim TMDB:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Đọc số lượng vé đã đặt
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cinemax_tickets");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTicketCount(parsed.length);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [vnpayNotice, setVnpayNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Bắt callback sau khi thanh toán từ cổng VNPay quay về (vnp_return=true)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isVnpReturn = params.get("vnp_return") === "true";
    if (!isVnpReturn) return;

    const bookingId = params.get("bookingId");
    const status = params.get("status");
    const sig = params.get("sig");

    // Dọn query param trên thanh địa chỉ để tránh F5 kích hoạt lại
    window.history.replaceState({}, "", window.location.pathname);

    if (status === "failed" || status === "invalid_checksum") {
      setVnpayNotice({
        type: "error",
        message: "Giao dịch qua VNPay chưa hoàn tất hoặc đã bị hủy. Ghế của bạn vẫn được giữ tạm thời, vui lòng thử lại.",
      });
      return;
    }

    if (bookingId && sig) {
      setVnpayNotice({
        type: "info",
        message: "Hệ thống đang đồng bộ và xuất vé điện tử từ VNPay...",
      });

      let attempts = 0;
      const pollTicket = () => {
        attempts++;
        fetch(`/api/tickets/${encodeURIComponent(bookingId)}?sig=${encodeURIComponent(sig)}`)
          .then((res) => (res.ok ? res.json() : Promise.reject(res)))
          .then((data) => {
            if (data?.success && data?.ticket) {
              const ticket = data.ticket;
              try {
                const existing = JSON.parse(localStorage.getItem("cinemax_tickets") || "[]");
                if (!existing.some((t: any) => t.bookingId === ticket.bookingId)) {
                  localStorage.setItem("cinemax_tickets", JSON.stringify([ticket, ...existing]));
                  setTicketCount((prev) => prev + 1);
                }
              } catch (e) {
                console.error("Lỗi lưu vé sau VNPay:", e);
              }
              setVnpayNotice({
                type: "success",
                message: `🎉 Thanh toán thành công vé xem phim! Mã vé: ${ticket.bookingId}`,
              });
              setIsMyTicketsOpen(true);
            } else if (attempts < 6) {
              setTimeout(pollTicket, 1500);
            } else {
              setVnpayNotice({
                type: "info",
                message: "Thanh toán thành công. Vé của bạn đã được lưu trong Ví Vé Của Tôi.",
              });
              setIsMyTicketsOpen(true);
            }
          })
          .catch(() => {
            if (attempts < 6) {
              setTimeout(pollTicket, 1500);
            }
          });
      };

      pollTicket();
    }
  }, []);

  const handleBookingSuccess = (newTicket: BookingInfo) => {
    setTicketCount((prev) => prev + 1);
  };

  // Phim nổi bật nhất cho Hero Banner
  const heroMovie = movies[0]; // Dune: Phần Hai

  // Danh sách phân loại
  const nowPlayingMovies = useMemo(() => movies.filter((m) => m.status === "now_playing"), [movies]);
  const trendingMovies = useMemo(() => movies.filter((m) => m.status === "trending"), [movies]);
  const upcomingMovies = useMemo(() => movies.filter((m) => m.status === "upcoming"), [movies]);

  // Lọc theo tìm kiếm, thể loại và tâm trạng (Mood-based)
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cast.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGenre = selectedGenre === "Tất cả" || m.genres.includes(selectedGenre);

      let matchMood = true;
      if (selectedMood === "blockbuster") {
        matchMood = m.genres.some((g) => ["Hành động", "Phiêu lưu"].includes(g));
      } else if (selectedMood === "mindblown") {
        matchMood = m.genres.some((g) => ["Khoa học viễn tưởng", "Kinh dị"].includes(g));
      } else if (selectedMood === "chill") {
        matchMood = m.genres.some((g) => ["Hoạt hình", "Hài"].includes(g));
      } else if (selectedMood === "emotional") {
        matchMood = m.genres.some((g) => ["Chính kịch", "Tâm lý"].includes(g));
      }

      return matchSearch && matchGenre && matchMood;
    });
  }, [movies, searchQuery, selectedGenre, selectedMood]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-red selection:text-white">
      {/* Header thanh điều hướng */}
      <Navbar
        onSearchChange={setSearchQuery}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        ticketCount={ticketCount}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* Banner khuyến mãi 2 bên hông (Gutter Banners chuẩn Beta Cinemas) */}
      <SideBanners />

      <main className="flex-1">
        {/* Banner thông báo kết quả giao dịch VNPay */}
        {vnpayNotice && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm shadow-xl transition-all ${
                vnpayNotice.type === "success"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : vnpayNotice.type === "error"
                  ? "bg-red-500/15 border-red-500/40 text-red-300"
                  : "bg-blue-500/15 border-blue-500/40 text-blue-300 animate-pulse"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span className="font-semibold">{vnpayNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setVnpayNotice(null)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all shrink-0"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* NẾU ĐANG TÌM KIẾM HOẶC LỌC TÂM TRẠNG RIÊNG */}
        {searchQuery.trim() !== "" || selectedMood !== "all" || selectedGenre !== "Tất cả" ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  {searchQuery ? (
                    <>Kết quả tìm kiếm cho: <span className="text-sky-600">"{searchQuery}"</span></>
                  ) : (
                    <>Khám phá theo: <span className="text-sky-600">{MOOD_FILTERS.find(m => m.id === selectedMood)?.label || selectedGenre}</span></>
                  )}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Tìm thấy {filteredMovies.length} bộ phim phù hợp với sở thích của bạn
                </p>
              </div>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMood("all");
                  setSelectedGenre("Tất cả");
                }}
                className="text-xs text-sky-600 hover:underline font-semibold self-start sm:self-auto"
              >
                Đặt lại tất cả bộ lọc
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
                <SearchX className="w-12 h-12 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bộ phim phù hợp</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Thử tìm kiếm với từ khóa khác hoặc bấm nút **"Hỏi AI"** để trợ lý gợi ý phim hợp ý bạn nhất!
                </p>
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 text-xs font-bold flex items-center gap-1.5 mt-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hỏi CineBot AI ngay</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* GIAO DIỆN TRANG CHỦ TIÊU CHUẨN PHONG CÁCH CGV / GALAXY / FANDANGO */
          <>
            {/* Hero Banner với phim tâm điểm */}
            {heroMovie && (
              <HeroBanner
                movie={heroMovie}
                onWatchTrailer={setActiveDetailMovie}
                onBookTicket={setActiveBookingMovie}
              />
            )}

            {/* 1. Thanh Mua Vé Nhanh 1-Click (Đặc trưng số 1 của CGV & Galaxy Cinema) */}
            <QuickBookingBar
              movies={movies}
              onQuickBook={(movie, cinemaName, date, time, format, showtimeId) => {
                setBookingInitialShowtimeId(showtimeId);
                setActiveBookingMovie(movie);
              }}
            />

            {/* 2. Thanh Chuyển Tab Phim Chuẩn Rạp Chiếu Thương Mại */}
            <div id="commercial-tabs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4 sm:gap-8">
                  <button
                    onClick={() => setActiveCommercialTab("now_playing")}
                    className={`text-base sm:text-2xl font-black transition-all flex items-center gap-2 pb-3 -mb-4.5 border-b-2 ${
                      activeCommercialTab === "now_playing"
                        ? "text-sky-600 border-sky-600 shadow-[0_2px_10px_rgba(2,132,199,0.3)]"
                        : "text-slate-500 border-transparent hover:text-slate-900"
                    }`}
                  >
                    <span>🎬 PHIM ĐANG CHIẾU</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-black border border-sky-200">
                      {nowPlayingMovies.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveCommercialTab("upcoming")}
                    className={`text-base sm:text-2xl font-black transition-all flex items-center gap-2 pb-3 -mb-4.5 border-b-2 ${
                      activeCommercialTab === "upcoming"
                        ? "text-sky-600 border-sky-600 shadow-[0_2px_10px_rgba(2,132,199,0.3)]"
                        : "text-slate-500 border-transparent hover:text-slate-900"
                    }`}
                  >
                    <span>⏳ PHIM SẮP CHIẾU</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                      {upcomingMovies.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveCommercialTab("trending")}
                    className={`text-base sm:text-2xl font-black transition-all hidden sm:flex items-center gap-2 pb-3 -mb-4.5 border-b-2 ${
                      activeCommercialTab === "trending"
                        ? "text-sky-600 border-sky-600 shadow-[0_2px_10px_rgba(2,132,199,0.3)]"
                        : "text-slate-500 border-transparent hover:text-slate-900"
                    }`}
                  >
                    <span>⭐ SUẤT CHIẾU ĐẶC BIỆT</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-black border border-rose-200">
                      HOT
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Cập nhật lịch chiếu Beta Cinemas Xuân Thủy</span>
                </div>
              </div>

              {/* Lưới phim theo Tab đang chọn */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
                {(activeCommercialTab === "now_playing"
                  ? nowPlayingMovies
                  : activeCommercialTab === "upcoming"
                  ? upcomingMovies
                  : trendingMovies
                ).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onOpenDetail={setActiveDetailMovie}
                    onBookTicket={setActiveBookingMovie}
                  />
                ))}
              </div>
            </div>

            {/* 3. Bảng Lịch Chiếu Trực Tiếp Theo Rạp (Live Showtime Matrix chuẩn Beta Cinemas) */}
            <div id="matrix-section" className="scroll-mt-24">
              <CinemaShowtimeMatrix
                movies={movies}
                onSelectShowtime={(movie, cinemaName, date, time, format) => {
                  setActiveBookingMovie(movie);
                }}
              />
            </div>

            {/* 4. Khám Phá Phim Theo Tâm Trạng (Mood-Based Discovery) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-wide">
                    Hôm nay tâm trạng bạn thế nào?
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Gợi ý AI thông minh</span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {MOOD_FILTERS.map((mood) => {
                  const Icon = mood.icon;
                  const isActive = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border ${
                        isActive
                          ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/30 scale-105"
                          : "bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh Tab bộ lọc thể loại nhanh */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex-shrink-0">
                  Thể loại:
                </span>
                {GENRE_FILTERS.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                      selectedGenre === genre
                        ? "bg-sky-600 text-white shadow-md font-bold"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner quảng bá Trợ lý AI Groq */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30 flex-shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>Bạn chưa biết nên xem phim gì tối nay?</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-sky-100 text-sky-700 border border-sky-200">
                        Gợi Ý Thông Minh
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Hỏi CineBot AI để được phân tích gu xem phim, tóm tắt đánh giá và tư vấn vị trí ghế ngồi đẹp nhất rạp chỉ trong 1 giây!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 hover:bg-sky-700 transition-all flex-shrink-0 transform hover:scale-105 active:scale-95"
                >
                  Trò chuyện với AI ngay
                </button>
              </div>
            </div>

            {/* 5. Khuyến Mãi & Sự Kiện Rạp Chiếu (Promotions & Popcorn Combos) */}
            <section id="promo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-sky-600 font-bold uppercase tracking-wider block">Ưu Đãi Rạp Chiếu</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                    <span>KHUYẾN MÃI & SỰ KIỆN HOT</span>
                    <Tag className="w-5 h-5 text-amber-500" />
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 p-5 flex flex-col justify-between group hover:border-sky-400 hover:shadow-md transition-all hover:scale-[1.01]">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 uppercase tracking-wider inline-block border border-rose-200">
                      Thứ 3 Vui Vẻ
                    </span>
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                      Đồng Giá Vé 45.000đ Mọi Suất Chiếu
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Áp dụng cho tất cả khách hàng vào thứ Ba hàng tuần tại mọi cụm rạp Beta Cinemas trên toàn quốc.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 mt-4">
                    <span>Hạn dùng: Đến hết 2026</span>
                    <span className="text-sky-600 font-bold flex items-center gap-1">Chi tiết →</span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 p-5 flex flex-col justify-between group hover:border-sky-400 hover:shadow-md transition-all hover:scale-[1.01]">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-600 uppercase tracking-wider inline-block border border-sky-200">
                      Beta Student Pass
                    </span>
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                      Ưu Đãi Học Sinh - Sinh Viên 45k - 50k
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Chỉ cần xuất trình thẻ học sinh, sinh viên tại quầy vé để nhận giá vé ưu đãi và giảm 20% combo bắp nước.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 mt-4">
                    <span>Áp dụng từ T2 đến T6</span>
                    <span className="text-sky-600 font-bold flex items-center gap-1">Chi tiết →</span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 p-5 flex flex-col justify-between group hover:border-sky-400 hover:shadow-md transition-all hover:scale-[1.01]">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 uppercase tracking-wider inline-block border border-amber-200">
                      Sweetbox Couple Night
                    </span>
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                      Tặng Kèm Bắp Rang Bơ Khi Đặt Ghế Đôi
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Thưởng thức không gian ghế đôi nỉ nhung riêng tư và nhận ngay 1 bắp phô mai thơm giòn nóng hổi.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 mt-4">
                    <span>Khung giờ sau 20:00</span>
                    <span className="text-sky-600 font-bold flex items-center gap-1">Chi tiết →</span>
                  </div>
                </div>
              </div>
            </section>
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

      {/* Modal Đặt Vé, Chọn Ghế, Thanh Toán VietQR & Xuất Vé QR Code */}
      <BookingModal
        movie={activeBookingMovie}
        initialSeats={bookingInitialSeats}
        initialShowtimeId={bookingInitialShowtimeId}
        onClose={() => {
          setActiveBookingMovie(null);
          setBookingInitialSeats([]);
          setBookingInitialShowtimeId(undefined);
        }}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Modal Ví Vé Của Tôi */}
      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
      />

      {/* Trợ lý AI Chat Widget phản hồi siêu tốc & Đặt vé nhanh */}
      <AiChatWidget
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen(!isAiChatOpen)}
        movies={movies}
        onSelectMovieForBooking={(movie, seats) => {
          setActiveBookingMovie(movie);
          setBookingInitialSeats(seats || []);
          setIsAiChatOpen(false);
        }}
      />

      {/* Modal Tìm Kiếm AI Spotlight (Goal 5 - Hugging Face RAG) */}
      <SemanticSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onBookMovie={(movie) => {
          setActiveBookingMovie(movie);
        }}
        onSelectMovie={(movie) => {
          setActiveDetailMovie(movie);
        }}
      />

      {/* Chân trang Footer */}
      <Footer />

    </div>
  );
}
