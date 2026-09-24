"use client";

import React, { useState, useEffect } from "react";
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
  Users
} from "lucide-react";
import { MOCK_MOVIES, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "@/lib/mockData";
import { formatVND } from "@/lib/utils";

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

        {/* TAB 2: LỊCH CHIẾU BETA XUÂN THỦY */}
        {activeTab === "showtimes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Lịch Chiếu Hôm Nay Tại Beta Xuân Thủy</h3>
                <p className="text-xs text-neutral-400">Danh sách các suất chiếu đang mở bán trực tuyến</p>
              </div>
              <button
                onClick={handleSyncBeta}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cập nhật lịch mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_SHOWTIMES.filter((st) => st.cinemaId === "beta-cinemas-xuan-thuy").map((st) => {
                const movie = MOCK_MOVIES.find((m) => m.id === st.movieId);
                return (
                  <div key={st.id} className="p-4 rounded-xl bg-[#14151B] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-red/20 text-accent-red">
                          {st.format}
                        </span>
                        <span className="text-xs font-bold text-amber-400">{st.time}</span>
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{movie?.title || st.movieId}</h4>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{st.roomName}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Giá vé: 55k - 75k</span>
                      <span className="text-emerald-400 font-semibold">Đang mở bán</span>
                    </div>
                  </div>
                );
              })}
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
