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

import { Sparkles, Flame, Film, Clapperboard, Award, SearchX, Smile, Compass, Brain, Heart, Zap, Tag, Gift, Percent, Ticket, CheckCircle2, X, Clock, Calendar, Check, Copy, ArrowRight, Info, Armchair, Popcorn } from "lucide-react";

interface PromoItem {
  id: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  title: string;
  shortDesc: string;
  validity: string;
  discountHighlight: string;
  promoCode: string;
  conditions: string[];
  applicableNote: string;
}

const PROMO_DATA: PromoItem[] = [
  {
    id: "tuesday-deal",
    badge: "Thứ 3 Vui Vẻ",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    badgeBorder: "border-rose-200",
    title: "Đồng Giá Vé 45.000đ Mọi Suất Chiếu",
    shortDesc: "Áp dụng cho tất cả khách hàng vào thứ Ba hàng tuần tại mọi cụm rạp Beta Cinemas trên toàn quốc.",
    validity: "Thứ 3 hàng tuần • Đến hết 31/12/2026",
    discountHighlight: "Đồng giá vé 45.000đ (Tiết kiệm tới 40%)",
    promoCode: "BETA45K",
    conditions: [
      "Áp dụng vào tất cả các ngày Thứ 3 hàng tuần cho mọi suất chiếu phim 2D.",
      "Miễn phụ thu ghế VIP (Ghế VIP đồng giá 45.000đ như ghế thường).",
      "Áp dụng cho cả hình thức đặt vé online trên website và mua trực tiếp tại quầy.",
      "Không giới hạn số lượng vé trong mỗi giao dịch đặt vé.",
      "Không áp dụng đồng thời cùng các chương trình thẻ cào trúng thưởng khác."
    ],
    applicableNote: "Mẹo: Bạn có thể chọn suất chiếu Thứ 3 bất kỳ để hệ thống tự động áp dụng giá vé 45k."
  },
  {
    id: "student-pass",
    badge: "Beta Student Pass",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
    badgeBorder: "border-sky-200",
    title: "Ưu Đãi Học Sinh - Sinh Viên 45k - 50k",
    shortDesc: "Chỉ cần xuất trình thẻ học sinh, sinh viên tại quầy vé để nhận giá vé ưu đãi và giảm 20% combo bắp nước.",
    validity: "Thứ 2 đến Thứ 6 • Đến hết 31/12/2026",
    discountHighlight: "Giá vé 45k (trước 17h) / 50k (sau 17h) + Giảm 20% Combo",
    promoCode: "STUDENTVIP",
    conditions: [
      "Áp dụng từ Thứ Hai đến Thứ Sáu cho đối tượng Học sinh, Sinh viên hoặc dưới 22 tuổi.",
      "Giá vé 45.000đ đối với các suất chiếu bắt đầu trước 17:00.",
      "Giá vé 50.000đ đối với các suất chiếu bắt đầu sau 17:00.",
      "Giảm thêm 20% khi mua kèm Combo Bắp Nước Solo (1 Bắp + 1 Nước).",
      "Vui lòng xuất trình thẻ HSSV (hoặc CCCD/VNeID) khi nhân viên rạp soát vé vào phòng chiếu."
    ],
    applicableNote: "Áp dụng cho mọi phim 2D đang chiếu tại cụm rạp."
  },
  {
    id: "sweetbox-couple",
    badge: "Sweetbox Couple Night",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    badgeBorder: "border-amber-200",
    title: "Tặng Kèm Bắp Rang Bơ Khi Đặt Ghế Đôi",
    shortDesc: "Thưởng thức không gian ghế đôi nỉ nhung riêng tư và nhận ngay 1 bắp phô mai thơm giòn nóng hổi.",
    validity: "Suất chiếu sau 20:00 • Tất cả các ngày trong tuần",
    discountHighlight: "Tặng miễn phí 01 Bắp Phô Mai 60oz (Trị giá 45.000đ)",
    promoCode: "SWEETBOXFREE",
    conditions: [
      "Áp dụng khi đặt từ 01 cặp ghế Sweetbox (Hàng K) cho các suất chiếu sau 20:00.",
      "Khách hàng nhận voucher bắp phô mai tự động đính kèm trong mã QR vé xem phim.",
      "Quét mã QR tại quầy Concession bắp nước để nhận bắp nóng ngay trước giờ chiếu.",
      "Có thể chọn nâng cấp vị caramel hoặc upsize ly nước với phụ thu chỉ từ 10.000đ.",
      "Áp dụng cho cả khách hàng thành viên và khách vãng lai."
    ],
    applicableNote: "Tận hưởng không gian rạp chiếu lãng mạn cùng ghế đôi Sweetbox bọc nhung cao cấp."
  }
];

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
  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null);
  const [copiedPromoCode, setCopiedPromoCode] = useState(false);

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

            {/* 5. Bảng Giá Vé Niêm Yết Rạp Chiếu (Official Price Table) */}
            <section id="price-table" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24 border-t border-slate-200">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs text-sky-600 font-bold uppercase tracking-wider block">Bảng Giá Niêm Yết Toàn Hệ Thống</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                    <span>BẢNG GIÁ VÉ & PHỤ THU RẠP CHIẾU</span>
                    <Ticket className="w-6 h-6 text-sky-600" />
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                    Giá vé minh bạch, đồng nhất cho mọi phòng chiếu tiêu chuẩn 2D. Đặt vé trực tuyến nhanh chóng, thanh toán VietQR tức thì và nhận vé QR điện tử vào thẳng phòng chiếu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Miễn phí đổi suất chiếu trước 60p
                  </span>
                </div>
              </div>

              {/* 4 Pricing Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Card 1: Ghế Tiêu Chuẩn */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-sky-400 hover:shadow-md transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 uppercase tracking-wider">
                        Hàng A - D
                      </span>
                      <Armchair className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">Ghế Tiêu Chuẩn</h4>
                    <p className="text-xs text-slate-500 mt-1">Standard Seat • Dãy đầu & giữa</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">55.000</span>
                        <span className="text-sm font-bold text-slate-600">đ/vé</span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        HSSV / Trẻ em: chỉ từ 45.000đ (trước 17h)
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Khoảng cách màn hình tiêu chuẩn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Ghế nỉ cao cấp đệm êm ái</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Âm thanh Dolby 7.1 trung thực</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      const target = movies.find((m) => m.status === "now_playing") || movies[0];
                      if (target) setActiveBookingMovie(target);
                    }}
                    className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Chọn Suất Chiếu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 2: Ghế VIP (Sweet Spot) */}
                <div className="bg-white rounded-2xl border-2 border-sky-500 p-5 flex flex-col justify-between shadow-sm relative group">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    Được Chọn Nhiều Nhất
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 uppercase tracking-wider border border-sky-200">
                        Hàng E - H
                      </span>
                      <Sparkles className="w-5 h-5 text-sky-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">Ghế VIP Sweet Spot</h4>
                    <p className="text-xs text-slate-500 mt-1">VIP Seat • Tầm nhìn trung tâm rạp</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-sky-600">75.000</span>
                        <span className="text-sm font-bold text-slate-600">đ/vé</span>
                      </div>
                      <p className="text-[11px] text-sky-700 font-medium mt-1">
                        Phụ thu +20k so với ghế thường
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">Tầm nhìn 100% diện tích màn chiếu</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Khoảng để chân rộng rãi thoải mái</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Trục âm thanh vòm hoàn hảo nhất</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      const target = movies.find((m) => m.status === "now_playing") || movies[0];
                      if (target) setActiveBookingMovie(target);
                    }}
                    className="w-full mt-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
                  >
                    <span>Đặt Vé Ghế VIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 3: Ghế Đôi Sweetbox */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-sky-400 hover:shadow-md transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 uppercase tracking-wider border border-rose-200">
                        Hàng K (Ghế Đôi)
                      </span>
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">Sweetbox Ghế Đôi</h4>
                    <p className="text-xs text-slate-500 mt-1">Couple Sweetbox • Trọn gói 2 người</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">130.000</span>
                        <span className="text-sm font-bold text-slate-600">đ/cặp</span>
                      </div>
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        Chỉ 65.000đ/người • Bao gồm 2 vé
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">Vách ngăn riêng tư cao cấp</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Ghế sofa đôi bọc nhung liền khối</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Tặng bắp phô mai suất chiếu sau 20h</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      const target = movies.find((m) => m.status === "now_playing") || movies[0];
                      if (target) setActiveBookingMovie(target);
                    }}
                    className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đặt Ghế Đôi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 4: Combo Bắp Nước Concession */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-sky-400 hover:shadow-md transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-200">
                        Bắp & Nước Uống
                      </span>
                      <Popcorn className="w-5 h-5 text-amber-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">Combo Bắp Nước Rạp</h4>
                    <p className="text-xs text-slate-500 mt-1">Concession • Solo & Couple & Party</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-500">Từ</span>
                        <span className="text-3xl font-black text-slate-900">59.000</span>
                        <span className="text-sm font-bold text-slate-600">đ</span>
                      </div>
                      <p className="text-[11px] text-amber-700 font-medium mt-1">
                        Tiết kiệm tới 30% so với mua trực tiếp
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Bắp rang bơ phô mai / caramel giòn rụm</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Nước ngọt tươi có ga hoặc trà hoa quả</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Tùy biến vị bắp và cỡ ly khi đặt vé</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="#promo-section"
                    className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <span>Xem Menu Combo 68k</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-sky-600" />
                    Bảng Chi Tiết Giá Vé Theo Khung Giờ & Đối Tượng
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Đơn vị tính: VNĐ / vé
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/70 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Loại Vé & Đối Tượng</th>
                        <th className="py-3 px-4 text-center">Thứ 2 - Thứ 6 (Trước 17:00)</th>
                        <th className="py-3 px-4 text-center">Thứ 2 - Thứ 6 (Sau 17:00)</th>
                        <th className="py-3 px-4 text-center">Thứ 7, CN & Ngày Lễ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Học Sinh - Sinh Viên / Trẻ Em (U22)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">45.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">50.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">55.000đ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Ghế Thường (Hàng A - D)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">55.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">60.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">65.000đ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors bg-sky-50/30">
                        <td className="py-3 px-4 font-semibold text-sky-900 flex items-center gap-1.5">
                          <span>Ghế VIP Sweet Spot (Hàng E - H)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-bold">Hot</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sky-600">75.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-sky-600">80.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-sky-600">85.000đ</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Ghế Đôi Sweetbox (Hàng K - 2 vé)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">130.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">140.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">150.000đ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50/80 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>* Giá trên đã bao gồm thuế VAT (8%). Áp dụng cho các phòng chiếu 2D tiêu chuẩn.</span>
                  <span className="text-sky-600 font-semibold">🎉 Thứ 3 hàng tuần: Đồng giá 45.000đ mọi loại ghế</span>
                </div>
              </div>
            </section>

            {/* 6. Khuyến Mãi & Sự Kiện Rạp Chiếu (Promotions & Popcorn Combos) */}
            <section id="promo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-sky-600 font-bold uppercase tracking-wider block">Ưu Đãi Rạp Chiếu</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                    <span>KHUYẾN MÃI & COMBO BẮP NƯỚC HOT</span>
                    <Tag className="w-5 h-5 text-amber-500" />
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PROMO_DATA.map((promo) => (
                  <div
                    key={promo.id}
                    onClick={() => {
                      setSelectedPromo(promo);
                      setCopiedPromoCode(false);
                    }}
                    className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 p-5 flex flex-col justify-between group hover:border-sky-400 hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="space-y-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${promo.badgeBg} ${promo.badgeText} uppercase tracking-wider inline-block border ${promo.badgeBorder}`}>
                        {promo.badge}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                        {promo.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {promo.shortDesc}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 mt-4">
                      <span>{promo.validity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPromo(promo);
                          setCopiedPromoCode(false);
                        }}
                        className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        Chi tiết →
                      </button>
                    </div>
                  </div>
                ))}
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
        onSelectMovieForBooking={(movie, seats, showtimeId) => {
          if (showtimeId) {
            setBookingInitialShowtimeId(showtimeId);
          }
          setActiveBookingMovie(movie);
          setBookingInitialSeats(seats || []);
          setIsAiChatOpen(false);
        }}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectMood={(moodId) => setSelectedMood(moodId)}
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

      {/* Modal Chi Tiết Khuyến Mãi & Thể Lệ Ưu Đãi */}
      {selectedPromo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPromo(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedPromo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${selectedPromo.badgeBg} ${selectedPromo.badgeText} uppercase tracking-wider border ${selectedPromo.badgeBorder}`}>
                {selectedPromo.badge}
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {selectedPromo.validity}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 leading-snug">
              {selectedPromo.title}
            </h3>

            {/* Promo discount banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-sky-700 font-medium block">Mức ưu đãi:</span>
                <span className="text-sm font-extrabold text-sky-900">{selectedPromo.discountHighlight}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(selectedPromo.promoCode);
                      setCopiedPromoCode(true);
                      setTimeout(() => setCopiedPromoCode(false), 2000);
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100/50 transition-colors cursor-pointer shadow-sm"
                >
                  {copiedPromoCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Mã: {selectedPromo.promoCode}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Điều kiện áp dụng */}
            <div className="mt-5 space-y-2.5">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Điều Kiện & Thể Lệ Áp Dụng
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                {selectedPromo.conditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ghi chú */}
            <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <span>{selectedPromo.applicableNote}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedPromo(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setSelectedPromo(null);
                  const target = movies.find((m) => m.status === "now_playing") || movies[0];
                  if (target) {
                    setActiveBookingMovie(target);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-600/30 cursor-pointer"
              >
                <span>Áp Dụng Ưu Đãi & Đặt Vé Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chân trang Footer */}
      <Footer />

    </div>
  );
}
