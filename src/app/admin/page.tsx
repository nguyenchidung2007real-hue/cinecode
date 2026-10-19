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
} from "lucide-react";
import AdminSeatsMoviesAuditTab from "@/components/admin/AdminSeatsMoviesAuditTab";
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

  // Tải cài đặt thông báo phát sóng từ Server Store
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data?.data?.announcement) {
          setAnnouncementSettings(data.data.announcement);
        }
      })
      .catch(() => {});
  }, []);

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

  const toggleHalloweenTheme = () => {
    const next = !isHalloween;
    setIsHalloween(next);
    try {
      localStorage.setItem("cinemax_admin_theme", next ? "halloween" : "normal");
    } catch (e) {
      console.error(e);
    }
  };

  // Thống kê giả lập
  const [stats, setStats] = useState({
    todayRevenue: 8450000,
    ticketsSold: 112,
    occupancyRate: "78%",
    activeShowtimes: 8,
  });

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
        return;
      } else if (res.status === 409) {
        alert(data.error || "Phát hiện xung đột phòng chiếu từ server!");
        return;
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
              { id: "seats", label: "Sơ Đồ Ghế & Audit", icon: Armchair },
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
            {/* Halloween Theme Toggle Button */}
            <button
              onClick={toggleHalloweenTheme}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-lg ${
                isHalloween
                  ? "bg-gradient-to-r from-orange-600/30 to-purple-600/30 hover:from-orange-600/40 hover:to-purple-600/40 text-orange-300 border-orange-500/40 shadow-orange-500/20"
                  : "bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10"
              }`}
              title="Chuyển đổi giao diện Halloween 🎃 ⇄ Bình thường 🎬"
            >
              {isHalloween ? (
                <>
                  <span className="text-base">🎃</span>
                  <span className="text-xs font-black tracking-wide text-orange-400">Halloween Mode</span>
                </>
              ) : (
                <>
                  <span className="text-base">🎬</span>
                  <span className="text-xs font-semibold text-neutral-300">Normal Mode</span>
                </>
              )}
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

          {/* 4 Cards Thống Kê Tổng Quan (Glassmorphism + Sparklines + Operations Telemetry) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Thẻ 1: Doanh Thu Thực Tế vs Mục Tiêu */}
            <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
              isHalloween
                ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                : "bg-[#111625]/90 border-white/10 hover:border-amber-500/40 hover:shadow-[0_4px_24px_rgba(245,158,11,0.12)]"
            }`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Doanh thu hôm nay</span>
                <div className={`p-2 rounded-xl ${isHalloween ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{formatVND(stats.todayRevenue)}</div>
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span>KPI ngày: 12.000.000 ₫</span>
                  <span className="text-emerald-400 font-bold">70.4%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isHalloween ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-gradient-to-r from-amber-500 to-emerald-400"}`}
                    style={{ width: "70.4%" }}
                  />
                </div>
              </div>
            </div>

            {/* Thẻ 2: Vé Đã Bán Ra & Điểm Danh Khách */}
            <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
              isHalloween
                ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                : "bg-[#111625]/90 border-white/10 hover:border-red-500/40 hover:shadow-[0_4px_24px_rgba(229,9,20,0.12)]"
            }`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Vé đã xuất vé</span>
                <div className={`p-2 rounded-xl ${isHalloween ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-500"}`}>
                  <Ticket className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {stats.ticketsSold} <span className="text-sm font-normal text-neutral-400">vé</span>
              </div>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="text-neutral-400">Đã vào phòng: <strong className="text-emerald-400 font-mono">89/112</strong></span>
                <span className="text-red-400 font-semibold">Cao điểm: 19:15</span>
              </div>
            </div>

            {/* Thẻ 3: Doanh Số Bắp Nước F&B (Concessions) */}
            <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
              isHalloween
                ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                : "bg-[#111625]/90 border-white/10 hover:border-orange-500/40 hover:shadow-[0_4px_24px_rgba(249,115,22,0.12)]"
            }`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">F&B Bắp Nước (Concessions)</span>
                <div className={`p-2 rounded-xl ${isHalloween ? "bg-orange-500/20 text-orange-400" : "bg-orange-500/20 text-orange-400"}`}>
                  <Popcorn className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">3.240.000 ₫</div>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="text-neutral-400">Tỷ lệ gắn kèm (Attach Rate):</span>
                <span className="text-amber-400 font-bold">38.3%</span>
              </div>
            </div>

            {/* Thẻ 4: Tỷ Lệ Lấp Đầy Ghế */}
            <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden group shadow-lg ${
              isHalloween
                ? "bg-[#150B24]/90 border-orange-500/25 hover:border-orange-500/50 hover:shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
                : "bg-[#111625]/90 border-white/10 hover:border-emerald-500/40 hover:shadow-[0_4px_24px_rgba(16,185,129,0.12)]"
            }`}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tỷ lệ lấp đầy ghế</span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{stats.occupancyRate}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span>3 Phòng Chiếu Hoạt Động</span>
                  <span className="text-emerald-400 font-bold">Cao điểm</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isHalloween ? "bg-gradient-to-r from-purple-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}`}
                    style={{ width: "78%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: TỔNG QUAN RẠP & TRUNG TÂM ĐIỀU HÀNH */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* BỘ ĐIỀU KHIỂN PHÁT SÓNG TRỰC TIẾP LÊN TRANG KHÁCH (LIVE BROADCAST CONTROLLER) */}
              <div className={`p-5 sm:p-6 rounded-2xl border shadow-2xl relative overflow-hidden transition-all ${
                isHalloween
                  ? "bg-gradient-to-br from-[#1C0E32] to-[#120820] border-orange-500/30 shadow-orange-500/10"
                  : "bg-gradient-to-br from-[#181B26] to-[#11141D] border-white/10 shadow-black/40"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                      isHalloween ? "bg-orange-500/20 text-[#FF7518]" : "bg-red-500/20 text-[#E50914]"
                    }`}>
                      <Megaphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-white">
                          Bộ Điều Khiển Phát Sóng Lên Trang Khách Hàng (Live Announcement Banner)
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                          announcementSettings.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                            : "bg-neutral-500/20 text-neutral-400 border border-white/10"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${announcementSettings.enabled ? "bg-emerald-400" : "bg-neutral-500"}`} />
                          {announcementSettings.enabled ? "Đang phát sóng trực tiếp" : "Tạm dừng"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Mọi cập nhật tại đây hiển thị ngay trên thanh thông báo ở đầu website khách hàng (<code className="text-cyan-400 font-mono">/</code>) không cần reload trang.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAnnouncementSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        announcementSettings.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                          : "bg-neutral-800 text-neutral-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {announcementSettings.enabled ? "Bật Phát Sóng (ON)" : "Tắt Phát Sóng (OFF)"}
                    </button>

                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Xem Trang Khách</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  </div>
                </div>

                {/* Form chỉnh sửa nội dung thông báo */}
                <div className="pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Nội Dung Thông Báo Phát Sóng (Hiển thị đầu trang khách hàng)
                    </label>
                    <input
                      type="text"
                      value={announcementSettings.text}
                      onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Ví dụ: 🔥 Ưu đãi thành viên CineMax: Tặng ngay voucher bắp phô mai nóng hổi khi đặt vé qua website!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Loại Sự Kiện / Màu Sắc Banner
                      </label>
                      <select
                        value={announcementSettings.type}
                        onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="promo">🔥 Khuyến Mãi Rạp (Đỏ Điện Ảnh)</option>
                        <option value="alert">⚠️ Cảnh Báo / Suất Chiếu (Vàng Hổ Phách)</option>
                        <option value="event">🎪 Sự Kiện / Lễ Hội (Tím Huyền Bí)</option>
                        <option value="maintenance">🔧 Bảo Trì Kỹ Thuật (Xanh Lam)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Nhãn Nút Bấm Kêu Gọi (Action Text)
                      </label>
                      <input
                        type="text"
                        value={announcementSettings.actionText}
                        onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, actionText: e.target.value }))}
                        placeholder="Ví dụ: Xem Ưu Đãi"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                      >
                      </input>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Liên Kết Đích (Action URL)
                      </label>
                      <input
                        type="text"
                        value={announcementSettings.actionUrl}
                        onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, actionUrl: e.target.value }))}
                        placeholder="Ví dụ: #promo-section"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Customer Preview Strip */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold text-neutral-300">Xem Trước Giao Diện Khách Hàng (Live Preview):</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Real-time Header Strip</span>
                    </div>
                    <div className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 text-center transition-all ${
                      announcementSettings.type === "alert"
                        ? "bg-amber-950/70 text-amber-200 border border-amber-500/30"
                        : announcementSettings.type === "event"
                        ? "bg-purple-950/70 text-purple-200 border border-purple-500/30"
                        : announcementSettings.type === "maintenance"
                        ? "bg-blue-950/70 text-blue-200 border border-blue-500/30"
                        : "bg-red-950/70 text-red-100 border border-red-500/30"
                    }`}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10">
                        {announcementSettings.type === "alert" ? "⚠️ Cảnh Báo" : announcementSettings.type === "event" ? "🎪 Sự Kiện" : announcementSettings.type === "maintenance" ? "🔧 Bảo Trì" : "🔥 Khuyến Mãi"}
                      </span>
                      <span className="truncate">{announcementSettings.text || "(Chưa nhập nội dung)"}</span>
                      {announcementSettings.actionText && (
                        <span className="font-bold underline text-white ml-1">{announcementSettings.actionText} →</span>
                      )}
                    </div>
                  </div>

                  {/* Action & Feedback */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    {announcementSaveSuccess ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Đã đồng bộ lên hệ thống máy chủ và phát trực tiếp tới trang khách!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">
                        * Nhấn nút bên phải để ghi đè cài đặt vào máy chủ rạp và cập nhật trang khách hàng ngay lập tức.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveAnnouncement}
                      disabled={isSavingAnnouncement}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 ${
                        isHalloween
                          ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20"
                          : "bg-gradient-to-r from-[#E50914] to-rose-600 hover:from-[#c81007] hover:to-rose-700 shadow-red-900/30"
                      }`}
                    >
                      <Radio className={`w-4 h-4 ${isSavingAnnouncement ? "animate-spin" : ""}`} />
                      <span>{isSavingAnnouncement ? "Đang Bắn Thông Báo..." : "🚀 Lưu & Bắn Lên Trang Khách Ngay"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LƯỚI CHI TIẾT VẬN HÀNH PHÒNG CHIẾU & QUẦY VÉ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái (2 phần): Trạng thái 3 phòng chiếu thời gian thực */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`p-5 rounded-2xl border shadow-xl ${
                    isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${isHalloween ? "text-[#FF7518]" : "text-[#E50914]"}`} />
                          <span>Trung Tâm Điều Hành 3 Phòng Chiếu Tại HITC Xuân Thủy</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Theo dõi thời gian chiếu thực tế, đếm ngược tan phòng và chuẩn bị buffer vệ sinh 15 phút.
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                        3 Phòng Hoạt Động
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Phòng 1 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isHalloween ? "bg-purple-950/20 border-orange-500/20 hover:border-orange-500/40" : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
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
                          <div className="text-right">
                            <span className="text-xs text-neutral-300 font-mono font-bold">72/90 ghế (80%)</span>
                            <div className="text-[11px] text-cyan-400 mt-0.5">Buffer dọn buồng: 15p</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHalloween ? "bg-gradient-to-r from-purple-500 to-orange-500" : "bg-gradient-to-r from-[#E50914] to-amber-500"
                            }`}
                            style={{ width: "80%" }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                          <span>Đội dọn buồng: Chuẩn bị vào ca lúc 21:30</span>
                          <span className="text-emerald-400 font-medium">Chiếu ổn định</span>
                        </div>
                      </div>

                      {/* Phòng 2 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isHalloween ? "bg-purple-950/20 border-orange-500/20 hover:border-orange-500/40" : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">Phòng Beta 02 (Laser HD - Atmos)</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse">
                                Trailer & Đón Khách (Còn 8p)
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              Phim: <strong className="text-white">Quật Mộ Trùng Ma</strong> • Suất: <span className="text-amber-400 font-semibold">20:00 – 22:15</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-neutral-300 font-mono font-bold">76/84 ghế (90%)</span>
                            <div className="text-[11px] text-emerald-400 mt-0.5">76 khách đã vào</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHalloween ? "bg-gradient-to-r from-purple-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                            }`}
                            style={{ width: "90%" }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                          <span>Cửa phòng: Đang mở đón khách</span>
                          <span className="text-amber-400 font-medium">Bắt đầu lúc 20:00</span>
                        </div>
                      </div>

                      {/* Phòng 3 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isHalloween ? "bg-purple-950/20 border-orange-500/20 hover:border-orange-500/40" : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">Phòng Beta 03 (Standard)</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                                Đang Mở Bán Online
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              Phim: <strong className="text-white">Những Mảnh Ghép Cảm Xúc 2</strong> • Suất: <span className="text-amber-400 font-semibold">21:15 – 22:50</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-neutral-300 font-mono font-bold">45/70 vé (64%)</span>
                            <div className="text-[11px] text-cyan-400 mt-0.5">Còn 25 ghế</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHalloween ? "bg-gradient-to-r from-purple-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-emerald-500"
                            }`}
                            style={{ width: "64%" }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                          <span>Hệ thống đặt vé: Mở bán trực tuyến</span>
                          <span className="text-neutral-400 font-medium">Suất kế tiếp</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* THỐNG KÊ QUẦY BẮP NƯỚC F&B CONCESSIONS */}
                  <div className={`p-5 rounded-2xl border ${
                    isHalloween
                      ? "bg-gradient-to-br from-orange-500/10 via-[#140B22] to-[#140B22] border-orange-500/25"
                      : "bg-gradient-to-br from-orange-500/10 via-[#14151B] to-[#14151B] border-orange-500/20"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isHalloween ? "bg-orange-500/20 text-[#FF7518]" : "bg-orange-500/20 text-orange-400"
                      }`}>
                        <Popcorn className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">Doanh Số Quầy Bắp Nước Concession</h4>
                          <span className="text-xs font-bold text-amber-400">3.240.000 ₫ (38.3% doanh thu)</span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                          Top món bán chạy nhất: <strong className="text-white">Beta Combo Bắp Phô Mai 60oz + 2 Coke</strong> (48 phần) & <strong className="text-white">Sweetbox Couple Bắp Caramel</strong> (29 phần). Tồn kho bắp hạt và phô mai nóng đảm bảo phục vụ 100% cho khung giờ cao điểm tối nay.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Cổng Soát Vé PWA & HMAC Check-in */}
                <div className={`p-5 rounded-2xl border shadow-xl space-y-4 ${
                  isHalloween ? "bg-[#140B22] border-orange-500/20" : "bg-[#14151B] border-white/10"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isHalloween ? "bg-orange-500/20 text-[#FF7518]" : "bg-[#E50914]/20 text-[#E50914]"
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Cổng Soát Vé & Điểm Danh Khách</h3>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Chống vé kép & gian lận nguyên tử
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Hệ thống soát vé quét mã QR qua PWA Scanner của nhân viên tại cửa rạp. Ngăn chặn tuyệt đối tình trạng quét 2 lần hoặc vé giả mạo.
                  </p>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-neutral-300">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Khách đã quét QR:</span>
                      <span className="font-bold text-emerald-400 font-mono">89 / 112 khách</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Phương thức:</span>
                      <span className="font-semibold text-white">Camera QR Real-time</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Bảo mật nguyên tử:</span>
                      <span className="text-amber-400 font-mono text-[11px]">HMAC SHA-256</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Trạng thái cổng:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Đang mở soát vé
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/staff/scanner"
                    className={`w-full py-3 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 group ${
                      isHalloween
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20"
                        : "bg-gradient-to-r from-[#E50914] to-rose-600 hover:from-[#c81007] hover:to-rose-700 shadow-red-900/30"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mở Máy Quét Vé /staff/scanner</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
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
              <AdminSeatsMoviesAuditTab />
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
