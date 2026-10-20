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
import { MovieCarousel } from "@/components/MovieCarousel";
import { Footer } from "@/components/Footer";
import { CustomerAtmosphere } from "@/components/CustomerAtmosphere";
import { HalloweenMovieShowcase } from "@/components/HalloweenMovieShowcase";
import { CustomerLoginModal } from "@/components/CustomerLoginModal";
import { useBookingStore } from "@/store/useBookingStore";

import { Sparkles, Flame, Film, Clapperboard, Award, SearchX, Smile, Compass, Brain, Heart, Tag, Gift, Percent, Ticket, CheckCircle2, X, Clock, Calendar, Check, Copy, ArrowRight, Info, Armchair, Popcorn, Headphones, Crown, Star } from "lucide-react";

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
  image: string;
}

const PROMO_DATA: PromoItem[] = [
  {
    id: "cinemax-happy-wednesday",
    badge: "CineMax Happy Wednesday",
    badgeBg: "bg-[#E50914]/20",
    badgeText: "text-[#E50914]",
    badgeBorder: "border-[#E50914]/40",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
    title: "Thứ Tư Vui Vẻ - Đồng Giá Vé 45.000đ",
    shortDesc: "Chương trình ưu đãi truyền thống được yêu thích nhất tại CineMax Cinemas. Đồng giá 45.000đ mọi suất chiếu 2D và miễn phụ thu ghế VIP.",
    validity: "Thứ 4 hàng tuần • Đến hết 31/12/2026",
    discountHighlight: "Đồng giá vé 45.000đ (Miễn phụ thu ghế VIP)",
    promoCode: "CINEMAXHAPPY45",
    conditions: [
      "Áp dụng vào tất cả các ngày Thứ Tư hàng tuần cho mọi suất chiếu phim 2D.",
      "Miễn hoàn toàn phụ thu ghế VIP (Ghế VIP đồng giá 45.000đ).",
      "Áp dụng cho cả hình thức đặt vé online trên website và mua tại quầy.",
      "Không giới hạn số lượng vé trong mỗi giao dịch đặt vé.",
      "Tự động áp dụng khi chọn suất chiếu ngày Thứ 4."
    ],
    applicableNote: "Mẹo: Bạn có thể chọn suất chiếu Thứ 4 bất kỳ để hệ thống tự động áp dụng giá vé 45k."
  },
  {
    id: "cinemax-u22-pass",
    badge: "CineMax U22 Pass",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-[#F5C518]",
    badgeBorder: "border-amber-500/40",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
    title: "Đặc Quyền Thành Viên U22 - Giá Vé 45k - 50k",
    shortDesc: "Dành riêng cho khán giả từ 12 đến 22 tuổi hoặc học sinh - sinh viên. Xem phim thả ga cả tuần với mức giá siêu ưu đãi.",
    validity: "Thứ 2 đến Thứ 6 • Đến hết 31/12/2026",
    discountHighlight: "Giá vé 45k (trước 17h) / 50k (sau 17h) + Giảm 20% Combo",
    promoCode: "CINEMAXU22",
    conditions: [
      "Áp dụng từ Thứ Hai đến Thứ Sáu cho đối tượng Học sinh, Sinh viên hoặc dưới 22 tuổi.",
      "Giá vé 45.000đ đối với các suất chiếu bắt đầu trước 17:00.",
      "Giá vé 50.000đ đối với các suất chiếu bắt đầu sau 17:00.",
      "Giảm thêm 20% khi mua kèm Combo Bắp Nước Solo (1 Bắp + 1 Nước).",
      "Vui lòng xuất trình thẻ HSSV hoặc CCCD khi nhân viên soát vé vào phòng chiếu."
    ],
    applicableNote: "Áp dụng cho mọi phim 2D đang chiếu tại cụm rạp CineMax."
  },
  {
    id: "cinemax-anime-festival",
    badge: "Lễ Hội Hoạt Hình",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/40",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    title: "Đại Tiệc Hoạt Hình CineMax - Tặng Quà Độc Quyền",
    shortDesc: "Thưởng thức các siêu phẩm hoạt hình Doraemon, Conan, Kung Fu Panda 4 và nhận thẻ sưu tầm hologram cùng ưu đãi bình nước Minions.",
    validity: "Tất cả các ngày trong tuần • Số lượng có hạn",
    discountHighlight: "Tặng thẻ Hologram + Giảm 30% Ly nước nhân vật",
    promoCode: "CINEMAXANIME",
    conditions: [
      "Áp dụng khi đặt vé xem các bộ phim thuộc thể loại Hoạt hình.",
      "Nhận thẻ sưu tầm nhân vật bản quyền tại quầy vé trước giờ chiếu.",
      "Ưu đãi giảm giá trực tiếp combo ly nhân vật Minions / Doraemon.",
      "Áp dụng cho cả vé trẻ em và vé người lớn."
    ],
    applicableNote: "Chương trình áp dụng tại tất cả các cụm rạp CineMax trên toàn quốc."
  },
  {
    id: "sweetbox-couple",
    badge: "Sweetbox Couple",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-400",
    badgeBorder: "border-rose-500/40",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80",
    title: "Sweetbox Ghế Đôi - Tặng Kèm Bắp Phô Mai",
    shortDesc: "Thưởng thức không gian ghế đôi nỉ nhung riêng tư và nhận ngay 1 bắp phô mai thơm giòn nóng hổi cho buổi hẹn hò lãng mạn.",
    validity: "Suất chiếu sau 20:00 • Tất cả các ngày trong tuần",
    discountHighlight: "Tặng miễn phí 01 Bắp Phô Mai 60oz (Trị giá 45.000đ)",
    promoCode: "SWEETBOXFREE",
    conditions: [
      "Áp dụng khi đặt từ 01 cặp ghế Sweetbox (Hàng K) cho các suất chiếu sau 20:00.",
      "Khách hàng nhận voucher bắp phô mai tự động đính kèm trong mã QR vé xem phim.",
      "Quét mã QR tại quầy Concession bắp nước để nhận bắp nóng ngay trước giờ chiếu.",
      "Có thể nâng cấp vị caramel hoặc upsize ly nước chỉ từ 10.000đ."
    ],
    applicableNote: "Tận hưởng không gian rạp chiếu lãng mạn cùng ghế đôi Sweetbox bọc nhung cao cấp."
  }
];

const GENRE_FILTERS = ["Tất cả", "Hành động", "Khoa học viễn tưởng", "Kinh dị", "Hoạt hình", "Chính kịch"];

const MOOD_FILTERS = [
  { id: "all", label: "Tất cả phim", icon: Compass, color: "from-blue-500/20 to-cyan-500/20 text-cyan-300" },
  { id: "halloween", label: "🎃 Phim Kinh Dị", icon: Flame, color: "from-orange-600/30 to-purple-600/30 text-orange-400 border border-orange-500/40" },
  { id: "blockbuster", label: "Bom tấn hành động", icon: Flame, color: "from-red-500/20 to-orange-500/20 text-orange-300" },
  { id: "mindblown", label: "Khoa học viễn tưởng", icon: Film, color: "from-purple-500/20 to-indigo-500/20 text-purple-300" },
  { id: "chill", label: "Hoạt hình & Hài", icon: Smile, color: "from-emerald-500/20 to-teal-500/20 text-emerald-300" },
  { id: "emotional", label: "Tâm lý & Tình cảm", icon: Heart, color: "from-pink-500/20 to-rose-500/20 text-pink-300" },
];

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [selectedMood, setSelectedMood] = useState("all");

  // Tab chuyển đổi phim chuẩn rạp (Đang chiếu / Sắp chiếu / Suất chiếu đặc biệt / Phim Halloween)
  const [activeCommercialTab, setActiveCommercialTab] = useState<"now_playing" | "upcoming" | "trending" | "halloween">("now_playing");

  // State các Modal
  const [activeDetailMovie, setActiveDetailMovie] = useState<Movie | null>(null);
  const [activeBookingMovie, setActiveBookingMovie] = useState<Movie | null>(null);
  const [bookingInitialSeats, setBookingInitialSeats] = useState<string[]>([]);
  const [bookingInitialShowtimeId, setBookingInitialShowtimeId] = useState<string | undefined>(undefined);
  const [bookingInitialCouponCode, setBookingInitialCouponCode] = useState<string | undefined>(undefined);
  const [bookingInitialComboId, setBookingInitialComboId] = useState<string | undefined>(undefined);
  // Trạng thái ưu đãi kích hoạt trực tiếp trên trang (Inline Offer Bar) - KHÔNG DÙNG MODAL NỔI
  const [activeInlineOffer, setActiveInlineOffer] = useState<{
    type: "combo" | "coupon" | "seat_type" | "quick_book";
    title: string;
    description: string;
    badge: string;
    comboId?: string;
    couponCode?: string;
  } | null>(null);

  const handleTriggerInlineOffer = (offer: {
    type: "combo" | "coupon" | "seat_type" | "quick_book";
    title: string;
    description: string;
    badge: string;
    comboId?: string;
    couponCode?: string;
  }) => {
    setActiveInlineOffer(offer);
    const el = document.getElementById("commercial-tabs");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [pendingBookingMovie, setPendingBookingMovie] = useState<{
    movie: Movie;
    initialSeats?: string[];
    initialShowtimeId?: string;
  } | null>(null);
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

  // Đọc số lượng vé đã đặt và thông tin tài khoản khách hàng
  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cinemax_tickets");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTicketCount(parsed.length);
      }
      const storedPhone = localStorage.getItem("cinemax_customer_phone");
      const storedName = localStorage.getItem("cinemax_customer_name");
      if (storedPhone && storedPhone.trim()) {
        setCustomerInfo({
          phone: storedPhone.trim(),
          name: storedName?.trim() || "Thành viên CineMax",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Thông báo phát trực tiếp từ Quản trị viên rạp (Live Admin Broadcast)
  const [liveAnnouncement, setLiveAnnouncement] = useState<{
    enabled: boolean;
    text: string;
    type: "promo" | "alert" | "event" | "maintenance";
    actionText: string;
    actionUrl: string;
  } | null>(null);

  // Chủ đề Halloween trang khách được điều khiển trực tiếp từ Admin
  const [isCustomerHalloween, setIsCustomerHalloween] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = () => {
      fetch("/api/settings")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (!isMounted) return;
          if (data?.data?.announcement?.enabled) {
            setLiveAnnouncement((prev) => (JSON.stringify(prev) !== JSON.stringify(data.data.announcement) ? data.data.announcement : prev));
          } else if (data?.data?.announcement && !data.data.announcement.enabled) {
            setLiveAnnouncement(null);
          }
          if (typeof data?.data?.halloweenThemeEnabled === "boolean") {
            setIsCustomerHalloween((prev) => (prev !== data.data.halloweenThemeEnabled ? data.data.halloweenThemeEnabled : prev));
          }
        })
        .catch(() => {});
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 10000);
    const handleFocus = () => fetchSettings();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
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
    if (newTicket.customerName && newTicket.customerPhone) {
      setCustomerInfo({
        name: newTicket.customerName,
        phone: newTicket.customerPhone,
      });
    }
  };

  // Trực tiếp mở quy trình đặt vé cho khách (không ép đăng nhập trước)
  const handleRequestBooking = (
    movie: Movie,
    initialSeats: string[] = [],
    initialShowtimeId?: string,
    initialCouponCode?: string,
    initialComboId?: string
  ) => {
    // Tự động kế thừa mã ưu đãi hoặc mã combo nếu khách đang kích hoạt dải Inline Offer
    const effectiveCoupon = initialCouponCode || activeInlineOffer?.couponCode;
    const effectiveCombo = initialComboId || activeInlineOffer?.comboId;

    if (initialShowtimeId) {
      setBookingInitialShowtimeId(initialShowtimeId);
    } else {
      setBookingInitialShowtimeId(undefined);
    }
    setBookingInitialSeats(initialSeats);
    setBookingInitialCouponCode(effectiveCoupon);
    setBookingInitialComboId(effectiveCombo);
    setActiveBookingMovie(movie);
  };

  const handleCustomerLoginSuccess = (info: { name: string; phone: string; email?: string }) => {
    setCustomerInfo({ name: info.name, phone: info.phone });
    setIsCustomerLoginOpen(false);

    if (pendingBookingMovie) {
      if (pendingBookingMovie.initialShowtimeId) {
        setBookingInitialShowtimeId(pendingBookingMovie.initialShowtimeId);
      }
      setBookingInitialSeats(pendingBookingMovie.initialSeats || []);
      setActiveBookingMovie(pendingBookingMovie.movie);
      setPendingBookingMovie(null);
    }
  };

  // Phim nổi bật nhất cho Hero Banner
  const heroMovie = movies[0]; // Dune: Phần Hai

  // Danh sách phân loại
  const nowPlayingMovies = useMemo(() => movies.filter((m) => m.status === "now_playing"), [movies]);
  const trendingMovies = useMemo(() => movies.filter((m) => m.status === "trending"), [movies]);
  const upcomingMovies = useMemo(() => movies.filter((m) => m.status === "upcoming"), [movies]);
  const horrorMovies = useMemo(() => {
    return movies.filter((m) => {
      const isExplicitHorror = m.genres.some(
        (g) =>
          g.toLowerCase().includes("kinh dị") ||
          g.toLowerCase().includes("horror") ||
          g.toLowerCase().includes("giật gân") ||
          g.toLowerCase().includes("tâm linh") ||
          g.toLowerCase().includes("bí ẩn")
      );
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
  }, [movies]);

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
      if (selectedMood === "halloween") {
        matchMood =
          m.genres.some((g) =>
            ["Kinh dị", "Giật gân", "Bí ẩn", "Tâm linh", "Tội phạm"].some((genreKey) =>
              g.toLowerCase().includes(genreKey.toLowerCase())
            )
          ) ||
          [
            "exhuma",
            "the-nun-2",
            "smile-2",
            "a-quiet-place-day-one",
            "alien-romulus",
            "chuyen-ma-gan-nha",
            "terrifier-3",
            "the-conjuring-3",
            "longlegs",
          ].includes(String(m.id));
      } else if (selectedMood === "blockbuster") {
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
    <div className={`min-h-screen flex flex-col transition-colors duration-500 relative ${
      isCustomerHalloween
        ? "halloween-page-bg text-neutral-100 selection:bg-[#FF7518] selection:text-white"
        : "bg-background selection:bg-accent-red selection:text-white"
    }`}>
      {/* Hiệu ứng không gian rạp chiếu & Lễ hội Halloween */}
      <CustomerAtmosphere isHalloween={isCustomerHalloween} />

      {/* Header thanh điều hướng */}
      <Navbar
        onSearchChange={setSearchQuery}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLogin={() => setIsCustomerLoginOpen(true)}
        ticketCount={ticketCount}
        customerInfo={customerInfo}
        announcement={liveAnnouncement}
        isHalloween={isCustomerHalloween}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* Dải Banner Lễ Hội Halloween Trang Khách (Kích hoạt trực tiếp từ Admin) */}
      {isCustomerHalloween && (
        <div className="w-full bg-gradient-to-r from-orange-600/30 via-purple-950/90 to-orange-600/30 border-b border-orange-500/40 py-2.5 px-4 shadow-xl shadow-orange-500/10 z-10 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-orange-200 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-base animate-bounce">🎃</span>
              <strong className="text-orange-400 uppercase tracking-wider font-black">
                Lễ Hội Điện Ảnh Halloween Spooky CineMax 2026
              </strong>
              <span className="hidden md:inline text-white/30">•</span>
              <span className="hidden md:inline text-neutral-300">
                Đồng giá vé phim kinh dị 45k, combo bắp phô mai bí ngô & quà tặng thẻ hologram
              </span>
            </div>
            <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5 ml-auto">
              <span>🦇 🕸️</span>
              <span className="hidden sm:inline">Trang Khách Đang Kích Hoạt Theme Halloween</span>
            </span>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Banner thông báo kết quả giao dịch VNPay */}
        {vnpayNotice && (
          <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 pt-6">
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
                <CheckCircle2 className="w-5 h-5 shrink-0" />
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
          <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-10">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  {searchQuery ? (
                    <>Kết quả tìm kiếm cho: <span className="text-[#E50914]">"{searchQuery}"</span></>
                  ) : (
                    <>Khám phá theo: <span className="text-[#E50914]">{MOOD_FILTERS.find(m => m.id === selectedMood)?.label || selectedGenre}</span></>
                  )}
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Tìm thấy {filteredMovies.length} bộ phim phù hợp với sở thích của bạn
                </p>
              </div>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMood("all");
                  setSelectedGenre("Tất cả");
                }}
                className="text-xs text-[#E50914] hover:underline font-semibold self-start sm:self-auto cursor-pointer"
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
                    onBookTicket={(m) => handleRequestBooking(m)}
                    isHalloween={isCustomerHalloween}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <SearchX className="w-12 h-12 text-[#9CA3AF]" />
                <h3 className="text-lg font-bold text-white">Không tìm thấy bộ phim phù hợp</h3>
                <p className="text-xs text-[#9CA3AF] max-w-sm">
                  Thử tìm kiếm với từ khóa khác hoặc bấm nút hỗ trợ bên dưới để được tư vấn chọn phim và suất chiếu nhanh nhất.
                </p>
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-[#E50914] text-white hover:bg-[#b80710] text-xs font-bold flex items-center gap-2 mt-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Headphones className="w-4 h-4 text-white" />
                  <span>Hỗ trợ đặt vé</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* GIAO DIỆN TRANG CHỦ CINEMATIC DARK MODE (NETFLIX & CGV HYBRID) */
          <>
            {/* 1. HERO BANNER TRÀN VIỀN 100% CHIỀU NGANG */}
            <section className="w-full relative">
              <HeroBanner
                movies={movies}
                onWatchTrailer={setActiveDetailMovie}
                onBookTicket={(m) => handleRequestBooking(m)}
                isHalloween={isCustomerHalloween}
              />
            </section>

            {/* 2. THANH ĐẶT VÉ NHANH NẰM ĐÈ LÊN RANH GIỚI HERO BANNER (-mt-12) */}
            <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
              <QuickBookingBar
                movies={movies}
                onQuickBook={(movie, cinemaName, date, time, format, showtimeId) => {
                  handleRequestBooking(movie, [], showtimeId);
                }}
                onRequestSelectMovie={() => {
                  handleTriggerInlineOffer({
                    type: "quick_book",
                    title: "Đặt Vé Nhanh CineMax",
                    description: "Vui lòng chọn bất kỳ bộ phim đang chiếu nào bên dưới để tiếp tục chọn rạp và suất chiếu:",
                    badge: "ĐẶT VÉ NHANH",
                  });
                }}
              />
            </section>

            {/* 2.5. KHU VỰC ĐỀ XUẤT ĐIỆN ẢNH HALLOWEEN (CHỈ HIỂN THỊ KHI BẬT THEME HALLOWEEN) */}
            {isCustomerHalloween && (
              <HalloweenMovieShowcase
                movies={movies}
                onBookTicket={(m) => handleRequestBooking(m)}
                onWatchTrailer={setActiveDetailMovie}
              />
            )}

            {/* 3. KHU VỰC "MOVIE SELECTION": TIÊU ĐỀ KẺ ĐÔI & TRƯỢT 4 PHIM */}
            {/* 3. KHU VỰC "MOVIE SELECTION": DANH SÁCH PHIM ĐANG CHIẾU & SẮP CHIẾU */}
            <div id="commercial-tabs" className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 mt-16 scroll-mt-24">
              {/* DẢI BANNER ƯU ĐÃI INLINE (INLINE OFFER BAR) - KHÔNG DÙNG MODAL NỔI */}
              {activeInlineOffer && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#1E1116] to-[#12141C] border-2 border-red-500/60 shadow-2xl shadow-red-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                      {activeInlineOffer.type === "combo" ? (
                        <Popcorn className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      ) : activeInlineOffer.type === "coupon" ? (
                        <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                      ) : (
                        <Armchair className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                          {activeInlineOffer.badge}
                        </span>
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ưu đãi áp dụng trực tiếp</span>
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-white">
                        {activeInlineOffer.title}
                      </h3>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        {activeInlineOffer.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden md:inline-block text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                      👉 Bấm "Đặt vé" trên poster phim bất kỳ bên dưới
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveInlineOffer(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hủy ưu đãi</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Tiêu đề Section chuẩn Điện Ảnh: Căn trái, thanh dọc đỏ */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
                <div className={`border-l-4 pl-4 ${isCustomerHalloween ? "border-[#FF7518]" : "border-[#E50914]"}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isCustomerHalloween ? "text-[#FF7518]" : "text-[#E50914]"}`}>
                    {isCustomerHalloween ? "🎃 Lễ Hội Điện Ảnh Rùng Rợn" : "Danh Sách Phim Chiếu Rạp"}
                  </span>
                  <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase text-white tracking-tight">
                    PHIM ĐIỆN ẢNH CINEMAX
                  </h2>
                </div>
              </div>

              {/* Thanh Chuyển Tab Phim (Khử hoàn toàn dấu vết AI giám sát server) */}
              <div className="flex items-center gap-4 sm:gap-8 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
                {isCustomerHalloween && (
                  <button
                    type="button"
                    onClick={() => setActiveCommercialTab("halloween")}
                    className={`font-heading text-base sm:text-xl font-bold tracking-wide transition-all flex items-center gap-2 pb-3 -mb-4.5 border-b-2 cursor-pointer uppercase ${
                      activeCommercialTab === "halloween"
                        ? "text-[#FF7518] border-[#FF7518]"
                        : "text-orange-300/70 border-transparent hover:text-orange-400"
                    }`}
                  >
                    <span>🎃 PHIM HALLOWEEN</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                      {horrorMovies.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveCommercialTab("now_playing")}
                  className={`font-heading text-base sm:text-xl font-bold tracking-wide transition-all flex items-center gap-2 pb-3 -mb-4.5 border-b-2 cursor-pointer uppercase ${
                    activeCommercialTab === "now_playing"
                      ? isCustomerHalloween ? "text-[#FF7518] border-[#FF7518]" : "text-[#E50914] border-[#E50914]"
                      : "text-[#9CA3AF] border-transparent hover:text-white"
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>PHIM ĐANG CHIẾU</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${
                    isCustomerHalloween
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                      : "bg-[#E50914]/20 text-[#E50914] border-[#E50914]/30"
                  }`}>
                    {nowPlayingMovies.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCommercialTab("upcoming")}
                  className={`font-heading text-base sm:text-xl font-bold tracking-wide transition-all flex items-center gap-2 pb-3 -mb-4.5 border-b-2 cursor-pointer uppercase ${
                    activeCommercialTab === "upcoming"
                      ? isCustomerHalloween ? "text-[#FF7518] border-[#FF7518]" : "text-[#E50914] border-[#E50914]"
                      : "text-[#9CA3AF] border-transparent hover:text-white"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>PHIM SẮP CHIẾU</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-[#9CA3AF] font-bold border border-white/15">
                    {upcomingMovies.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCommercialTab("trending")}
                  className={`font-heading text-base sm:text-xl font-bold tracking-wide transition-all hidden sm:flex items-center gap-2 pb-3 -mb-4.5 border-b-2 cursor-pointer uppercase ${
                    activeCommercialTab === "trending"
                      ? isCustomerHalloween ? "text-[#FF7518] border-[#FF7518]" : "text-[#E50914] border-[#E50914]"
                      : "text-[#9CA3AF] border-transparent hover:text-white"
                  }`}
                >
                  <Flame className={`w-4 h-4 ${isCustomerHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                  <span>SUẤT CHIẾU ĐẶC BIỆT</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${
                    isCustomerHalloween
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                      : "bg-[#E50914]/20 text-[#E50914] border-[#E50914]/30"
                  }`}>
                    HOT
                  </span>
                </button>
              </div>

              {/* LƯỚI CAROUSEL TRƯỢT 4 PHIM TRÊN 1 HÀNG CHUẨN CGV */}
              <div className="mt-6">
                <MovieCarousel
                  movies={
                    activeCommercialTab === "halloween"
                      ? horrorMovies
                      : activeCommercialTab === "now_playing"
                      ? nowPlayingMovies
                      : activeCommercialTab === "upcoming"
                      ? upcomingMovies
                      : trendingMovies
                  }
                  onOpenDetail={setActiveDetailMovie}
                  onBookTicket={(m) => handleRequestBooking(m)}
                  isHalloween={isCustomerHalloween}
                />
              </div>
            </div>

            {/* 4. LỊCH CHIẾU PHIM TRỰC TIẾP (ĐƯỢC ĐẶT NGAY SAU DANH SÁCH PHIM ĐỂ TIỆN CHỌN SUẤT) */}
            <div id="matrix-section" className="scroll-mt-24">
              <CinemaShowtimeMatrix
                movies={movies}
                onSelectShowtime={(movie, cinemaName, date, time, format) => {
                  handleRequestBooking(movie);
                }}
              />
            </div>

            {/* 5. VỊ TRÍ VÀNG: SỰ KIỆN & ƯU ĐÃI (EVENTS & COMBOS) - NẰM NGAY SAU LỊCH CHIẾU */}
            <section id="promo-section" className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-12 scroll-mt-24">
              {/* Tiêu đề Section chuẩn Điện Ảnh */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-white/10 pb-4">
                <div className="border-l-4 border-[#E50914] pl-4">
                  <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider block mb-1">
                    Ưu Đãi & Bắp Nước Độc Quyền
                  </span>
                  <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase text-white tracking-tight">
                    SỰ KIỆN & KHUYẾN MÃI CINEMAX
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
                    Săn vé đồng giá 45k, combo bắp nước phiên bản giới hạn và quà tặng độc quyền từ các siêu phẩm điện ảnh
                  </p>
                </div>
              </div>

              {/* NHÁNH 1: KHỐI NỔI BẬT (FEATURED MERCHANDISE & EXCLUSIVE COMBO BANNER) */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-[#12141C] via-[#161922] to-[#12141C] shadow-2xl mb-8 group">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  {/* Cột trái: Thông tin Combo & Giá trị lớn */}
                  <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-md text-[11px] font-heading font-bold bg-[#E50914] text-white uppercase tracking-wider shadow-md">
                        COMBO BOM TẤN GIỚI HẠN
                      </span>
                      <span className="text-xs font-bold text-[#F5C518] uppercase tracking-wider">
                        • Số lượng có hạn
                      </span>
                    </div>

                    <h3 className="font-heading text-3xl sm:text-5xl font-bold text-white uppercase leading-tight tracking-tight">
                      DUNE: POPCORN BUCKET SA MẠC & BÌNH NƯỚC CONAN 2024
                    </h3>

                    <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-xl leading-relaxed">
                      Sở hữu ngay mẫu xô bắp tạo hình Sandworm sa mạc Arrakis cùng bình nước phiên bản kỷ niệm Conan Movie 27 độc quyền tại cụm rạp CineMax.
                    </p>

                    <div className="flex flex-wrap items-baseline gap-3 pt-2">
                      <span className="font-heading text-3xl sm:text-4xl font-bold text-[#F5C518]">
                        CHỈ 139.000đ
                      </span>
                      <span className="text-sm text-[#9CA3AF] line-through">
                        Giá gốc: 215.000đ
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        Tiết kiệm 35% khi đặt vé
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleTriggerInlineOffer({
                            type: "combo",
                            title: "Ưu Đãi Combo Bom Tấn Solo Tiết Kiệm 35%",
                            description: "Vui lòng chọn bất kỳ bộ phim nào bên dưới để vào màn hình giữ ghế & nhận combo bắp nước 35%!",
                            badge: "TIẾT KIỆM 35%",
                            comboId: "combo-beta-solo",
                          });
                        }}
                        className="px-7 py-3.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-heading font-bold text-sm uppercase tracking-wider shadow-xl shadow-red-600/40 flex items-center gap-2.5 transform hover:scale-105 active:scale-95 transition-all cursor-pointer border border-red-500/40"
                      >
                        <Popcorn className="w-4 h-4" />
                        <span>ĐẶT COMBO KÈM VÉ NGAY</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cột phải: Hình ảnh Merchandise thực tế */}
                  <div className="lg:col-span-5 relative h-64 lg:h-full min-h-[280px] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=1000&auto=format&fit=crop&q=80"
                      alt="Combo Bắp Nước CineMax Giới Hạn"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[#12141C]/40 to-[#12141C]" />
                  </div>
                </div>
              </div>

              {/* NHÁNH 2: DANH SÁCH CUỘN VÉ ƯU ĐÃI (TICKET VOUCHER CARDS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Voucher 1: Thứ 4 Đồng Giá 45k */}
                <div
                  onClick={() => {
                    setSelectedPromo(PROMO_DATA[0]);
                    setCopiedPromoCode(false);
                  }}
                  className="relative bg-[#161922] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914] hover:shadow-[0_15px_30px_rgba(229,9,20,0.2)] transition-all duration-300 group cursor-pointer overflow-hidden"
                >
                  {/* Đường cắt vé bán nguyệt 2 bên mép */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-r border-white/10" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-l border-white/10" />

                  <div className="px-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                        THỨ 4 HÀNG TUẦN
                      </span>
                      <Tag className="w-4 h-4 text-[#F5C518]" />
                    </div>

                    {/* Con số giá trị cực lớn */}
                    <div className="my-3">
                      <span className="font-heading text-4xl sm:text-5xl font-bold text-[#F5C518] tracking-tight block">
                        ĐỒNG GIÁ 45K
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider mt-1 block">
                        THỨ TƯ VUI VẺ - CINEMAX HAPPY DAY
                      </span>
                    </div>

                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      Đồng giá 45.000đ mọi suất chiếu 2D và miễn hoàn toàn phụ thu ghế VIP cho tất cả khán giả.
                    </p>
                  </div>

                  {/* Phần chân cuộn vé có đường kẻ đứt nét */}
                  <div className="mt-4 pt-4 border-t border-dashed border-white/20 px-2 flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-[11px] text-[#9CA3AF] bg-white/5 px-2 py-1 rounded border border-white/10">
                      MÃ: CINEMAXHAPPY45
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerInlineOffer({
                            type: "coupon",
                            title: "Thứ Tư Vui Vẻ - Đồng Giá 45k",
                            description: "Mã CINEMAXHAPPY45 đã được kích hoạt. Hãy chọn phim chiếu rạp bên dưới để nhận giá vé 45.000đ!",
                            badge: "MÃ: CINEMAXHAPPY45",
                            couponCode: "CINEMAXHAPPY45",
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Đặt Vé →
                      </button>
                      <span className="font-heading font-bold text-neutral-400 hover:text-white transition-colors text-[11px]">
                        Chi tiết
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voucher 2: Giảm 50% U22 */}
                <div
                  onClick={() => {
                    setSelectedPromo(PROMO_DATA[1] || PROMO_DATA[0]);
                    setCopiedPromoCode(false);
                  }}
                  className="relative bg-[#161922] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914] hover:shadow-[0_15px_30px_rgba(229,9,20,0.2)] transition-all duration-300 group cursor-pointer overflow-hidden"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-r border-white/10" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-l border-white/10" />

                  <div className="px-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        HỌC SINH - SINH VIÊN
                      </span>
                      <Percent className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="my-3">
                      <span className="font-heading text-4xl sm:text-5xl font-bold text-[#E50914] tracking-tight block">
                        GIẢM 50%
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider mt-1 block">
                        HAPPY U22 & THÀNH VIÊN TRẺ
                      </span>
                    </div>

                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      Ưu đãi giảm nửa giá vé cho học sinh sinh viên trước 17h hàng ngày, nhận thêm voucher bắp nước.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-white/20 px-2 flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-[11px] text-[#9CA3AF] bg-white/5 px-2 py-1 rounded border border-white/10">
                      MÃ: U22MEMBER50
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerInlineOffer({
                            type: "coupon",
                            title: "Đặc Quyền Học Sinh - Sinh Viên (Giảm 50%)",
                            description: "Mã U22MEMBER50 đã được kích hoạt. Hãy chọn phim bên dưới để hưởng ưu đãi trước 17h!",
                            badge: "MÃ: U22MEMBER50",
                            couponCode: "U22MEMBER50",
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Đặt Vé →
                      </button>
                      <span className="font-heading font-bold text-neutral-400 hover:text-white transition-colors text-[11px]">
                        Chi tiết
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voucher 3: Mua 1 Tặng 1 Đối Tác */}
                <div
                  onClick={() => {
                    setSelectedPromo(PROMO_DATA[2] || PROMO_DATA[0]);
                    setCopiedPromoCode(false);
                  }}
                  className="relative bg-[#161922] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914] hover:shadow-[0_15px_30px_rgba(229,9,20,0.2)] transition-all duration-300 group cursor-pointer overflow-hidden"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-r border-white/10" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0C10] border-l border-white/10" />

                  <div className="px-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider bg-[#F5C518]/20 text-[#F5C518] border border-[#F5C518]/30">
                        ĐỐI TÁC NGÂN HÀNG
                      </span>
                      <Gift className="w-4 h-4 text-[#F5C518]" />
                    </div>

                    <div className="my-3">
                      <span className="font-heading text-4xl sm:text-5xl font-bold text-[#F5C518] tracking-tight block">
                        MUA 1 TẶNG 1
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider mt-1 block">
                        VIETCOMBANK & TECHCOMBANK & VPBANK
                      </span>
                    </div>

                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      Mua 1 vé tặng 1 vé vào mỗi cuối tuần khi thanh toán bằng thẻ đối tác hoặc ví điện tử.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-white/20 px-2 flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-[11px] text-[#9CA3AF] bg-white/5 px-2 py-1 rounded border border-white/10">
                      MÃ: BANKPARTNER11
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerInlineOffer({
                            type: "coupon",
                            title: "Đối Tác Ngân Hàng - Mua 1 Tặng 1",
                            description: "Mã BANKPARTNER11 đã được kích hoạt. Hãy chọn phim bên dưới để đặt 2 vé tính tiền 1!",
                            badge: "MÃ: BANKPARTNER11",
                            couponCode: "BANKPARTNER11",
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Đặt Vé →
                      </button>
                      <span className="font-heading font-bold text-neutral-400 hover:text-white transition-colors text-[11px]">
                        Chi tiết
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. CINEMAX SPECIAL CINEMA - BỐ CỤC BENTO GRID & HÌNH ẢNH THỰC TẾ KHÔNG GIAN PHÒNG CHIẾU */}
            <section id="special-cinema-section" className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-12 scroll-mt-24">
              {/* Tiêu đề Section chuẩn Điện Ảnh: Căn trái, thanh dọc đỏ */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-white/10 pb-4">
                <div className="border-l-4 border-[#E50914] pl-4">
                  <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider block mb-1">
                    Trải Nghiệm Đẳng Cấp Thượng Hạng
                  </span>
                  <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase text-white tracking-tight">
                    CINEMAX SPECIAL CINEMA
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1 max-w-xl">
                    Khám phá không gian phòng chiếu hiện đại bậc nhất với màn hình khổng lồ, ghế sofa da ngả 180° và dịch vụ phục vụ 5 sao.
                  </p>
                </div>
              </div>

              {/* BỐ CỤC BENTO GRID 2 HÀNG VỚI HÌNH ẢNH PHÒNG CHIẾU CHÂN THỰC */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                
                {/* BENTO 1 (LỚN): IMAX LASER 4K - Hero Box chiếm 2 cột */}
                <div
                  onClick={() => {
                    const el = document.getElementById("matrix-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative lg:col-span-2 h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-2xl transition-all duration-500 hover:border-[#E50914] hover:shadow-[0_20px_45px_rgba(229,9,20,0.3)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80"
                    alt="Phòng chiếu IMAX Laser CineMax"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 z-10 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold bg-[#E50914] text-white uppercase tracking-wider">
                        CÔNG NGHỆ ĐỈNH CAO
                      </span>
                      <span className="text-xs font-bold text-[#F5C518]">IMAX Laser 4K Dual</span>
                    </div>

                    <h3 className="font-heading text-2xl sm:text-4xl font-bold text-white uppercase tracking-tight group-hover:text-[#F5C518] transition-colors">
                      IMAX LASER 4K
                    </h3>

                    <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-lg mt-1 line-clamp-2 leading-relaxed">
                      Màn hình cong 7 tầng nhà cực đại cùng hệ thống máy chiếu Laser đôi 4K và dàn âm thanh kỹ thuật số 12 kênh rung chuyển toàn khán phòng.
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#E50914] group-hover:translate-x-1 transition-transform">
                      <span>Xem lịch chiếu IMAX Laser</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* BENTO 2: LUXE LOUNGE - Sofa VIP ngả 180° */}
                <div
                  onClick={() => {
                    const el = document.getElementById("matrix-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-2xl transition-all duration-500 hover:border-[#F5C518] hover:shadow-[0_20px_45px_rgba(245,197,24,0.25)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
                    alt="Phòng chiếu CineMax Luxe Lounge"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex flex-col justify-end">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold bg-[#F5C518] text-neutral-900 uppercase tracking-wider self-start mb-2">
                      THƯỢNG HẠNG VIP
                    </span>
                    <h3 className="font-heading text-2xl font-bold text-white uppercase tracking-tight group-hover:text-[#F5C518] transition-colors">
                      LUXE LOUNGE
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                      Ghế sofa da ngả 180° chỉnh điện, phục vụ Welcome Drink & Snack cao cấp tại phòng chờ riêng biệt.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#F5C518] group-hover:translate-x-1 transition-transform">
                      <span>Khám phá Luxe Lounge</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* BENTO 3: 4DX MOTION EXPERIENCE */}
                <div
                  onClick={() => {
                    const el = document.getElementById("matrix-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative h-64 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-xl transition-all duration-500 hover:border-[#E50914]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&auto=format&fit=crop&q=80"
                    alt="Phòng chiếu 4DX Motion CineMax"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-heading font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 uppercase tracking-wider self-start mb-1.5">
                      ĐA GIÁC QUAN
                    </span>
                    <h3 className="font-heading text-xl font-bold text-white uppercase tracking-tight group-hover:text-[#E50914] transition-colors">
                      4DX MOTION
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                      Ghế chuyển động đa chiều kết hợp hiệu ứng gió, mưa, mùi hương và tuyết rơi chân thực.
                    </p>
                  </div>
                </div>

                {/* BENTO 4: VELVET SUITE - Giường Nằm */}
                <div
                  onClick={() => {
                    const el = document.getElementById("matrix-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative h-64 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-xl transition-all duration-500 hover:border-[#E50914]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80"
                    alt="Phòng chiếu Velvet Suite Giường Nằm"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-heading font-bold bg-white/10 text-white uppercase tracking-wider self-start mb-1.5 border border-white/10">
                      GIƯỜNG NHUNG HOÀNG GIA
                    </span>
                    <h3 className="font-heading text-xl font-bold text-white uppercase tracking-tight group-hover:text-[#F5C518] transition-colors">
                      VELVET SUITE
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                      Phòng chiếu giường nhung êm ái, gối nỉ cao cấp và chăn ấm mang lại sự thoải mái tuyệt đối.
                    </p>
                  </div>
                </div>

                {/* BENTO 5: SWEETBOX - Ghế Đôi Riêng Tư */}
                <div
                  onClick={() => {
                    const el = document.getElementById("matrix-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative h-64 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-xl transition-all duration-500 hover:border-[#E50914]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80"
                    alt="Ghế Đôi Sweetbox CineMax"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-heading font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 uppercase tracking-wider self-start mb-1.5">
                      LÃNG MẠN 2 NGƯỜI
                    </span>
                    <h3 className="font-heading text-xl font-bold text-white uppercase tracking-tight group-hover:text-[#E50914] transition-colors">
                      SWEETBOX
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                      Vách ngăn cao bọc nỉ tạo không gian riêng tư hoàn hảo cho các cặp đôi hẹn hò xem phim.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* 5. Khám Phá Phim Theo Tâm Trạng (Mood-Based Discovery) */}
            {/* 5. Gợi Ý Phim Theo Trải Nghiệm Điện Ảnh & Bộ Lọc Nhanh */}
            <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 mt-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#E50914]" />
                  <h3 className="text-sm font-extrabold text-white tracking-wide">
                    Gợi ý phim theo trải nghiệm điện ảnh
                  </h3>
                </div>
                <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-bold">CineMax Selection</span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {MOOD_FILTERS.map((mood) => {
                  const Icon = mood.icon;
                  const isActive = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 border cursor-pointer ${
                        isActive
                          ? "bg-[#E50914] border-[#E50914] text-white shadow-lg shadow-red-600/30 scale-105"
                          : "bg-[#12141C] border-white/10 text-[#9CA3AF] hover:border-[#E50914] hover:text-white"
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
            <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 mt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mr-2 flex-shrink-0">
                  Thể loại:
                </span>
                {GENRE_FILTERS.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 cursor-pointer ${
                      selectedGenre === genre
                        ? "bg-[#E50914] text-white shadow-md font-bold"
                        : "bg-[#12141C] border border-white/10 text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Quyền Lợi Thành Viên & Hỗ Trợ Đặt Vé */}
            <div className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 mt-8">
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#12141C] via-[#161922] to-[#12141C] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E50914] flex items-center justify-center text-white shadow-lg shadow-red-600/30 flex-shrink-0">
                    <Crown className="w-5 h-5 text-[#F5C518]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>Đặc Quyền Hội Viên CineMax VIP Club</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                        CineMax Passport
                      </span>
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Cập nhật lịch chiếu sớm, tích điểm thành viên đổi vé miễn phí và nhận tư vấn chọn suất chiếu, ghế đẹp chuẩn xác.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="w-10 h-10 rounded-lg bg-[#E50914] text-white shadow-lg shadow-red-600/30 hover:bg-[#b80710] transition-all flex items-center justify-center flex-shrink-0 transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Hỗ trợ đặt vé 24/7"
                >
                  <Headphones className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 6. Bảng Giá Vé Niêm Yết Rạp Chiếu (Official Price Table) */}
            <section id="price-table" className="max-w-[1040px] 2xl:max-w-[1080px] mx-auto px-2 sm:px-4 py-12 scroll-mt-24 border-t border-white/10">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs text-[#E50914] font-bold uppercase tracking-wider block">Bảng Giá Niêm Yết Toàn Hệ Thống</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                    <span>BẢNG GIÁ VÉ & PHỤ THU RẠP CHIẾU CINEMAX</span>
                    <Ticket className="w-6 h-6 text-[#E50914]" />
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
                    Giá vé minh bạch, đồng nhất cho mọi phòng chiếu tiêu chuẩn 2D. Đặt vé trực tuyến nhanh chóng, thanh toán VietQR tức thì và nhận vé QR điện tử vào thẳng phòng chiếu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Miễn phí đổi suất chiếu trước 60p
                  </span>
                </div>
              </div>

              {/* 4 Pricing Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Card 1: Ghế Tiêu Chuẩn */}
                <div className="bg-[#12141C] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914]/40 hover:shadow-xl transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-white/10 text-white uppercase tracking-wider border border-white/10">
                        Hàng A - D
                      </span>
                      <Armchair className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#E50914] transition-colors" />
                    </div>
                    <h4 className="text-lg font-black text-white">Ghế Tiêu Chuẩn</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1">Standard Seat • Dãy đầu & giữa</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">55.000</span>
                        <span className="text-sm font-bold text-[#9CA3AF]">đ/vé</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium mt-1">
                        HSSV / Trẻ em: chỉ từ 45.000đ (trước 17h)
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#9CA3AF]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Khoảng cách màn hình tiêu chuẩn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Ghế nỉ cao cấp đệm êm ái</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Âm thanh Dolby 7.1 trung thực</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      handleTriggerInlineOffer({
                        type: "seat_type",
                        title: "Đặt Vé Ghế Tiêu Chuẩn 55k",
                        description: "Chọn bộ phim bạn muốn xem với trải nghiệm ghế nỉ êm ái và âm thanh Dolby 7.1 sống động:",
                        badge: "GHẾ TIÊU CHUẨN 55K",
                      });
                    }}
                    className="w-full mt-5 py-2.5 rounded-lg bg-white/10 hover:bg-[#E50914] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 hover:border-[#E50914]"
                  >
                    <span>Chọn Suất Chiếu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 2: Ghế VIP (Sweet Spot) */}
                <div className="bg-[#12141C] rounded-xl border-2 border-[#E50914] p-5 flex flex-col justify-between shadow-xl shadow-red-900/20 relative group">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-md shadow-md">
                    Được Chọn Nhiều Nhất
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-[#E50914]/20 text-[#E50914] uppercase tracking-wider border border-[#E50914]/40">
                        Hàng E - H
                      </span>
                      <Star className="w-5 h-5 fill-[#F5C518] text-[#F5C518]" />
                    </div>
                    <h4 className="text-lg font-black text-white">Ghế VIP Sweet Spot</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1">VIP Seat • Tầm nhìn trung tâm rạp</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#E50914]">75.000</span>
                        <span className="text-sm font-bold text-[#9CA3AF]">đ/vé</span>
                      </div>
                      <p className="text-[11px] text-[#E50914] font-medium mt-1">
                        Phụ thu +20k so với ghế thường
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#9CA3AF]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span className="font-semibold text-white">Tầm nhìn 100% diện tích màn chiếu</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Khoảng để chân rộng rãi thoải mái</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Trục âm thanh vòm hoàn hảo nhất</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      handleTriggerInlineOffer({
                        type: "seat_type",
                        title: "Đặt Vé Ghế VIP Sweet Spot 75k",
                        description: "Chọn bộ phim bạn muốn xem để tận hưởng tầm nhìn trục tâm 100% diện tích màn chiếu hoàn hảo nhất:",
                        badge: "GHẾ VIP SWEET SPOT",
                      });
                    }}
                    className="w-full mt-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
                  >
                    <span>Đặt Vé Ghế VIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 3: Ghế Đôi Sweetbox */}
                <div className="bg-[#12141C] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914]/40 hover:shadow-xl transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-pink-500/20 text-pink-400 uppercase tracking-wider border border-pink-500/40">
                        Hàng K (Ghế Đôi)
                      </span>
                      <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                    <h4 className="text-lg font-black text-white">Sweetbox Ghế Đôi</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1">Couple Sweetbox • Trọn gói 2 người</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">130.000</span>
                        <span className="text-sm font-bold text-[#9CA3AF]">đ/cặp</span>
                      </div>
                      <p className="text-[11px] text-pink-400 font-medium mt-1">
                        Chỉ 65.000đ/người • Bao gồm 2 vé
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#9CA3AF]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span className="font-semibold text-white">Vách ngăn riêng tư cao cấp</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Ghế sofa đôi bọc nhung liền khối</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Tặng bắp phô mai suất chiếu sau 20h</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      handleTriggerInlineOffer({
                        type: "seat_type",
                        title: "Đặt Ghế Đôi Sweetbox (Trọn Gói 2 Người - 130k)",
                        description: "Chọn phim để tận hưởng không gian sofa đôi liền khối riêng tư lãng mạn (Bao gồm 2 vé - Không bán lẻ):",
                        badge: "SWEETBOX ĐÔI 130K",
                      });
                    }}
                    className="w-full mt-5 py-2.5 rounded-lg bg-white/10 hover:bg-[#E50914] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 hover:border-[#E50914]"
                  >
                    <span>Đặt Ghế Đôi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 4: Combo Bắp Nước Concession */}
                <div className="bg-[#12141C] rounded-xl border border-white/10 p-5 flex flex-col justify-between hover:border-[#E50914]/40 hover:shadow-xl transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-500/20 text-[#F5C518] uppercase tracking-wider border border-amber-500/40">
                        Bắp & Nước Uống
                      </span>
                      <Popcorn className="w-5 h-5 text-[#F5C518]" />
                    </div>
                    <h4 className="text-lg font-black text-white">Combo Bắp Nước Rạp</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1">Concession • Solo & Couple & Party</p>

                    <div className="mt-4 mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-[#9CA3AF]">Từ</span>
                        <span className="text-3xl font-black text-white">59.000</span>
                        <span className="text-sm font-bold text-[#9CA3AF]">đ</span>
                      </div>
                      <p className="text-[11px] text-[#F5C518] font-medium mt-1">
                        Tiết kiệm tới 30% so với mua trực tiếp
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#9CA3AF]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Bắp rang bơ phô mai / caramel giòn rụm</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Nước ngọt tươi có ga hoặc trà hoa quả</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                        <span>Tùy biến vị bắp và cỡ ly khi đặt vé</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="#promo-section"
                    className="w-full mt-5 py-2.5 rounded-lg bg-white/10 hover:bg-[#E50914] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center border border-white/10 hover:border-[#E50914]"
                  >
                    <span>Xem Menu Combo 68k</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-[#12141C] rounded-xl border border-white/10 overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 bg-[#161922] border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#E50914]" />
                    Bảng Chi Tiết Giá Vé Theo Khung Giờ & Đối Tượng
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">
                    Đơn vị tính: VNĐ / vé
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#161922]/80 text-[#9CA3AF] font-bold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Loại Vé & Đối Tượng</th>
                        <th className="py-3 px-4 text-center">Thứ 2 - Thứ 6 (Trước 17:00)</th>
                        <th className="py-3 px-4 text-center">Thứ 2 - Thứ 6 (Sau 17:00)</th>
                        <th className="py-3 px-4 text-center">Thứ 7, CN & Ngày Lễ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[#9CA3AF]">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          Học Sinh - Sinh Viên / Trẻ Em (U22)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">45.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">50.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-white">55.000đ</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          Ghế Thường (Hàng A - D)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white">55.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-white">60.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-white">65.000đ</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors bg-[#E50914]/10">
                        <td className="py-3 px-4 font-semibold text-white flex items-center gap-1.5">
                          <span>Ghế VIP Sweet Spot (Hàng E - H)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E50914] text-white font-bold">Hot</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#E50914]">75.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-[#E50914]">80.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-[#E50914]">85.000đ</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          Ghế Đôi Sweetbox (Hàng K - 2 vé)
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-pink-400">130.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-pink-400">140.000đ</td>
                        <td className="py-3 px-4 text-center font-bold text-pink-400">150.000đ</td>
                      </tr>
                    </tbody>
                  </table>
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
          handleRequestBooking(m);
        }}
      />

      {/* Modal Đặt Vé Duy Nhất: Wizard Bước 0 (Chọn Phim) -> Suất Chiếu -> Ghế -> Bắp Nước -> Thanh Toán */}
      <BookingModal
        movie={activeBookingMovie}
        initialSeats={bookingInitialSeats}
        initialShowtimeId={bookingInitialShowtimeId}
        initialCouponCode={bookingInitialCouponCode}
        initialComboId={bookingInitialComboId}
        isHalloween={isCustomerHalloween}
        onClose={() => {
          setActiveBookingMovie(null);
          setBookingInitialSeats([]);
          setBookingInitialShowtimeId(undefined);
          setBookingInitialCouponCode(undefined);
          setBookingInitialComboId(undefined);
          useBookingStore.getState().resetBooking();
        }}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Modal Đăng Nhập Thành Viên CineMax Khi Khách Vào Đặt Vé */}
      <CustomerLoginModal
        isOpen={isCustomerLoginOpen}
        onClose={() => {
          setIsCustomerLoginOpen(false);
          setPendingBookingMovie(null);
        }}
        onLoginSuccess={handleCustomerLoginSuccess}
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
          handleRequestBooking(movie, seats || [], showtimeId);
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
          handleRequestBooking(movie);
        }}
        onSelectMovie={(movie) => {
          setActiveDetailMovie(movie);
        }}
      />

      {/* Modal Chi Tiết Khuyến Mãi & Thể Lệ Ưu Đãi (Dark Mode Cinematic) */}
      {selectedPromo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPromo(null)}
        >
          <div
            className="bg-[#161922] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedPromo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-heading font-bold ${selectedPromo.badgeBg} ${selectedPromo.badgeText} uppercase tracking-wider border ${selectedPromo.badgeBorder}`}>
                {selectedPromo.badge}
              </span>
              <span className="text-xs text-[#9CA3AF] font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                {selectedPromo.validity}
              </span>
            </div>

            <h3 className="font-heading text-xl sm:text-2xl font-bold text-white uppercase leading-snug">
              {selectedPromo.title}
            </h3>

            {/* Promo discount banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#12141C] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#9CA3AF] font-medium block">Mức ưu đãi:</span>
                <span className="font-heading text-base sm:text-lg font-bold text-[#F5C518]">{selectedPromo.discountHighlight}</span>
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {copiedPromoCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Mã: {selectedPromo.promoCode}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Điều kiện áp dụng */}
            <div className="mt-5 space-y-2.5">
              <h5 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                Điều Kiện & Thể Lệ Áp Dụng
              </h5>
              <ul className="space-y-2 text-xs text-[#9CA3AF]">
                {selectedPromo.conditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#E50914] flex-shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ghi chú */}
            <div className="mt-4 p-2.5 rounded-lg bg-[#12141C] border border-white/10 text-[11px] text-[#9CA3AF] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#F5C518] flex-shrink-0 mt-0.5" />
              <span>{selectedPromo.applicableNote}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedPromo(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-[#9CA3AF] hover:text-white hover:bg-white/5 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const currentPromo = selectedPromo;
                  setSelectedPromo(null);
                  if (currentPromo?.promoCode) {
                    handleTriggerInlineOffer({
                      type: "coupon",
                      title: `Ưu Đãi: ${currentPromo.title}`,
                      description: `Mã ${currentPromo.promoCode} đã được kích hoạt. Hãy chọn phim bên dưới để áp dụng ưu đãi!`,
                      badge: `MÃ: ${currentPromo.promoCode}`,
                      couponCode: currentPromo.promoCode,
                    });
                  } else {
                    const el = document.getElementById("commercial-tabs");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }
                }}
                className="px-5 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer border border-red-500/40"
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
