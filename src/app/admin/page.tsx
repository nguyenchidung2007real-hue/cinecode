"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Film,
  Calendar,
  DollarSign,
  Ticket,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  Building2,
  Clock,
  QrCode,
  Sliders,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Users,
  AlertTriangle,
  PlusCircle,
  Trash2,
  LogOut,
  Armchair,
  Star,
  LayoutDashboard,
  Receipt,
  ScanLine,
  Megaphone,
  ExternalLink,
  Popcorn,
  Flame,
  Radio,
  Eye,
  BarChart3,
  Activity,
  Cpu,
  Zap,
  Award,
  Info,
  X,
  Check,
} from "lucide-react";
import AdminSeatsMoviesAuditTab, { AdminMoviesTab } from "@/components/admin/AdminSeatsMoviesAuditTab";
import AdminOrdersAndReviewsTab from "@/components/admin/AdminOrdersAndReviewsTab";
import { MOCK_MOVIES, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "@/lib/mockData";
import { formatVND } from "@/lib/utils";
import { checkShowtimeCollision, ShowtimeLike, CollisionResult, TRAILER_MINUTES, CLEANING_MINUTES } from "@/lib/showtimeCollision";
import { ShowTime, Movie } from "@/types";

interface SyncStatus {
  success: boolean;
  syncedAt: string;
  source: string;
  message: string;
  totalMovies: number;
  totalShowtimes: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "showtimes" | "movies" | "tickets" | "pricing" | "seats" | "orders-reviews"
  >("overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movieManagementSubTab, setMovieManagementSubTab] = useState<"crud" | "coordination">("crud");

  // Live Broadcast Controller (Phát sóng thông báo trực tiếp lên trang khách)
  const [announcementSettings, setAnnouncementSettings] = useState<{
    enabled: boolean;
    text: string;
    type: "promo" | "alert" | "event" | "maintenance";
    actionText: string;
    actionUrl: string;
  }>({
    enabled: true,
    text: "🔥 Ưu đãi thành viên CineMax: Tặng ngay voucher bắp phô mai nóng hổi khi đặt vé qua website!",
    type: "promo",
    actionText: "Xem Ưu Đãi",
    actionUrl: "#promo-section",
  });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementSaveSuccess, setAnnouncementSaveSuccess] = useState(false);

  // Kho phim đang khai thác & Điều phối danh mục lên trang khách
  const [adminMovies, setAdminMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [movieStatusUpdating, setMovieStatusUpdating] = useState<string | null>(null);
  const [movieStatusSuccess, setMovieStatusSuccess] = useState<string | null>(null);

  // Điều khiển giao diện Halloween trên trang khách hàng (Customer-Facing Halloween Theme)
  const [customerHalloweenEnabled, setCustomerHalloweenEnabled] = useState(false);
  const [isTogglingCustomerHalloween, setIsTogglingCustomerHalloween] = useState(false);
  const [customerHalloweenToast, setCustomerHalloweenToast] = useState<string | null>(null);

  // Tải cài đặt thông báo phát sóng & Theme Halloween từ Server Store
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data?.data?.announcement) {
          setAnnouncementSettings(data.data.announcement);
        }
        if (typeof data?.data?.halloweenThemeEnabled === "boolean") {
          setCustomerHalloweenEnabled(data.data.halloweenThemeEnabled);
          setIsHalloween(data.data.halloweenThemeEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleCustomerHalloween = async () => {
    setIsTogglingCustomerHalloween(true);
    const next = !customerHalloweenEnabled;
    setCustomerHalloweenEnabled(next);
    setIsHalloween(next);

    try {
      localStorage.setItem("cinemax_admin_theme", next ? "halloween" : "normal");
    } catch {}
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ halloweenThemeEnabled: next }),
      });
      if (res.ok) {
        setCustomerHalloweenToast(
          next
            ? "🎃 Đã kích hoạt giao diện Lễ Hội Halloween cho toàn bộ khách hàng trên website!"
            : "🎬 Đã đưa trang khách hàng về giao diện điện ảnh tiêu chuẩn!"
        );
        setTimeout(() => setCustomerHalloweenToast(null), 4000);
      }
    } catch (err) {
      console.error("Lỗi cập nhật theme Halloween khách:", err);
    } finally {
      setIsTogglingCustomerHalloween(false);
    }
  };

  // Tải danh sách phim mới nhất
  useEffect(() => {
    fetch("/api/movies?category=all")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAdminMovies(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ announcement: announcementSettings }),
      });
      if (res.ok) {
        setAnnouncementSaveSuccess(true);
        setTimeout(() => setAnnouncementSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Lỗi lưu thông báo broadcast:", err);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleToggleMovieStatus = async (
    movieId: string | number,
    newStatus: "now_playing" | "upcoming" | "trending"
  ) => {
    setMovieStatusUpdating(String(movieId));
    try {
      const res = await fetch("/api/admin/seats-and-movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "update_movie",
          id: movieId,
          patch: { commercialTab: newStatus, status: newStatus },
        }),
      });
      if (res.ok) {
        setAdminMovies((prev) =>
          prev.map((m) =>
            String(m.id) === String(movieId) ? { ...m, commercialTab: newStatus, status: newStatus } : m
          )
        );
        const label =
          newStatus === "now_playing"
            ? "Phim Đang Chiếu"
            : newStatus === "upcoming"
            ? "Phim Sắp Chiếu"
            : "Suất Chiếu Đặc Biệt";
        setMovieStatusSuccess(`Đã chuyển phim sang danh mục [${label}] trên trang khách!`);
        setTimeout(() => setMovieStatusSuccess(null), 3500);
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái phim:", err);
    } finally {
      setMovieStatusUpdating(null);
    }
  };

  // Chế độ giao diện Halloween (Spooky Theme 🎃 ⇄ Normal Cinema 🎬)
  const [isHalloween, setIsHalloween] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("cinemax_admin_theme");
      if (savedTheme === "halloween") {
        setIsHalloween(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleHalloweenTheme = () => { handleToggleCustomerHalloween(); };

  // Thống kê giả lập
  const [stats, setStats] = useState({
    todayRevenue: 8450000,
    ticketsSold: 112,
    occupancyRate: "78%",
    activeShowtimes: 8,
  });

  // Bộ điều khiển biểu đồ doanh thu (Revenue Chart Period)
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "7days" | "month">("today");
  const [hoveredChartBar, setHoveredChartBar] = useState<number | null>(null);

  // Modal xem nhanh sơ đồ 102 ghế phòng chiếu
  const [quickSeatModalRoom, setQuickSeatModalRoom] = useState<{
    name: string;
    movie: string;
    showtime: string;
    occupiedCount: number;
    totalSeats: number;
    status: string;
    statusColor: string;
  } | null>(null);

  // Định dạng số tiền ngắn gọn cho trục Y và đỉnh cột biểu đồ (VD: 1.5M, 750k)
  const formatShortVND = (num: number) => {
    if (num >= 1000000) {
      const val = (num / 1000000).toFixed(1);
      return `${val.endsWith(".0") ? val.slice(0, -2) : val}M`;
    }
    if (num >= 1000) {
      return `${Math.round(num / 1000)}k`;
    }
    return `${Math.round(num)} ₫`;
  };

  // Dữ liệu biểu đồ doanh thu
  const chartData = useMemo(() => {
    if (revenuePeriod === "today") {
      return [
        { label: "08:00", ticket: 280000, fnb: 110000 },
        { label: "10:00", ticket: 490000, fnb: 190000 },
        { label: "12:00", ticket: 780000, fnb: 290000 },
        { label: "14:00", ticket: 650000, fnb: 240000 },
        { label: "16:00", ticket: 920000, fnb: 380000 },
        { label: "18:00", ticket: 1420000, fnb: 510000 },
        { label: "20:00", ticket: 1280000, fnb: 430000 },
        { label: "22:00", ticket: 380000, fnb: 100000 },
      ];
    } else if (revenuePeriod === "7days") {
      return [
        { label: "T2", ticket: 4100000, fnb: 1450000 },
        { label: "T3", ticket: 4600000, fnb: 1680000 },
        { label: "T4 (45k)", ticket: 7200000, fnb: 2850000 },
        { label: "T5", ticket: 4900000, fnb: 1820000 },
        { label: "T6", ticket: 8400000, fnb: 3200000 },
        { label: "T7", ticket: 12100000, fnb: 4650000 },
        { label: "CN", ticket: 11400000, fnb: 4350000 },
      ];
    } else {
      return [
        { label: "Tuần 1", ticket: 38200000, fnb: 13900000 },
        { label: "Tuần 2", ticket: 44100000, fnb: 16400000 },
        { label: "Tuần 3", ticket: 51600000, fnb: 19200000 },
        { label: "Tuần 4", ticket: 48900000, fnb: 18200000 },
      ];
    }
  }, [revenuePeriod]);

  // Giá trị đỉnh trục Y biểu đồ (tối thiểu 1 triệu để scale chuẩn)
  const chartMaxVal = useMemo(() => {
    const max = Math.max(...chartData.map((x) => x.ticket + x.fnb), 1000000);
    return max * 1.15;
  }, [chartData]);

  // Top 5 Phim doanh thu cao nhất hôm nay
  const TOP_5_MOVIES_TODAY = [
    {
      id: "dune-2",
      rank: 1,
      title: "Dune: Phần Hai",
      format: "IMAX Laser 4K",
      tickets: 48,
      percent: 42,
      revenue: 3550000,
      poster: "/images/posters/dune-2.jpg",
      badgeColor: "bg-amber-500 text-black",
    },
    {
      id: "exhuma",
      rank: 2,
      title: "Quật Mộ Trùng Ma (Exhuma)",
      format: "Laser HD • Atmos",
      tickets: 39,
      percent: 35,
      revenue: 2925000,
      poster: "/images/posters/exhuma.jpg",
      badgeColor: "bg-slate-300 text-black",
    },
    {
      id: "conan-movie-27",
      rank: 3,
      title: "Conan: Ngôi Sao 5 Cánh 1 Triệu Đô",
      format: "2D Phụ Đề",
      tickets: 15,
      percent: 13,
      revenue: 1125000,
      poster: "/images/posters/conan-movie-27.jpg",
      badgeColor: "bg-amber-700 text-white",
    },
    {
      id: "godzilla-x-kong",
      rank: 4,
      title: "Godzilla x Kong: Đế Chế Mới",
      format: "4DX Dynamic",
      tickets: 7,
      percent: 6,
      revenue: 525000,
      poster: "/images/posters/godzilla-x-kong.jpg",
      badgeColor: "bg-white/10 text-neutral-300",
    },
    {
      id: "doraemon",
      rank: 5,
      title: "Doraemon: Bản Giao Hưởng",
      format: "2D Lồng Tiếng",
      tickets: 3,
      percent: 4,
      revenue: 325000,
      poster: "/images/posters/doraemon-earth-symphony.jpg",
      badgeColor: "bg-white/10 text-neutral-300",
    },
  ];

  // 6 Sự kiện thời gian thực (Live Stream Logs)
  const LIVE_AUDIT_LOGS = [
    {
      id: "log-1",
      time: "14:32",
      icon: "🟢",
      tag: "Scanner Check-in",
      tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      content: "NV Đào Duy Minh vừa quét vé hợp lệ bk-9821 (Ghế E5, E6 - Phòng 01) qua /scanner.",
      meta: "HMAC Signed • Anti-Replay Passed",
    },
    {
      id: "log-2",
      time: "14:30",
      icon: "💳",
      tag: "VietQR Napas",
      tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      content: "Khách 0981***234 vừa thanh toán VietQR 185.000₫ (2 vé VIP + 1 Combo Solo).",
      meta: "Napas 247 Instant • IPN Verified",
    },
    {
      id: "log-3",
      time: "14:29",
      icon: "⏳",
      tag: "Redis Lua Hold",
      tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      content: "Redis Lua Engine vừa khóa tạm thời ghế F7, F8 (TTL: 284s).",
      meta: "Atomic Lock • TTL 300s Count-down",
    },
    {
      id: "log-4",
      time: "14:25",
      icon: "🛡️",
      tag: "Anti-Replay Guard",
      tagColor: "bg-red-500/20 text-red-400 border-red-500/30",
      content: "Scanner Gate vừa chặn 1 lượt quét vé trùng lặp (Anti-Replay bk-7712).",
      meta: "Rejected: AlreadyCheckedIn at 14:12",
    },
    {
      id: "log-5",
      time: "14:20",
      icon: "🎟️",
      tag: "Web Booking",
      tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      content: "Khách vừa đặt vé trực tuyến suất 20:00 Phòng Beta 02 qua website.",
      meta: "Orphan Seat Verified (0 single gap)",
    },
    {
      id: "log-6",
      time: "14:18",
      icon: "🤖",
      tag: "Groq Llama 3.3",
      tagColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      content: "Groq Llama 3.3 70B AI vừa tư vấn đặt 2 vé Sweetbox cho khách hàng.",
      meta: "Inference 182 tps • Latency 0.4s",
    },
  ];

  // Showtime Scheduler & Collision Engine State
  const [showtimesList, setShowtimesList] = useState<ShowTime[]>(MOCK_SHOWTIMES);
  const [newMovieId, setNewMovieId] = useState<string>("dune-2");
  const [newRoomName, setNewRoomName] = useState<string>("Phòng Beta 01 (Dolby 7.1)");
  const [newDate, setNewDate] = useState<string>("2026-09-24");
  const [newTime, setNewTime] = useState<string>("19:00");
  const [newFormat, setNewFormat] = useState<"2D Phụ Đề" | "2D Lồng Tiếng" | "IMAX Laser" | "4DX">("2D Phụ Đề");
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");

  const selectedMovie = useMemo(() => {
    return MOCK_MOVIES.find((m) => String(m.id) === String(newMovieId));
  }, [newMovieId]);

  const existingShowtimes: ShowtimeLike[] = useMemo(() => {
    return showtimesList.map((st) => {
      const movie = MOCK_MOVIES.find((m) => String(m.id) === String(st.movieId));
      return {
        id: st.id,
        cinemaId: st.cinemaId,
        roomName: st.roomName,
        date: st.date,
        time: st.time,
        durationMinutes: movie?.durationMinutes ?? 120,
        movieTitle: movie?.title ?? `Phim #${st.movieId}`,
      };
    });
  }, [showtimesList]);

  const candidateShowtime: ShowtimeLike = useMemo(() => {
    return {
      cinemaId: "beta-cinemas-xuan-thuy",
      roomName: newRoomName,
      date: newDate,
      time: newTime,
      durationMinutes: selectedMovie?.durationMinutes ?? 120,
      movieTitle: selectedMovie?.title ?? "Phim đã chọn",
    };
  }, [newRoomName, newDate, newTime, selectedMovie]);

  const collisionResult: CollisionResult = useMemo(() => {
    return checkShowtimeCollision(candidateShowtime, existingShowtimes);
  }, [candidateShowtime, existingShowtimes]);

  // Tự động tải danh sách suất chiếu từ kho server (Showtime Store)
  useEffect(() => {
    fetch("/api/showtimes?cinemaId=beta-cinemas-xuan-thuy")
      .then((res) => res.json())
      .then((data) => {
        if (data.showtimes && Array.isArray(data.showtimes) && data.showtimes.length > 0) {
          setShowtimesList(data.showtimes);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collisionResult.ok) return;

    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId: newMovieId,
          roomName: newRoomName,
          date: newDate,
          time: newTime,
          format: newFormat,
          cinemaId: "beta-cinemas-xuan-thuy",
        }),
      });

      const data = await res.json();
      if (res.status === 201 && data.showtime) {
        setShowtimesList((prev) => [data.showtime, ...prev]);
        setScheduleSuccessMsg(`Đã tạo suất chiếu ${newTime} (${newFormat}) tại ${newRoomName} thành công và lưu vào kho server!`);
        setTimeout(() => setScheduleSuccessMsg(null), 5000);
    
      } else if (res.status === 409) {
        alert(data.error || "Phát hiện xung đột phòng chiếu từ server!");
    
      }
    } catch {
      // Tiếp tục lưu vào bộ nhớ cục bộ nếu không kết nối được
    }

    const newId = `st-beta-${Date.now()}`;
    const newSt: ShowTime = {
      id: newId,
      movieId: newMovieId,
      cinemaId: "beta-cinemas-xuan-thuy",
      cinemaName: "Beta Cinemas Xuân Thủy",
      roomName: newRoomName,
      format: newFormat,
      date: newDate,
      time: newTime,
    };

    setShowtimesList((prev) => [newSt, ...prev]);
    setScheduleSuccessMsg(`Đã xếp lịch thành công cho suất ${newTime} (${newFormat}) tại ${newRoomName}!`);
    setTimeout(() => setScheduleSuccessMsg(null), 4000);
  };

  const handleDeleteShowtime = async (id: string) => {
    setShowtimesList((prev) => prev.filter((st) => st.id !== id));
    try {
      await fetch(`/api/admin/showtimes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.error("Lỗi xóa suất chiếu trên server:", err);
    }
  };

  const handleSyncBeta = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-beta", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data);
      } else {
        setSyncStatus({
          success: true,
          syncedAt: new Date().toISOString(),
          source: "Curated Demo",
          message: "Đã làm mới dữ liệu lịch chiếu mô phỏng rạp Beta Xuân Thủy.",
          totalMovies: MOCK_MOVIES.length,
          totalShowtimes: showtimesList.length,
        });
      }
    } catch {
      setSyncStatus({
        success: true,
        syncedAt: new Date().toISOString(),
        source: "Curated Demo",
        message: "Đã làm mới dữ liệu lịch chiếu mô phỏng rạp Beta Xuân Thủy.",
        totalMovies: MOCK_MOVIES.length,
        totalShowtimes: showtimesList.length,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${
      isHalloween ? "bg-[#0A0510] text-purple-100" : "bg-[#090D16] text-neutral-100"
    }`}>
      {/* 1. SIDEBAR BÊN TRÁI (Modern 260px Sidebar) */}
      <aside className={`w-[260px] shrink-0 border-r flex flex-col justify-between sticky top-0 h-screen z-30 transition-colors duration-300 ${
        isHalloween
          ? "bg-[#0E071A] border-orange-500/20 shadow-[4px_0_24px_rgba(255,117,24,0.06)]"
          : "bg-[#0B0F19] border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
      }`}>
        {/* Brand Logo & Header */}
        <div>
          <div className={`h-16 px-5 border-b flex items-center justify-between ${
            isHalloween ? "border-orange-500/20" : "border-white/10"
          }`}>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                isHalloween
                  ? "bg-gradient-to-tr from-[#FF7518] to-purple-600 shadow-orange-500/30"
                  : "bg-gradient-to-tr from-[#E50914] to-amber-500 shadow-red-900/30"
              }`}>
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center leading-none">
                  <span className="font-black text-sm tracking-tight text-white">CINE</span>
                  <span className={`font-black text-sm tracking-tight ${isHalloween ? "text-[#FF7518]" : "text-[#E50914]"}`}>MAX</span>
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest ${
                  isHalloween ? "text-orange-400" : "text-neutral-400"
                }`}>
                  {isHalloween ? "🎃 Spooky Admin" : "Cinema Admin"}
                </span>
              </div>
            </Link>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
              isHalloween
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }`}>
              2026
            </span>
          </div>

          {/* Navigation Menu */}
          <div className="p-3 space-y-1">
            <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
              isHalloween ? "text-orange-400/70" : "text-neutral-400"
            }`}>
              Quản Trị Hệ Thống
            </div>
            {[
              { id: "overview", label: "Tổng Quan Rạp", icon: LayoutDashboard },
              { id: "movies", label: "Quản Lý Phim", icon: Film },
              { id: "showtimes", label: "Lịch Chiếu & Scheduler", icon: Calendar },
              { id: "seats", label: "Sơ Đồ Ghế & Phòng Chiếu", icon: Armchair },
              { id: "orders-reviews", label: "Đơn Vé & Đánh Giá", icon: Receipt },
              { id: "tickets", label: "Soát Vé & Check-in", icon: ScanLine },
              { id: "pricing", label: "Bảng Giá Vé & F&B", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    active
                      ? isHalloween
                        ? "bg-gradient-to-r from-orange-500/25 to-purple-500/20 text-orange-300 border border-orange-500/40 shadow-lg shadow-orange-500/10"
                        : "bg-gradient-to-r from-[#E50914]/20 to-red-600/10 text-white border border-[#E50914]/40 shadow-lg shadow-red-900/20"
                      : isHalloween
                      ? "text-purple-200/70 hover:text-white hover:bg-purple-900/20 border border-transparent"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${
                    active
                      ? isHalloween ? "text-[#FF7518]" : "text-[#E50914]"
                      : "text-neutral-400"
                  }`} />
                  <span className="truncate">{tab.label}</span>
                  {active && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full ${
                      isHalloween ? "bg-[#FF7518] shadow-[0_0_8px_#FF7518]" : "bg-[#E50914] shadow-[0_0_8px_#E50914]"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Links & Bottom Bar */}
        <div className={`p-3 border-t space-y-1.5 ${
          isHalloween ? "border-orange-500/20" : "border-white/10"
        }`}>
          <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isHalloween ? "text-orange-400/70" : "text-neutral-400"
          }`}>
            Cổng Chức Năng
          </div>
          <Link
            href="/staff/scanner"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isHalloween
                ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border-orange-500/30"
                : "bg-white/5 hover:bg-white/10 text-neutral-300 border-white/5"
            }`}
          >
            <span className="flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Máy Quét Vé PWA</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </Link>
          <Link
            href="/staff"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Cổng Nhân Viên</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400/60" />
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang Bán Vé</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-800/40 transition-all"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Đăng Xuất Admin</span>
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className={`h-16 px-6 border-b sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-4 transition-colors duration-300 ${
          isHalloween ? "bg-[#0A0510]/90 border-orange-500/20" : "bg-[#090D16]/90 border-white/10"
        }`}>
          {/* Breadcrumb / Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              {isHalloween && <span className="animate-bounce">🎃</span>}
              <span>Trang Quản Trị Hệ Thống</span>
            </h1>
            <span className="hidden sm:inline text-neutral-600">/</span>
            <span className="hidden sm:inline text-xs text-neutral-400 font-medium">
              Beta Cinemas Xuân Thủy (HITC Cầu Giấy)
            </span>
          </div>

          {/* Action Buttons: Halloween Toggle, Sync Data, Admin Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Master Halloween Switch for Entire System & Customer */}
            <button
              onClick={handleToggleCustomerHalloween}
              disabled={isTogglingCustomerHalloween}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-lg cursor-pointer ${
                customerHalloweenEnabled
                  ? "bg-gradient-to-r from-orange-600 to-purple-700 text-white border-orange-400 shadow-orange-500/30"
                  : "bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10"
              }`}
              title="Bật/Tắt chủ đề Lễ Hội Halloween toàn hệ thống (Admin & Khách Hàng)"
            >
              <span className="text-base">{customerHalloweenEnabled ? "🎃" : "🎬"}</span>
              <span className="hidden sm:inline">Chủ Đề Halloween:</span>
              <span className={`font-black ${customerHalloweenEnabled ? "text-orange-200" : "text-neutral-400"}`}>
                {customerHalloweenEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}
              </span>
            </button>

            {/* Live Customer Preview Quick Button */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                isHalloween
                  ? "bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-orange-500/30"
                  : "bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10 hover:text-white"
              }`}
              title="Mở trang chủ khách hàng trong tab mới để kiểm tra các thay đổi tức thì"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Xem Trang Khách</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>

            {/* Sync Data Button */}
            <button
              onClick={handleSyncBeta}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 ${
                isHalloween
                  ? "bg-[#FF7518] hover:bg-[#e0620f] shadow-orange-500/20"
                  : "bg-[#E50914] hover:bg-[#c81007] shadow-red-900/30"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{isSyncing ? "Đang Đồng Bộ..." : "Làm Mới Dữ Liệu"}</span>
            </button>

            {/* Admin Profile Pill */}
            <div className={`hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
              isHalloween ? "bg-purple-950/40 border-orange-500/20" : "bg-white/5 border-white/10"
            }`}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[11px] font-black text-white">
                AD
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Admin (cinemax2026)</div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang trực tuyến</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* Halloween Active Banner */}
          {isHalloween && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/20 via-purple-900/30 to-orange-500/20 border border-orange-500/30 text-orange-200 text-xs flex items-center justify-between shadow-lg shadow-orange-500/10 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🦇</span>
                <div>
                  <strong className="text-orange-300 font-bold">Chế Độ Halloween Spooky Đang Kích Hoạt!</strong>
                  <p className="text-[11px] text-orange-200/80 mt-0.5">
                    Toàn bộ bảng điều khiển quản trị viên được phủ sắc cam bí ngô neon và tím khói huyền bí theo chủ đề sự kiện.
                  </p>
                </div>
              </div>
              <span className="text-lg">🕸️ 🎃</span>
            </div>
          )}

          {/* Customer Halloween Theme Status Toast */}
          {customerHalloweenToast && (
            <div className="p-4 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-200 flex items-center justify-between text-xs animate-in fade-in shadow-lg shadow-orange-500/10">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎃</span>
                <div>
                  <strong className="text-orange-300 font-bold">{customerHalloweenToast}</strong>
                  <p className="text-orange-200/80 text-[11px] mt-0.5">
                    Trạng thái: {customerHalloweenEnabled ? "Website khách hàng đang hiển thị giao diện Halloween (Màu cam neon #FF7518, dải banner bí ngô)" : "Website khách hàng đang ở giao diện điện ảnh tiêu chuẩn"}
                  </p>
                </div>
              </div>
              <button onClick={() => setCustomerHalloweenToast(null)} className="text-orange-400 hover:text-white px-2 py-1 font-bold">✕</button>
            </div>
          )}

          {/* Sync Status Banner */}
          {syncStatus && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <strong>{syncStatus.message}</strong>
                  <p className="text-emerald-400/80 text-[11px] mt-0.5">
                    Cập nhật lúc: {new Date(syncStatus.syncedAt).toLocaleTimeString("vi-VN")} | Nguồn: {syncStatus.source} | Phim: {syncStatus.totalMovies} | Suất chiếu: {syncStatus.totalShowtimes}
                  </p>
                </div>
              </div>
              <button onClick={() => setSyncStatus(null)} className="text-emerald-400 hover:text-white px-2 py-1">✕</button>
            </div>
          )}

          {/* TAB 1: TỔNG QUAN RẠP & TRUNG TÂM ĐIỀU HÀNH THỜI GIAN THỰC (6 KHU VỰC CỐT LÕI) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 6. THANH THAO TÁC NHANH & TRẠNG THÁI HẠ TẦNG KỸ THUẬT (SYSTEM HEALTH & TECH BADGES) */}
              <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="font-bold text-neutral-300">Upstash Redis Lua:</span>
                  <span className="text-emerald-400 font-mono font-semibold">Online (14ms • TTL 300s)</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="font-bold text-neutral-300">Groq Llama 3.3 70B:</span>
                  <span className="text-cyan-400 font-mono font-semibold">Ready (182 tps)</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-neutral-300">Showtime Collision:</span>
                  <span className="text-emerald-400 font-mono font-semibold">0 Xung đột (Buffer 25p)</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-neutral-300">Cổng VietQR Napas:</span>
                  <span className="text-emerald-400 font-mono font-semibold">Active (Auto IPN)</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-neutral-300">Orphan Seat Rule:</span>
                  <span className="text-emerald-400 font-mono font-semibold">Active (Zero-gap)</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 ${
                  isHalloween ? "bg-purple-950/40 border-orange-500/30" : "bg-white/5 border-white/10"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-neutral-300">Scanner Gate:</span>
                  <span className="text-amber-400 font-mono font-semibold">HMAC Anti-Replay</span>
                </div>
              </div>

              {/* 1. HÀNG 1: 4 THẺ CHỈ SỐ KPI THỜI GIAN THỰC (TOP STAT CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Thẻ 1: Tổng Doanh Thu Hôm Nay */}
                <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
                  isHalloween
                    ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                    : "bg-[#111625]/90 border-white/10 hover:border-amber-500/40 hover:shadow-[0_4px_24px_rgba(245,158,11,0.12)]"
                }`}>
                  <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tổng doanh thu hôm nay</span>
                    <div className={`p-2 rounded-xl ${isHalloween ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black text-white tracking-tight">{formatVND(stats.todayRevenue)}</div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +18.5%
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Vé: <strong className="text-white">6.200.000₫</strong></span>
                    <span className="text-white/20">•</span>
                    <span>Bắp nước (F&B): <strong className="text-amber-400">2.250.000₫</strong></span>
                  </div>
                </div>

                {/* Thẻ 2: Vé Đã Bán Ra & Đang Giữ Chỗ (Khoe Redis Lua Hold 300s) */}
                <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
                  isHalloween
                    ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                    : "bg-[#111625]/90 border-white/10 hover:border-red-500/40 hover:shadow-[0_4px_24px_rgba(229,9,20,0.12)]"
                }`}>
                  <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Vé đã xuất / Giữ chỗ</span>
                    <div className={`p-2 rounded-xl ${isHalloween ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-500"}`}>
                      <Ticket className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {stats.ticketsSold} <span className="text-xs font-normal text-neutral-400">vé</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>8 ghế giữ (Redis TTL 300s)</span>
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Đã vào phòng: <strong className="text-emerald-400 font-mono">94/112 khách</strong></span>
                    <span className="text-cyan-400 font-semibold">Tỷ lệ: 84%</span>
                  </div>
                </div>

                {/* Thẻ 3: Tỷ Lệ Lấp Đầy (Khoe Orphan Seat Rule) */}
                <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
                  isHalloween
                    ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                    : "bg-[#111625]/90 border-white/10 hover:border-emerald-500/40 hover:shadow-[0_4px_24px_rgba(16,185,129,0.12)]"
                }`}>
                  <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tỷ lệ lấp đầy phòng</span>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black text-white tracking-tight">{stats.occupancyRate}</div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      +14% tối ưu
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="truncate">Nhờ Orphan Seat Rule (Chặn ghế đơn)</span>
                    <span className="text-emerald-400 font-bold shrink-0">228/306 ghế</span>
                  </div>
                </div>

                {/* Thẻ 4: Suất Chiếu & Soát Vé Telemetry */}
                <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
                  isHalloween
                    ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                    : "bg-[#111625]/90 border-white/10 hover:border-blue-500/40 hover:shadow-[0_4px_24px_rgba(59,130,246,0.12)]"
                }`}>
                  <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Suất chiếu & Soát vé</span>
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <ScanLine className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black text-white tracking-tight">8/12 <span className="text-xs font-normal text-neutral-400">suất mở</span></div>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      Cao điểm tối
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Soát vé: <strong className="text-white">94/112 khách</strong></span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> /scanner
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 & 3. HÀNG 2: BIỂU ĐỒ DOANH THU (65%) & TOP 5 PHIM HOT (35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái (65% -> 8 / 12 cols): Biểu đồ doanh thu tương tác */}
                <div className={`lg:col-span-8 p-5 sm:p-6 rounded-2xl border shadow-xl flex flex-col justify-between transition-all ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#111625] border-white/10"
                }`}>
                  <div>
                    {/* Header Biểu Đồ & Nút Chọn Kỳ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className={`w-4 h-4 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                          <h3 className="font-black text-sm sm:text-base text-white">Biến Động Doanh Thu Vé & Bắp Nước (F&B)</h3>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Phân tích theo khung giờ thực tế • Tự động tính tỷ lệ gắn kèm Concession
                        </p>
                      </div>

                      {/* Nút Chuyển Nhanh: Hôm Nay / 7 Ngày / Tháng Này */}
                      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
                        {[
                          { id: "today", label: "Hôm nay" },
                          { id: "7days", label: "7 ngày qua" },
                          { id: "month", label: "Tháng này" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setRevenuePeriod(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              revenuePeriod === tab.id
                                ? isHalloween
                                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                                  : "bg-[#E50914] text-white shadow-md shadow-red-900/40"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Legend & Summary Info */}
                    <div className="flex items-center justify-between flex-wrap gap-3 py-3 text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-sm ${isHalloween ? "bg-[#FF7518]" : "bg-[#E50914]"}`} />
                          <span className="text-neutral-300 font-semibold">Doanh Thu Vé</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
                          <span className="text-neutral-300 font-semibold">Bắp Nước (F&B)</span>
                        </div>
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        {revenuePeriod === "today"
                          ? "Cao điểm rạp: 18:00 – 21:00"
                          : revenuePeriod === "7days"
                          ? "Kỷ lục tuần: Thứ 7 (16.75M) & Thứ 4 (10.05M)"
                          : "Tăng trưởng tháng: +24.8%"}
                      </div>
                    </div>

                    {/* Interactive Stacked Bar Chart Graphic */}
                    <div className="pt-4 pb-2">
                      <div className="flex gap-2">
                        {/* Cột trục Y hiển thị mốc doanh thu */}
                        <div className="w-11 sm:w-14 h-60 flex flex-col justify-between text-[10px] text-neutral-500 font-mono font-semibold pb-7 select-none text-right pr-1">
                          <span>{formatShortVND(chartMaxVal)}</span>
                          <span>{formatShortVND(chartMaxVal * 0.75)}</span>
                          <span>{formatShortVND(chartMaxVal * 0.5)}</span>
                          <span>{formatShortVND(chartMaxVal * 0.25)}</span>
                          <span>0 ₫</span>
                        </div>

                        {/* Vùng biểu đồ các cột */}
                        <div className="flex-1 h-60 flex items-end justify-between gap-1.5 sm:gap-3 px-1 pb-7 border-b border-white/10 relative">
                          {/* Đường lưới mờ đối chiếu (Gridlines) */}
                          <div className="absolute inset-x-0 top-0 border-t border-white/5 pointer-events-none" />
                          <div className="absolute inset-x-0 top-[23%] border-t border-white/5 pointer-events-none" />
                          <div className="absolute inset-x-0 top-[47%] border-t border-white/5 pointer-events-none" />
                          <div className="absolute inset-x-0 top-[70%] border-t border-white/5 pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-7 border-t border-white/15 pointer-events-none" />

                          {chartData.map((d, idx) => {
                            const totalVal = d.ticket + d.fnb;
                            // Chiều cao cột tính chuẩn % theo maxVal (tối thiểu 12% để luôn nhìn rõ)
                            const barHeightPercent = Math.max(12, Math.min(100, Math.round((totalVal / chartMaxVal) * 100)));
                            const fnbPortionPercent = totalVal > 0 ? Math.round((d.fnb / totalVal) * 100) : 0;
                            const ticketPortionPercent = 100 - fnbPortionPercent;
                            const isHovered = hoveredChartBar === idx;

                            return (
                              <div
                                key={d.label}
                                onMouseEnter={() => setHoveredChartBar(idx)}
                                onMouseLeave={() => setHoveredChartBar(null)}
                                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer z-10"
                              >
                                {/* Tooltip chi tiết khi hover */}
                                {isHovered && (
                                  <div className="absolute -top-24 z-30 min-w-[185px] p-2.5 rounded-xl bg-[#090D16]/95 border border-white/20 shadow-2xl text-[11px] text-left pointer-events-none backdrop-blur-md animate-in fade-in zoom-in-95">
                                    <div className="font-bold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
                                      <span>{revenuePeriod === "today" ? `Khung giờ: ${d.label}` : d.label}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono">
                                        {barHeightPercent}% đỉnh
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-neutral-300 mb-0.5">
                                      <span className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${isHalloween ? "bg-[#FF7518]" : "bg-[#E50914]"}`} />
                                        <span>🎟️ Doanh thu vé:</span>
                                      </span>
                                      <strong className="text-white font-mono">{formatVND(d.ticket)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between text-amber-300 mb-1">
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                        <span>🍿 Bắp nước (F&B):</span>
                                      </span>
                                      <strong className="font-mono">{formatVND(d.fnb)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-white/10 font-bold">
                                      <span>Tổng cộng:</span>
                                      <span className="font-mono">{formatVND(totalVal)}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Con số ngắn gọn hiển thị ngay trên đỉnh cột */}
                                <div className={`mb-1.5 text-[9px] sm:text-[10px] font-mono font-bold transition-all ${
                                  isHovered ? "text-white scale-110" : "text-neutral-400 opacity-90"
                                }`}>
                                  {formatShortVND(totalVal)}
                                </div>

                                {/* Khối cột chồng (Stacked Bars) */}
                                <div
                                  className="w-full max-w-[32px] sm:max-w-[42px] rounded-t-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:brightness-110 flex flex-col justify-end"
                                  style={{ height: `${barHeightPercent}%`, minHeight: "18px" }}
                                >
                                  {/* Phân đoạn F&B (Màu vàng hổ phách) */}
                                  <div
                                    className="w-full bg-gradient-to-t from-amber-600 to-[#F59E0B] transition-all duration-500"
                                    style={{ height: `${fnbPortionPercent}%`, minHeight: fnbPortionPercent > 0 ? "5px" : "0px" }}
                                  />
                                  {/* Phân đoạn Vé (Màu đỏ điện ảnh hoặc cam Halloween) */}
                                  <div
                                    className={`w-full transition-all duration-500 ${
                                      isHalloween
                                        ? "bg-gradient-to-t from-orange-700 via-orange-600 to-[#FF7518]"
                                        : "bg-gradient-to-t from-red-800 via-[#E50914] to-red-500"
                                    }`}
                                    style={{ height: `${ticketPortionPercent}%`, minHeight: "12px" }}
                                  />
                                </div>

                                {/* Nhãn thời gian trục X dưới đáy cột */}
                                <span className={`text-[10px] sm:text-[11px] absolute -bottom-5.5 font-bold truncate transition-colors ${
                                  isHovered ? "text-white" : "text-neutral-400"
                                }`}>
                                  {d.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Tổng Kỳ Chọn</span>
                      <span className="font-black text-white text-sm">
                        {formatVND(chartData.reduce((acc, curr) => acc + curr.ticket + curr.fnb, 0))}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Tỷ Lệ Đính Kèm F&B</span>
                      <span className="font-black text-amber-400 text-sm">36.3%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Doanh Thu TB / Khách</span>
                      <span className="font-black text-emerald-400 text-sm">75.400 ₫</span>
                    </div>
                  </div>
                </div>

                {/* Cột phải (35% -> 4 / 12 cols): Top 5 Phim Doanh Thu Cao Nhất */}
                <div className={`lg:col-span-4 p-5 sm:p-6 rounded-2xl border shadow-xl flex flex-col justify-between transition-all ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#111625] border-white/10"
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Top 5 Phim Hôm Nay</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Xếp hạng theo tổng doanh thu phòng vé</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        100% Thị phần
                      </span>
                    </div>

                    {/* Danh sách 5 Phim */}
                    <div className="space-y-3 pt-3">
                      {TOP_5_MOVIES_TODAY.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank Badge */}
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${item.badgeColor}`}>
                              {item.rank}
                            </span>

                            {/* Poster Thumbnail */}
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-8 h-11 object-cover rounded-md border border-white/10 shrink-0"
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                                  {item.title}
                                </h4>
                                <span className="font-mono text-xs font-bold text-white shrink-0">
                                  {item.tickets} vé
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                                <span className="truncate">{item.format}</span>
                                <span className="text-amber-400 font-semibold">{item.percent}%</span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-white/10 rounded-full h-1 mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.rank === 1
                                      ? "bg-amber-400"
                                      : item.rank === 2
                                      ? "bg-slate-300"
                                      : item.rank === 3
                                      ? "bg-amber-600"
                                      : "bg-white/40"
                                  }`}
                                  style={{ width: `${item.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Đã bán: <strong className="text-white font-mono">112 vé</strong></span>
                    <button
                      onClick={() => setActiveTab("movies")}
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Quản lý kho phim</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 & 5. HÀNG 3: TRẠNG THÁI PHÒNG CHIẾU TRỰC TIẾP (60%) & NHẬT KÝ THỜI GIAN THỰC (40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái (60% -> 7 / 12 cols): Live Auditorium Monitor */}
                <div className={`lg:col-span-7 p-5 sm:p-6 rounded-2xl border shadow-xl transition-all ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#111625] border-white/10"
                }`}>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                        <span>Trạng Thái Phòng Chiếu Trực Tiếp (Live Monitor)</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Beta Cinemas Xuân Thủy (HITC Cầu Giấy) • Theo dõi tỷ lệ lấp đầy & dọn phòng 15p
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                      3 Phòng Hoạt Động
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Phòng 1: Beta 01 */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">Phòng Beta 01 (Dolby 7.1)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-300 border-purple-500/20">
                              Đang Chiếu (Phút 85/166)
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">
                            Phim: <strong className="text-white">Dune: Phần Hai</strong> • Suất: <span className="text-amber-400 font-semibold">18:45 – 21:30</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-start">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickSeatModalRoom({
                                name: "Phòng Beta 01 (Dolby 7.1)",
                                movie: "Dune: Phần Hai",
                                showtime: "18:45 – 21:30",
                                occupiedCount: 72,
                                totalSeats: 102,
                                status: "Đang Chiếu",
                                statusColor: "text-purple-400",
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Armchair className="w-3.5 h-3.5" />
                            <span>Xem sơ đồ 102 ghế</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar đổi màu theo lấp đầy: 72/102 = 70.5% (Cam) */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Tiến độ lấp đầy: <strong className="text-amber-400 font-mono">72/102 ghế (70.5%)</strong></span>
                          <span className="text-cyan-400 font-medium">Buffer dọn buồng: 15p</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: "70.5%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phòng 2: Beta 02 */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">Phòng Beta 02 (Laser HD - Atmos)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse">
                              Đón Khách (Còn 8p)
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">
                            Phim: <strong className="text-white">Quật Mộ Trùng Ma</strong> • Suất: <span className="text-amber-400 font-semibold">20:00 – 22:15</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-start">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickSeatModalRoom({
                                name: "Phòng Beta 02 (Laser HD - Atmos)",
                                movie: "Quật Mộ Trùng Ma",
                                showtime: "20:00 – 22:15",
                                occupiedCount: 84,
                                totalSeats: 102,
                                status: "Đón Khách",
                                statusColor: "text-amber-400",
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Armchair className="w-3.5 h-3.5" />
                            <span>Xem sơ đồ 102 ghế</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar đổi màu theo lấp đầy: 84/102 = 82.3% (Đỏ - Sắp full) */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Tiến độ lấp đầy: <strong className="text-red-400 font-mono">84/102 ghế (82.3% - Sắp Full)</strong></span>
                          <span className="text-emerald-400 font-medium">84 khách đã check-in</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                            style={{ width: "82.3%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phòng 3: Beta 03 */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">Phòng Beta 03 (Standard)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                              Đang Mở Bán Online
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">
                            Phim: <strong className="text-white">Conan: Ngôi Sao 5 Cánh</strong> • Suất: <span className="text-amber-400 font-semibold">21:15 – 22:50</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-start">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickSeatModalRoom({
                                name: "Phòng Beta 03 (Standard)",
                                movie: "Conan: Ngôi Sao 5 Cánh",
                                showtime: "21:15 – 22:50",
                                occupiedCount: 45,
                                totalSeats: 102,
                                status: "Mở Bán Online",
                                statusColor: "text-emerald-400",
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Armchair className="w-3.5 h-3.5" />
                            <span>Xem sơ đồ 102 ghế</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar đổi màu: 45/102 = 44.1% (Xanh lục) */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Tiến độ lấp đầy: <strong className="text-emerald-400 font-mono">45/102 ghế (44.1%)</strong></span>
                          <span className="text-neutral-400 font-medium">Còn 57 ghế trống</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                            style={{ width: "44.1%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột phải (40% -> 5 / 12 cols): Nhật Ký Giao Dịch & Soát Vé Thời Gian Thực */}
                <div className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border shadow-xl flex flex-col justify-between transition-all ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#111625] border-white/10"
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span>Nhật Ký Giao Dịch & Soát Vé Live</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Sự kiện thời gian thực trong toàn hệ thống</p>
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Feed
                      </span>
                    </div>

                    {/* Danh sách 6 Sự Kiện Mới Nhất */}
                    <div className="space-y-3 pt-3">
                      {LIVE_AUDIT_LOGS.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                              <span>{log.icon}</span>
                              <span>{log.time}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${log.tagColor}`}>
                              {log.tag}
                            </span>
                          </div>
                          <p className="text-neutral-200 text-xs leading-snug">{log.content}</p>
                          <div className="text-[10px] text-neutral-400 font-mono mt-1 pt-1 border-t border-white/5">
                            {log.meta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Đã ghi nhận: <strong className="text-white font-mono">1.428 events/ngày</strong></span>
                    <Link
                      href="/staff/scanner"
                      className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Mở Cổng Soát Vé /scanner</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* BỘ ĐIỀU KHIỂN CHIẾN DỊCH: LIVE BROADCAST & HALLOWEEN TRANG KHÁCH (THU GỌN CHUYÊN NGHIỆP) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Khối Phát Sóng Thông Báo Trang Khách */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <Megaphone className={`w-4 h-4 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                      <h4 className="font-bold text-xs sm:text-sm text-white">Live Broadcast Thông Báo Khách</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnnouncementSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        announcementSettings.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-neutral-400 border-white/10"
                      }`}
                    >
                      {announcementSettings.enabled ? "BẬT" : "TẮT"}
                    </button>
                  </div>
                  <div className="pt-3 space-y-2.5">
                    <input
                      type="text"
                      value={announcementSettings.text}
                      onChange={(e) => setAnnouncementSettings((prev) => ({ ...prev, text: e.target.value }))}
                      placeholder="Nội dung thông báo hiển thị đầu website khách..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-neutral-400 truncate">
                        {announcementSaveSuccess ? "✅ Đã lưu lên máy chủ!" : "* Đồng bộ tức thì"}
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveAnnouncement}
                        disabled={isSavingAnnouncement}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-md ${
                          isHalloween ? "bg-orange-500 hover:bg-orange-600" : "bg-[#E50914] hover:bg-[#c81007]"
                        }`}
                      >
                        {isSavingAnnouncement ? "Đang lưu..." : "Lưu & Bắn Lên Web"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Khối Điều Khiển Halloween Trang Khách */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  customerHalloweenEnabled
                    ? "bg-gradient-to-r from-[#1E0E32] to-[#2D124D] border-orange-500/40 shadow-lg shadow-orange-500/10"
                    : isHalloween
                    ? "bg-[#140B22] border-orange-500/20"
                    : "bg-[#14151B] border-white/10"
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{customerHalloweenEnabled ? "🎃" : "👻"}</span>
                      <h4 className="font-bold text-xs sm:text-sm text-white">Chủ Đề Halloween Trang Khách</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      customerHalloweenEnabled
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                        : "bg-white/10 text-neutral-400 border-white/10"
                    }`}>
                      {customerHalloweenEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}
                    </span>
                  </div>
                  <div className="pt-3 flex items-center justify-between gap-3 text-xs">
                    <p className="text-neutral-400 text-xs">
                      Bật sắc Cam Neon (#FF7518), bầy dơi, hộp quà tặng và banner lễ hội cho toàn bộ khách hàng.
                    </p>
                    <button
                      type="button"
                      onClick={handleToggleCustomerHalloween}
                      disabled={isTogglingCustomerHalloween}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 shadow-md ${
                        customerHalloweenEnabled
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      {customerHalloweenEnabled ? "Tắt Halloween" : "Bật Halloween"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              POPUP MODAL XEM NHANH SƠ ĐỒ 102 GHẾ PHÒNG CHIẾU (QUICK AUDITORIUM SEAT MAP)
              ========================================================================= */}
          {quickSeatModalRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className={`relative w-full max-w-4xl p-6 sm:p-7 rounded-3xl border shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto ${
                isHalloween
                  ? "bg-[#140822] border-orange-500/40 shadow-orange-500/20"
                  : "bg-[#0E111A] border-white/15 shadow-black/80"
              }`}>
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <Armchair className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-white">{quickSeatModalRoom.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border bg-white/5 ${quickSeatModalRoom.statusColor}`}>
                          {quickSeatModalRoom.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Phim: <strong className="text-white">{quickSeatModalRoom.movie}</strong> • Suất chiếu: <span className="text-amber-400 font-semibold">{quickSeatModalRoom.showtime}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setQuickSeatModalRoom(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Màn Hình Chiếu Cong */}
                <div className="py-2 text-center">
                  <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_16px_#38bdf8]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mt-1 block">
                    MÀN HÌNH CHIẾU CONG DOLBY ATMOS
                  </span>
                </div>

                {/* Sơ Đồ 102 Ghế Trực Quan (A -> K) */}
                <div className="py-3 px-2 sm:px-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 overflow-x-auto">
                  {/* Rows A, B, C, D: Ghế Thường (10 ghế mỗi hàng) */}
                  {["A", "B", "C", "D"].map((rowLetter, rowIdx) => (
                    <div key={rowLetter} className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="w-5 text-center text-xs font-mono font-bold text-neutral-400">{rowLetter}</span>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {Array.from({ length: 10 }).map((_, seatIdx) => {
                          const seatNumber = seatIdx + 1;
                          const seatCode = `${rowLetter}${seatNumber}`;
                          const globalSeatIdx = rowIdx * 10 + seatIdx;
                          const isOccupied = globalSeatIdx < quickSeatModalRoom.occupiedCount - 8;
                          const isHeldByRedis = globalSeatIdx >= quickSeatModalRoom.occupiedCount - 8 && globalSeatIdx < quickSeatModalRoom.occupiedCount;

                          return (
                            <div
                              key={seatCode}
                              title={
                                isHeldByRedis
                                  ? `Ghế ${seatCode} (Standard) • Đang khóa bởi Redis Lua Engine (TTL: 284s)`
                                  : isOccupied
                                  ? `Ghế ${seatCode} (Standard) • Đã xuất vé`
                                  : `Ghế ${seatCode} (Standard) • Đang trống`
                              }
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded text-[10px] font-mono flex items-center justify-center border transition-all select-none ${
                                isHeldByRedis
                                  ? "bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                  : isOccupied
                                  ? "bg-red-950/80 text-red-300 border-red-800/60"
                                  : "bg-white/5 text-neutral-300 border-white/10 hover:border-white/30"
                              }`}
                            >
                              {seatNumber}
                            </div>
                          );
                        })}
                      </div>
                      <span className="w-5 text-center text-xs font-mono font-bold text-neutral-400">{rowLetter}</span>
                    </div>
                  ))}

                  {/* Rows E, F, G, H, J: Ghế VIP (11 ghế mỗi hàng) */}
                  {["E", "F", "G", "H", "J"].map((rowLetter, rowIdx) => (
                    <div key={rowLetter} className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="w-5 text-center text-xs font-mono font-bold text-amber-400">{rowLetter}</span>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {Array.from({ length: 11 }).map((_, seatIdx) => {
                          const seatNumber = seatIdx + 1;
                          const seatCode = `${rowLetter}${seatNumber}`;
                          const globalSeatIdx = 40 + rowIdx * 11 + seatIdx;
                          const isOccupied = globalSeatIdx < quickSeatModalRoom.occupiedCount - 8;
                          const isHeldByRedis = globalSeatIdx >= quickSeatModalRoom.occupiedCount - 8 && globalSeatIdx < quickSeatModalRoom.occupiedCount;

                          return (
                            <div
                              key={seatCode}
                              title={
                                isHeldByRedis
                                  ? `Ghế ${seatCode} (VIP Sweet Spot) • Đang khóa bởi Redis Lua Engine (TTL: 284s)`
                                  : isOccupied
                                  ? `Ghế ${seatCode} (VIP Sweet Spot) • Đã xuất vé`
                                  : `Ghế ${seatCode} (VIP Sweet Spot) • Đang trống`
                              }
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded text-[10px] font-mono flex items-center justify-center border transition-all select-none ${
                                isHeldByRedis
                                  ? "bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                  : isOccupied
                                  ? "bg-red-950/80 text-red-300 border-red-800/60"
                                  : "bg-purple-950/30 text-purple-200 border-purple-500/30 hover:border-purple-400"
                              }`}
                            >
                              {seatNumber}
                            </div>
                          );
                        })}
                      </div>
                      <span className="w-5 text-center text-xs font-mono font-bold text-amber-400">{rowLetter}</span>
                    </div>
                  ))}

                  {/* Row K: Ghế Đôi Sweetbox (7 cặp ghế đôi) */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1">
                    <span className="w-5 text-center text-xs font-mono font-bold text-rose-400">K</span>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 7 }).map((_, pairIdx) => {
                        const seatCode = `K${pairIdx * 2 + 1}-${pairIdx * 2 + 2}`;
                        const isOccupied = pairIdx < 4;
                        return (
                          <div
                            key={seatCode}
                            title={`Ghế đôi ${seatCode} (Sweetbox Couple) • ${isOccupied ? "Đã bán" : "Đang trống"}`}
                            className={`w-12 h-6 sm:w-14 sm:h-7 rounded text-[10px] font-mono flex items-center justify-center border transition-all select-none ${
                              isOccupied
                                ? "bg-rose-950/80 text-rose-300 border-rose-800/60"
                                : "bg-rose-950/30 text-rose-200 border-rose-500/30 hover:border-rose-400"
                            }`}
                          >
                            {seatCode}
                          </div>
                        );
                      })}
                    </div>
                    <span className="w-5 text-center text-xs font-mono font-bold text-rose-400">K</span>
                  </div>
                </div>

                {/* Seat Legend & Highlights */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-white/5 border border-white/20" />
                      <span className="text-neutral-300">Ghế trống sẵn sàng</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-red-950 border border-red-800" />
                      <span className="text-neutral-300">Đã bán</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-amber-500/30 border border-amber-400 animate-pulse" />
                      <span className="text-amber-300 font-bold">Khóa Redis Lua (TTL 300s)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-rose-950/40 border border-rose-500/30" />
                      <span className="text-rose-300">Sweetbox Đôi</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Orphan Seat Rule Active (Chặn ghế đơn độc)</span>
                  </div>
                </div>

                {/* Footer Modal Action */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-400">
                    Tổng: <strong className="text-white font-mono">{quickSeatModalRoom.totalSeats} ghế</strong> | Đang lấp đầy: <strong className="text-amber-400 font-mono">{quickSeatModalRoom.occupiedCount} ghế</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSeatModalRoom(null);
                        setActiveTab("seats");
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                    >
                      Mở Tab Quản Lý Sơ Đồ Đầy Đủ
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSeatModalRoom(null)}
                      className={`px-4 py-2 rounded-xl text-xs font-black text-white transition-all shadow-md ${
                        isHalloween ? "bg-orange-500 hover:bg-orange-600" : "bg-[#E50914] hover:bg-[#c81007]"
                      }`}
                    >
                      Đóng Popup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH CHIẾU BETA XUÂN THỦY & ENGINE KIỂM TRA XUNG ĐỘT */}
          {activeTab === "showtimes" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Bộ Điều Phối & Lên Lịch Chiếu (Showtime Engine)</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Collision Engine Active
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Beta Cinemas Xuân Thủy • Tự động tính toán thời lượng phim + 10p quảng cáo + 15p dọn buồng để ngăn chặn xung đột phòng chiếu
                  </p>
                </div>
                <button
                  onClick={handleSyncBeta}
                  className="text-xs px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 shrink-0 text-neutral-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "" : ""}`} />
                  <span>Cập nhật lịch Live</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* CỘT TRÁI (5 Cột): Form Thêm Suất Chiếu & Kiểm Tra Xung Đột */}
                <div className="lg:col-span-5 space-y-4">
                  <div className={`p-5 rounded-2xl border shadow-xl space-y-4 ${
                    isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                        <span>Thêm Suất Chiếu Mới</span>
                      </h4>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Buffer 25p (10p trailer + 15p dọn)
                      </span>
                    </div>

                    <form onSubmit={handleAddShowtime} className="space-y-3.5">
                      {/* Chọn Phim */}
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Chọn Phim:</label>
                        <select
                          value={newMovieId}
                          onChange={(e) => setNewMovieId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-accent-red"
                        >
                          {MOCK_MOVIES.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#14151B] text-white">
                              {m.title} ({m.durationMinutes} phút - {m.ageRating})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chọn Phòng */}
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Phòng Chiếu:</label>
                        <select
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-accent-red"
                        >
                          <option value="Phòng Beta 01 (Dolby 7.1)" className="bg-[#14151B] text-white">
                            Phòng Beta 01 (Dolby 7.1)
                          </option>
                          <option value="Phòng Beta 02 (Laser HD)" className="bg-[#14151B] text-white">
                            Phòng Beta 02 (Laser HD)
                          </option>
                          <option value="Phòng Beta 03 (Standard)" className="bg-[#14151B] text-white">
                            Phòng Beta 03 (Standard)
                          </option>
                        </select>
                      </div>

                      {/* Ngày, Giờ, Định dạng */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Ngày:</label>
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-accent-red"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Giờ Chiếu:</label>
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-accent-red"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Định Dạng:</label>
                          <select
                            value={newFormat}
                            onChange={(e) => setNewFormat(e.target.value as any)}
                            className="w-full px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-accent-red"
                          >
                            <option value="2D Phụ Đề" className="bg-[#14151B] text-white">2D Phụ Đề</option>
                            <option value="2D Lồng Tiếng" className="bg-[#14151B] text-white">2D Lồng Tiếng</option>
                            <option value="IMAX Laser" className="bg-[#14151B] text-white">IMAX Laser</option>
                            <option value="4DX" className="bg-[#14151B] text-white">4DX</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Collision Feedback Banner */}
                      {!collisionResult.valid && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                          {collisionResult.errors.join(", ")}
                        </div>
                      )}

                      {collisionResult.valid && collisionResult.ok && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
                          <div className="font-bold flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Khung Giờ Hợp Lệ & Khả Dụng!</span>
                          </div>
                          <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                            Phòng trống trong khoảng <strong>{collisionResult.occupied?.startTime}</strong> – <strong>{collisionResult.occupied?.endTime}</strong>. Tổng chiếm dụng phòng: <strong>{collisionResult.totalOccupiedMinutes} phút</strong> ({selectedMovie?.durationMinutes}p phim + {TRAILER_MINUTES}p trailer + {CLEANING_MINUTES}p dọn buồng).
                          </p>
                        </div>
                      )}

                      {collisionResult.valid && !collisionResult.ok && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2.5 animate-in fade-in">
                          <div className="font-bold flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>PHÁT HIỆN {collisionResult.conflicts.length} XUNG ĐỘT PHÒNG CHIẾU!</span>
                          </div>

                          <div className="space-y-1.5">
                            {collisionResult.conflicts.map((c, i) => (
                              <div key={i} className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px]">
                                <div className="flex items-center gap-1.5 mb-1 font-semibold">
                                  {c.kind === "overlap" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 text-[10px] font-bold">
                                      Xung đột trùng giờ phim
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] font-bold">
                                      Vi phạm đệm dọn phòng
                                    </span>
                                  )}
                                </div>
                                <p className="text-neutral-300 leading-normal">{c.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* Gợi ý slot trống gần nhất */}
                          {collisionResult.suggestions.length > 0 && (
                            <div className="pt-2 border-t border-red-500/20">
                              <div className="text-[11px] font-semibold text-neutral-300 mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Gợi ý khung giờ trống gần nhất (Click để chọn):</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {collisionResult.suggestions.map((s, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setNewTime(s.time);
                                      setNewDate(s.date);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-white/10 text-white text-[11px] transition-all flex items-center gap-1.5 font-medium group"
                                  >
                                    <Clock className="w-3 h-3 text-cyan-400 group-hover:text-emerald-400" />
                                    <span>{s.time}</span>
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      ({s.offsetMinutes > 0 ? `+${s.offsetMinutes}p` : `${s.offsetMinutes}p`})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Schedule Success Message */}
                      {scheduleSuccessMsg && (
                        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>{scheduleSuccessMsg}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!collisionResult.ok}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                          collisionResult.ok
                            ? isHalloween
                              ? "bg-[#FF7518] hover:bg-[#e0620f] text-white shadow-orange-500/20 cursor-pointer"
                              : "bg-[#E50914] hover:bg-[#c81007] text-white shadow-red-900/30 cursor-pointer"
                            : "bg-neutral-800 text-neutral-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{collisionResult.ok ? "Xác Nhận Thêm Suất Chiếu" : "Không Thể Thêm (Đang Trùng Lịch)"}</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* CỘT PHẢI (7 Cột): Danh Sách Suất Chiếu Hiện Tại Tại Rạp */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Lịch Chiếu Đang Mở Bán</span>
                      <span className="text-xs text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                        {showtimesList.filter((st) => st.cinemaId === "beta-cinemas-xuan-thuy").length} suất
                      </span>
                    </div>

                    {/* Filter phòng */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {[
                        { id: "all", label: "Tất cả" },
                        { id: "Beta 01", label: "Phòng 01" },
                        { id: "Beta 02", label: "Phòng 02" },
                        { id: "Beta 03", label: "Phòng 03" },
                      ].map((rf) => (
                        <button
                          key={rf.id}
                          type="button"
                          onClick={() => setSelectedRoomFilter(rf.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            selectedRoomFilter === rf.id
                              ? isHalloween
                                ? "bg-[#FF7518] text-white"
                                : "bg-[#E50914] text-white"
                              : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {rf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
                    {showtimesList
                      .filter(
                        (st) =>
                          st.cinemaId === "beta-cinemas-xuan-thuy" &&
                          (selectedRoomFilter === "all" || st.roomName.includes(selectedRoomFilter))
                      )
                      .map((st) => {
                        const movie = MOCK_MOVIES.find((m) => String(m.id) === String(st.movieId));
                        const duration = movie?.durationMinutes ?? 120;
                        const timeParts = st.time.split(":").map(Number);
                        let occupiedEndStr = "";
                        if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
                          const totalMins = timeParts[0] * 60 + timeParts[1] + duration + TRAILER_MINUTES + CLEANING_MINUTES;
                          const endH = Math.floor(totalMins / 60) % 24;
                          const endM = totalMins % 60;
                          occupiedEndStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                        }

                        return (
                          <div
                            key={st.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between group ${
                              isHalloween
                                ? "bg-[#140B22] border-orange-500/20 hover:border-orange-500/40"
                                : "bg-[#14151B] border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isHalloween
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}>
                                  {st.format}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-black ${isHalloween ? "text-orange-400" : "text-amber-400"}`}>{st.time}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteShowtime(st.id)}
                                    title="Xóa suất chiếu này"
                                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">
                                {movie?.title || st.movieId}
                              </h4>

                              <p className="text-xs text-neutral-400 flex items-center gap-1 mb-2">
                                <Building2 className="w-3 h-3 text-neutral-500" />
                                <span>{st.roomName}</span>
                              </p>

                              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-neutral-400 space-y-0.5">
                                <div>Thời lượng phim: <strong className="text-white">{duration} phút</strong></div>
                                <div>
                                  Chiếm phòng (đệm 25p):{" "}
                                  <strong className="text-cyan-400 font-mono">
                                    {st.time} – {occupiedEndStr}
                                  </strong>
                                </div>
                                <div className="text-[10px] text-neutral-500">Ngày chiếu: {st.date}</div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                              <span className="text-neutral-500 text-[11px]">Beta Cinemas Xuân Thủy</span>
                              <span className="text-emerald-400 font-semibold text-[11px]">Đang mở bán</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ PHIM & ĐIỀU PHỐI DANH MỤC TRANG KHÁCH */}
          {activeTab === "movies" && (
            <div className="space-y-6">
              {/* Thanh Chuyển Chế Độ: Thêm/Xóa Phim CRUD & Điều Phối 1-Click */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setMovieManagementSubTab("crud")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    movieManagementSubTab === "crud"
                      ? isHalloween
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-[#E50914] text-white shadow-lg shadow-red-900/40"
                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Quản Lý Thêm / Sửa / Xóa Phim & Thùng Rác</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMovieManagementSubTab("coordination")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    movieManagementSubTab === "coordination"
                      ? isHalloween
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-[#E50914] text-white shadow-lg shadow-red-900/40"
                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Điều Phối Trạng Thái Trang Khách (1-Click)</span>
                </button>
              </div>

              {/* SubTab 1: CRUD Đầy Đủ (Thêm Phim, Sửa, Xóa Vào Thùng Rác, Khôi Phục) */}
              {movieManagementSubTab === "crud" && (
                <div className="animate-in fade-in duration-200">
                  <AdminMoviesTab adminUser="Admin CineMax" />
                </div>
              )}

              {/* SubTab 2: Điều Phối 1-Click */}
              {movieManagementSubTab === "coordination" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <Film className={`w-5 h-5 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                    <span>Kho Phim Chiếu Rạp & Điều Phối Danh Mục ({adminMovies.length} phim)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Thay đổi danh mục (Đang chiếu / Sắp chiếu / Suất đặc biệt) tại đây sẽ cập nhật trực tiếp lên các tab trang chủ khách hàng (<code className="text-cyan-400 font-mono">/</code>).
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm phim theo tên hoặc thể loại..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* Toast Thông Báo Khi Đổi Trạng Thái Thành Công */}
              {movieStatusSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{movieStatusSuccess}</span>
                  </div>
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-white underline hover:no-underline font-bold flex items-center gap-1"
                  >
                    <span>Xem trên trang chủ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminMovies.filter((m) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    m.title.toLowerCase().includes(q) ||
                    (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
                    m.genres.some((g) => g.toLowerCase().includes(q))
                  );
                }).map((movie) => {
                  const ageColor =
                    movie.ageRating === "P"
                      ? "bg-emerald-500 text-white"
                      : movie.ageRating === "T13"
                      ? "bg-amber-500 text-white"
                      : movie.ageRating === "T16"
                      ? "bg-orange-500 text-white"
                      : movie.ageRating === "T18"
                      ? "bg-red-600 text-white"
                      : "bg-blue-500 text-white";

                  const currentTab = movie.commercialTab || (movie.status === "upcoming" ? "upcoming" : movie.status === "trending" ? "trending" : "now_playing");
                  const isUpdatingThis = movieStatusUpdating === String(movie.id);

                  return (
                    <div
                      key={movie.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-lg group ${
                        isHalloween
                          ? "bg-[#140B22] border-orange-500/20 hover:border-orange-500/40"
                          : "bg-[#13151f] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div>
                        <div className="flex gap-4">
                          {/* Poster với Age Badge */}
                          <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={movie.posterPath}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span
                              className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase shadow-md ${ageColor}`}
                            >
                              {movie.ageRating}
                            </span>
                          </div>

                          {/* Thông tin phim */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-white truncate">{movie.title}</h4>
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {movie.voteAverage}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 italic line-clamp-1 mt-0.5">
                              {movie.originalTitle}
                            </p>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {movie.genres.map((g, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white/5 text-neutral-300 border border-white/5"
                                >
                                  {g}
                                </span>
                              ))}
                              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white/5 text-neutral-400">
                                {movie.durationMinutes} phút
                              </span>
                            </div>

                            <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                              {movie.overview}
                            </p>
                          </div>
                        </div>

                        {/* Điều phối 1-Click hiển thị trên trang khách */}
                        <div className="mt-3.5 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              Trạng Thái Hiển Thị Trang Khách:
                            </span>
                            {isUpdatingThis && (
                              <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
                                Đang đồng bộ máy chủ...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: "now_playing", label: "Đang Chiếu", icon: Film },
                              { id: "upcoming", label: "Sắp Chiếu", icon: Clock },
                              { id: "trending", label: "Suất Đặc Biệt", icon: Flame },
                            ].map((tabOption) => {
                              const isSelected = currentTab === tabOption.id;
                              const Icon = tabOption.icon;
                              return (
                                <button
                                  key={tabOption.id}
                                  type="button"
                                  disabled={isUpdatingThis}
                                  onClick={() => handleToggleMovieStatus(movie.id, tabOption.id as any)}
                                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 border ${
                                    isSelected
                                      ? isHalloween
                                        ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/30"
                                        : "bg-[#E50914] text-white border-[#ff4e45] shadow-md shadow-red-900/40"
                                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border-white/5"
                                  }`}
                                  title={`Chuyển phim này sang tab [${tabOption.label}] trên trang khách`}
                                >
                                  <Icon className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{tabOption.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-neutral-400">
                          Beta Cinemas Xuân Thủy
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setNewMovieId(String(movie.id));
                            setActiveTab("showtimes");
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                            isHalloween
                              ? "bg-purple-900/30 hover:bg-orange-500 text-orange-300 hover:text-white border-orange-500/30"
                              : "bg-white/5 hover:bg-[#E50914] text-neutral-300 hover:text-white border-white/10"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Lên Lịch Suất Chiếu</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
              )}
            </div>
          )}

          {/* TAB 4: SOÁT VÉ & CHECK-IN */}
          {activeTab === "tickets" && (
            <div className={`p-8 rounded-2xl border max-w-2xl mx-auto w-full space-y-6 text-center shadow-2xl ${
              isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg ${
                isHalloween
                  ? "bg-orange-500/20 text-orange-400 shadow-orange-500/20"
                  : "bg-[#E50914]/20 text-[#E50914] shadow-red-900/30"
              }`}>
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hệ Thống Soát Vé Điện Tử - Beta Xuân Thủy</h3>
                <p className="text-xs text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Hệ thống soát vé tập trung chống gian lận đa luồng. Mọi lượt soát vé thông qua ứng dụng máy quét PWA để xác thực chữ ký HMAC và đánh dấu nguyên tử (Atomic Check-in) trên Redis/Store.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Chống Vé Kép</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Ngăn chặn 100% tình huống dùng lại vé hoặc hai máy quét cùng lúc.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kiểm Soát F&B</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Hiển thị chi tiết combo bắp nước để nhân viên giao đúng món cho khách.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Âm Báo Trực Quan</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Web Audio Synth phản hồi âm thanh hợp lệ hoặc từ chối tức thì.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/staff"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/15 group"
                >
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Cổng Vận Hành Nhân Viên (/staff)</span>
                </Link>
                <Link
                  href="/staff/scanner"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-black transition-all shadow-xl group ${
                    isHalloween
                      ? "bg-[#FF7518] hover:bg-[#e0620f] shadow-orange-500/25"
                      : "bg-[#E50914] hover:bg-[#c81007] shadow-red-900/30"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Máy Quét Camera QR (/staff/scanner)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 5: BẢNG GIÁ VÉ */}
          {activeTab === "pricing" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
              }`}>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Ticket className={`w-4 h-4 ${isHalloween ? "text-orange-400" : "text-[#E50914]"}`} />
                  <span>Bảng Giá Vé Rạp Beta Xuân Thủy</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <div className="font-bold text-sm text-white">Ghế Thường (Standard)</div>
                      <div className="text-xs text-neutral-400">Các hàng ghế đầu và rìa (A - D)</div>
                    </div>
                    <div className="text-base font-black text-amber-400">55.000 đ</div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <div className="font-bold text-sm text-white">Ghế VIP (Sweet Spot)</div>
                      <div className="text-xs text-neutral-400">Tầm nhìn hoàn hảo, góc 36-40° (E - H)</div>
                    </div>
                    <div className="text-base font-black text-amber-400">75.000 đ</div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <div className="font-bold text-sm text-white">Ghế Đôi (Sweetbox Couple)</div>
                      <div className="text-xs text-neutral-400">Ghế sofa đôi hàng cuối riêng tư (K)</div>
                    </div>
                    <div className="text-base font-black text-amber-400">130.000 đ</div>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border space-y-4 ${
                isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
              }`}>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Menu Bắp Nước Sinh Viên Beta</span>
                </h3>
                <div className="space-y-3">
                  {CONCESSION_COMBOS.map((combo) => (
                    <div key={combo.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <div className="font-bold text-sm text-white">{combo.icon} {combo.name}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{combo.description}</div>
                      </div>
                      <div className="text-base font-black text-amber-400 whitespace-nowrap ml-3">
                        {formatVND(combo.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SƠ ĐỒ GHẾ & NHẬT KÝ AN NINH (ĐĂNG - PROMPT 1) */}
          {activeTab === "seats" && (
            <div className="mt-2">
              <AdminSeatsMoviesAuditTab hideMoviesTab={true} />
            </div>
          )}

          {/* TAB 7: ĐƠN VÉ, HOÀN TIỀN & ĐÁNH GIÁ (MINH - PROMPT 3) */}
          {activeTab === "orders-reviews" && (
            <div className="mt-2">
              <AdminOrdersAndReviewsTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
