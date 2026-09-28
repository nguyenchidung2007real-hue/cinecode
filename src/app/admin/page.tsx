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
} from "lucide-react";
import { MOCK_MOVIES, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "@/lib/mockData";
import { formatVND } from "@/lib/utils";
import { checkShowtimeCollision, ShowtimeLike, CollisionResult, TRAILER_MINUTES, CLEANING_MINUTES } from "@/lib/showtimeCollision";
import { ShowTime } from "@/types";

interface SyncStatus {
  success: boolean;
  syncedAt: string;
  source: string;
  message: string;
  totalMovies: number;
  totalShowtimes: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "showtimes" | "movies" | "tickets" | "pricing">("overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Soát vé State
  const [ticketCodeInput, setTicketCodeInput] = useState("");
  const [checkInResult, setCheckInResult] = useState<{
    found: boolean;
    ticket?: any;
    message: string;
  } | null>(null);

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

  const handleAddShowtime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collisionResult.ok) return;

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

  const handleDeleteShowtime = (id: string) => {
    setShowtimesList((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSyncBeta = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-beta", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCodeInput.trim()) return;

    try {
      const stored = JSON.parse(localStorage.getItem("cinemax_tickets") || "[]");
      const matched = stored.find(
        (t: any) =>
          t.bookingCode?.toUpperCase() === ticketCodeInput.trim().toUpperCase() ||
          ticketCodeInput.includes(t.bookingCode)
      );

      if (matched) {
        setCheckInResult({
          found: true,
          ticket: matched,
          message: "Mã vé hợp lệ! Đã xác nhận khách hàng có mặt tại cổng rạp Beta Xuân Thủy.",
        });
      } else {
        setCheckInResult({
          found: false,
          message: `Không tìm thấy vé với mã "${ticketCodeInput}". Vui lòng kiểm tra lại.`,
        });
      }
    } catch {
      setCheckInResult({
        found: false,
        message: "Lỗi đọc dữ liệu vé rạp.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#14151B]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang Bán Vé</span>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-red to-amber-500 flex items-center justify-center shadow-lg shadow-accent-red/20">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white">BETA CINEMAS XUÂN THỦY</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent-red/20 text-accent-red border border-accent-red/30">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Tầng 4, Tòa nhà HITC, 239 Xuân Thủy, Cầu Giấy, Hà Nội</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncBeta}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-red/90 hover:bg-accent-red text-white transition-all shadow-md shadow-accent-red/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Đang Đồng Bộ..." : "Đồng Bộ Live betacinemas.vn"}</span>
            </button>
            <Link
              href="/dashboard"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-colors"
            >
              Xem Dashboard Khách
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6">
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

        {/* 4 Cards Thống Kê Tổng Quan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#14151B] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Doanh thu hôm nay</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{formatVND(stats.todayRevenue)}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
              <TrendingUp className="w-3 h-3" />
              <span>+18.5% so với hôm qua</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#14151B] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Vé đã bán (HITC)</span>
              <Ticket className="w-4 h-4 text-accent-red" />
            </div>
            <div className="text-2xl font-black text-white">{stats.ticketsSold} <span className="text-xs font-normal text-neutral-400">vé</span></div>
            <div className="text-[11px] text-neutral-400 mt-2">Hầu hết là suất 19:15 & 21:30</div>
          </div>

          <div className="p-4 rounded-xl bg-[#14151B] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Suất chiếu hoạt động</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.activeShowtimes} <span className="text-xs font-normal text-neutral-400">suất</span></div>
            <div className="text-[11px] text-cyan-400/80 mt-2">Phòng Beta 01, 02, 03</div>
          </div>

          <div className="p-4 rounded-xl bg-[#14151B] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium">Tỷ lệ lấp đầy ghế</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.occupancyRate}</div>
            <div className="text-[11px] text-emerald-400 mt-2">Tập trung khu vực ghế VIP</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Tổng Quan Rạp", icon: Building2 },
            { id: "showtimes", label: "Lịch Chiếu Beta Xuân Thủy", icon: Calendar },
            { id: "movies", label: "Quản Lý Phim", icon: Film },
            { id: "tickets", label: "Soát Vé & Check-in", icon: QrCode },
            { id: "pricing", label: "Bảng Giá Vé Sinh Viên", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? "border-accent-red text-accent-red bg-accent-red/5"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TỔNG QUAN RẠP */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Thông tin rạp & Trạng thái phòng */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-5 rounded-2xl bg-[#14151B] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent-red" />
                    <span>Trạng Thái Phòng Chiếu Tại HITC Xuân Thủy</span>
                  </h3>
                  <span className="text-xs text-neutral-400">3 Phòng đang mở</span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Phòng Beta 01 (Dolby 7.1)", movie: "Dune: Phần Hai", time: "18:45 - 21:30", seats: "72/90 ghế", status: "Sắp chiếu" },
                    { name: "Phòng Beta 02 (Laser HD)", movie: "Quật Mộ Trùng Ma", time: "19:15 - 21:30", seats: "84/90 ghế", status: "Đang mở bán" },
                    { name: "Phòng Beta 03 (Standard)", movie: "Những Mảnh Ghép Cảm Xúc 2", time: "19:40 - 21:15", seats: "45/70 ghế", status: "Đang mở bán" },
                  ].map((room, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-white">{room.name}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {room.movie} • <span className="text-amber-400">{room.time}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {room.status}
                        </span>
                        <div className="text-xs text-neutral-400 mt-1">{room.seats}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crawler Info Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-red/10 via-[#14151B] to-[#14151B] border border-accent-red/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-accent-red/20 text-accent-red">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Cơ Chế Đồng Bộ Tự Động (Cách 3)</h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      Hệ thống tự động kết nối và trích xuất lịch chiếu từ website chính thức <code>betacinemas.vn</code> cho chi nhánh Xuân Thủy. Khi rạp đổi giờ chiếu hoặc mở thêm phim mới, dữ liệu sẽ được cập nhật đồng thời vào Chatbot AI CineBot và Spotlight Command Palette.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Soát vé nhanh */}
            <div className="p-5 rounded-2xl bg-[#14151B] border border-white/10 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Soát Vé Nhanh Tại Cửa</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Nhập mã vé hoặc mã đặt chỗ (VD: VECINEMAX, BM-...) để kiểm tra và check-in khách:
              </p>

              <form onSubmit={handleVerifyTicket} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nhập mã vé (VD: BM-172717...)"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-accent-red"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-accent-red text-white text-xs font-bold hover:bg-accent-red/90 transition-colors shadow-lg shadow-accent-red/20"
                >
                  Xác Nhận Check-in
                </button>
              </form>

              {checkInResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    checkInResult.found
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {checkInResult.found ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{checkInResult.found ? "Hợp Lệ" : "Không Tìm Thấy"}</span>
                  </div>
                  <p>{checkInResult.message}</p>
                  {checkInResult.ticket && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-neutral-300 space-y-0.5">
                      <div>Phim: <strong>{checkInResult.ticket.movieTitle}</strong></div>
                      <div>Rạp: {checkInResult.ticket.cinemaName}</div>
                      <div>Ghế: <span className="text-amber-400 font-bold">{checkInResult.ticket.seats?.join(", ")}</span></div>
                    </div>
                  )}
                </div>
              )}
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
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Cập nhật lịch Live</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CỘT TRÁI (5 Cột): Form Thêm Suất Chiếu & Kiểm Tra Xung Đột */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-[#14151B] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-red" />
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
                          ? "bg-accent-red hover:bg-accent-red/90 text-white shadow-accent-red/20 cursor-pointer"
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
                            ? "bg-accent-red text-white"
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
                          className="p-4 rounded-xl bg-[#14151B] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-red/20 text-accent-red">
                                {st.format}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-amber-400">{st.time}</span>
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

        {/* TAB 3: QUẢN LÝ PHIM */}
        {activeTab === "movies" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Danh Sách Phim Chiếu Rạp ({MOCK_MOVIES.length})</h3>
              <div className="text-xs text-neutral-400">Tất cả phim đều có mặt tại Beta Xuân Thủy</div>
            </div>

            <div className="space-y-2.5">
              {MOCK_MOVIES.map((movie) => (
                <div key={movie.id} className="p-3.5 rounded-xl bg-[#14151B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={movie.posterPath} alt={movie.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">{movie.title}</h4>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {movie.durationMinutes} phút • {movie.genres.join(", ")} • <span className="text-amber-400">IMDb {movie.voteAverage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Đang Chiếu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SOÁT VÉ & CHECK-IN */}
        {activeTab === "tickets" && (
          <div className="p-6 rounded-2xl bg-[#14151B] border border-white/10 max-w-2xl mx-auto w-full space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-red/20 text-accent-red flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cổng Soát Vé - Beta Xuân Thủy</h3>
              <p className="text-xs text-neutral-400 mt-1">Dành cho nhân viên soát vé tại cửa phòng chiếu</p>
            </div>

            <form onSubmit={handleVerifyTicket} className="space-y-3">
              <label className="text-xs text-neutral-400 font-medium block">Mã vé điện tử (E-Ticket Code):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã vé hoặc quét QR..."
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-red"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-accent-red text-white text-xs font-bold hover:bg-accent-red/90 transition-colors"
                >
                  Kiểm Tra
                </button>
              </div>
            </form>

            {checkInResult && (
              <div
                className={`p-4 rounded-xl border text-sm ${
                  checkInResult.found
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <div className="font-bold flex items-center gap-2 mb-2">
                  {checkInResult.found ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span>{checkInResult.found ? "XÁC NHẬN VÉ HỢP LỆ" : "MÃ VÉ KHÔNG TỒN TẠI"}</span>
                </div>
                <p className="text-xs text-neutral-200">{checkInResult.message}</p>
                {checkInResult.ticket && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-neutral-300 space-y-1">
                    <div>Phim: <strong className="text-white">{checkInResult.ticket.movieTitle}</strong></div>
                    <div>Suất chiếu: {checkInResult.ticket.showTime} - {checkInResult.ticket.showDate}</div>
                    <div>Phòng chiếu: {checkInResult.ticket.roomName}</div>
                    <div>Ghế đã đặt: <strong className="text-amber-400">{checkInResult.ticket.seats?.join(", ")}</strong></div>
                    <div>Tổng tiền: {formatVND(checkInResult.ticket.totalAmount)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BẢNG GIÁ VÉ */}
        {activeTab === "pricing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[#14151B] border border-white/10 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent-red" />
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

            <div className="p-5 rounded-2xl bg-[#14151B] border border-white/10 space-y-4">
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
      </div>
    </div>
  );
}
