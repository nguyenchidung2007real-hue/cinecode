"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  Building2,
  Ticket,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Film,
  Users,
  Lock,
  Popcorn,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Check,
  Tv,
  Eye,
  AlertCircle,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

// Web Audio API Synthesizer cho nhân viên soát vé
class StaffAudioFeedback {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  playWarning() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
}

const audio = new StaffAudioFeedback();

export default function StaffPortalPage() {
  const [activeTab, setActiveTab] = useState<"lookup" | "concessions" | "rooms">("lookup");
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  // Trạng thái giao F&B
  const [servedItems, setServedItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    audio.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim();
    if (!clean) return;

    setIsLookingUp(true);
    setLookupError(null);
    setActionSuccess(null);
    setTicketResult(null);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success && data.ticket) {
        setTicketResult(data.ticket);
        if (data.ticket.status === "valid") {
          audio.playSuccess();
        } else {
          audio.playWarning();
        }
      } else {
        setLookupError(data.error || "Không tìm thấy vé trong hệ thống.");
        audio.playWarning();
      }
    } catch {
      setLookupError("Lỗi kết nối tra cứu vé.");
      audio.playWarning();
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCheckInNow = async () => {
    if (!ticketResult) return;
    setIsCheckingIn(true);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ticketResult.token || ticketResult.bookingId,
          scannedBy: "Cửa Rạp #01 (Staff Portal)",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTicketResult((prev: any) => ({
          ...prev,
          status: "used",
          usedAt: new Date().toISOString(),
          scannedBy: "Cửa Rạp #01 (Staff Portal)",
        }));
        setActionSuccess("Xác nhận soát vé thành công! Khách hàng đã được phép vào phòng.");
        audio.playSuccess();
      } else {
        setLookupError(data.error || "Không thể thực hiện check-in.");
        audio.playWarning();
      }
    } catch {
      setLookupError("Lỗi kết nối máy chủ check-in.");
      audio.playWarning();
    } finally {
      setIsCheckingIn(false);
    }
  };

  const toggleServed = (key: string) => {
    setServedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-neutral-100 flex flex-col font-sans selection:bg-[#e71a0f] selection:text-white">
      {/* 1. Header Nhân Viên Rạp Chiếu Phim Chuẩn CGV Cultureplex */}
      <header className="border-b border-white/10 bg-[#12141c]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span className="hidden sm:inline">Về Trang Chủ</span>
            </Link>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e71a0f] to-amber-500 flex items-center justify-center shadow-lg shadow-[#e71a0f]/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white">CINEMAX CULTUREPLEX</span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#e71a0f]/20 text-[#ff4d42] border border-[#e71a0f]/40 uppercase tracking-wider">
                  STAFF GATE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Phân Hệ Vận Hành Cửa Rạp, Soát Vé HMAC & Quầy Concession
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Đồng hồ trực tiếp */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-amber-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTime || "19:00:00"}</span>
            </div>

            {/* Bật / tắt âm thanh Synth */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Tắt âm thanh báo" : "Bật âm thanh báo"}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-neutral-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Nút mở máy quét camera */}
            <Link
              href="/staff/scanner"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e71a0f] hover:bg-[#c81007] text-white text-xs font-extrabold shadow-md shadow-[#e71a0f]/25 transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mở Camera Scanner</span>
            </Link>

            {/* Sang trang Admin */}
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-colors font-semibold"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6 w-full">
        {/* Banner Tổng Quan Ca Trực */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171924] via-[#141620] to-[#1c1214] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                CA TRỰC TỐI (17:00 - 23:30) • HOẠT ĐỘNG
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              Bảng Điều Hành Cửa Rạp & Soát Vé Điện Tử
            </h1>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Xác thực vé QR chống trùng lặp nguyên tử, hỗ trợ khách tra cứu mã đơn thủ công và theo dõi danh sách F&B bắp nước cần giao.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Link
              href="/staff/scanner"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e71a0f] to-[#ff3b30] hover:from-[#c81007] hover:to-[#e71a0f] text-white text-xs font-black shadow-lg shadow-[#e71a0f]/30 transition-all transform active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Bật Máy Quét Vé Realtime</span>
            </Link>
          </div>
        </div>

        {/* 4 Thẻ Thống Kê Nhanh Ca Trực */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#13151f] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vé Đã Soát Vào Rạp</span>
              <Ticket className="w-4 h-4 text-[#e71a0f]" />
            </div>
            <div className="text-2xl font-black text-white">
              142 <span className="text-xs font-normal text-neutral-400">/ 180 vé</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "78.8%" }} />
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">78.8% Tỷ lệ check-in</span>
          </div>

          <div className="p-4 rounded-xl bg-[#13151f] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Suất Chiếu Kế Tiếp</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400">19:15</div>
            <p className="text-xs text-white font-bold line-clamp-1 mt-1">Dune: Phần Hai (Phòng 01)</p>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Đang mở cửa đón khách</span>
          </div>

          <div className="p-4 rounded-xl bg-[#13151f] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">F&B Chờ Lấy</span>
              <Popcorn className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black text-yellow-400">
              18 <span className="text-xs font-normal text-neutral-400">combo</span>
            </div>
            <span className="text-[10px] text-neutral-400 mt-2 block">Quầy Concession tầng 4</span>
          </div>

          <div className="p-4 rounded-xl bg-[#13151f] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">An Ninh Mã Vé</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <span className="text-[10px] text-emerald-300 font-bold mt-2 block">
              HMAC-SHA256 • 0 Vé giả mạo
            </span>
          </div>
        </div>

        {/* Thanh Chuyển Tab Công Việc */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
          {[
            { id: "lookup", label: "1. Tra Cứu & Soát Vé Cửa Rạp", icon: Ticket },
            { id: "concessions", label: "2. Quầy Bắp Nước F&B", icon: Popcorn },
            { id: "rooms", label: "3. Trạng Thái Buồng Chiếu & Vệ Sinh", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? "border-[#e71a0f] text-[#ff4d42] bg-[#e71a0f]/5"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TRA CỨU VÀ CHECK-IN VÉ */}
        {activeTab === "lookup" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#13151f] border border-white/10 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#e71a0f]" />
                    <span>Tra Cứu Mã Vé Thủ Công (Khách Hết Pin / Không Có QR)</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Nhập mã đơn vé (VD: <code className="text-amber-400 font-mono">bk-a3f6de0923a7</code>) hoặc chuỗi token vé để kiểm tra tính hợp lệ và xác nhận cho khách vào phòng chiếu.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="Nhập mã đơn đặt vé (bk-...) hoặc quét barcode..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#e71a0f] font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp || !lookupQuery.trim()}
                  className="px-6 py-3 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] font-black text-xs uppercase tracking-wider text-white disabled:opacity-50 transition-all shadow-md shadow-[#e71a0f]/20 flex items-center justify-center gap-2"
                >
                  {isLookingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isLookingUp ? "Đang Tra Cứu..." : "Kiểm Tra Vé"}</span>
                </button>
              </form>

              {/* Thông báo lỗi */}
              {lookupError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="font-semibold">{lookupError}</span>
                </div>
              )}

              {/* Thông báo thành công */}
              {actionSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-bold">{actionSuccess}</span>
                </div>
              )}

              {/* Kết quả chi tiết vé tìm thấy */}
              {ticketResult && (
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-5 animate-in fade-in">
                  <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-neutral-400">MÃ ĐƠN:</span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {ticketResult.bookingId}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        {ticketResult.movieTitle}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Khách hàng: <strong className="text-white">{ticketResult.customerName || "Khách Vãng Lai"}</strong> • SĐT: {ticketResult.customerPhone || "0987****321"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-3 py-1.5 text-xs font-black rounded-lg border uppercase tracking-wider ${
                          ticketResult.status === "valid"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse"
                            : ticketResult.status === "used"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}
                      >
                        {ticketResult.status === "valid"
                          ? "✓ HỢP LỆ (CHƯA SOÁT)"
                          : ticketResult.status === "used"
                          ? "⚠ ĐÃ SOÁT VÀO PHÒNG"
                          : "✕ ĐÃ HỦY / HẾT HẠN"}
                      </span>

                      {ticketResult.status === "valid" && (
                        <button
                          type="button"
                          onClick={handleCheckInNow}
                          disabled={isCheckingIn}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isCheckingIn ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{isCheckingIn ? "Đang Xử Lý..." : "Xác Nhận Cho Vào Phòng"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4 Khối thông tin chi tiết */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Phòng & Định Dạng:</span>
                      <span className="font-extrabold text-white mt-0.5 block">{ticketResult.roomName}</span>
                      <span className="text-[10px] text-cyan-400">{ticketResult.format || "2D Phụ Đề"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Suất Chiếu:</span>
                      <span className="font-black text-amber-400 text-sm mt-0.5 block">{ticketResult.showTime}</span>
                      <span className="text-[10px] text-neutral-400">{ticketResult.showDate}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Ghế Ngồi Đã Chọn:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ticketResult.seats && ticketResult.seats.map((seat: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#e71a0f]/20 border border-[#e71a0f]/40 text-[#ff6b62] font-black text-xs"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Tổng Thanh Toán:</span>
                      <span className="font-black text-white text-sm mt-0.5 block">
                        {formatVND(ticketResult.totalAmount)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Đã thanh toán Online</span>
                    </div>
                  </div>

                  {/* Chi tiết bắp nước kèm theo */}
                  {ticketResult.concessions && ticketResult.concessions.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-black uppercase text-[11px]">
                        <Popcorn className="w-4 h-4" />
                        <span>Combo Bắp Nước F&B Đã Mua Kèm:</span>
                      </div>
                      <div className="space-y-1.5">
                        {ticketResult.concessions.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-neutral-200 bg-black/20 p-2 rounded-lg">
                            <span className="font-bold">• {c.name}</span>
                            <span className="text-amber-300 font-black">Số lượng: {c.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HÀNG ĐỢI BẮP NƯỚC F&B TẠI QUẦY */}
        {activeTab === "concessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Popcorn className="w-5 h-5 text-amber-400" />
                  <span>Danh Sách Đơn Bắp Nước Chờ Giao (Concession Pickup Queue)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Nhân viên quầy tick vào nút "Đã Giao" khi đã chuẩn bị xong bắp nóng và nước ngọt cho khách.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "FNB-001", order: "bk-a3f6de0923a7", customer: "Trần Bảo Nam (0912****88)", items: "1x CineMax Combo Solo (Bắp phô mai + Coca Lớn)", time: "18:50", room: "Phòng 01" },
                { id: "FNB-002", order: "bk-c8209bb410d2", customer: "Nguyễn Thu Hà (0988****12)", items: "1x Combo Couple 2 Ngăn (Bắp ngọt + Bắp caramel + 2 Trà đào)", time: "18:52", room: "Phòng 02" },
                { id: "FNB-003", order: "bk-e14820dc7a91", customer: "Lê Hoàng Phúc (0904****55)", items: "2x Bắp phô mai cỡ lớn + 2 Sprite", time: "18:55", room: "Phòng 01" },
                { id: "FNB-004", order: "bk-7b901f4c2e88", customer: "Vũ Mai Anh (0971****39)", items: "1x CineMax Party Combo (4 Nước + 2 Bắp rang bơ)", time: "18:58", room: "Phòng 03" },
              ].map((item) => {
                const isDone = !!servedItems[item.id];
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDone
                        ? "bg-white/5 border-white/5 opacity-60"
                        : "bg-[#13151f] border-amber-500/30 shadow-lg shadow-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                            {item.id}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">{item.order}</span>
                          <span className="text-[10px] font-bold text-amber-400">{item.room}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-white mt-1.5">{item.items}</h4>
                        <p className="text-xs text-neutral-400 mt-1">
                          Khách: <strong className="text-neutral-200">{item.customer}</strong> • Đặt lúc {item.time}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleServed(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          isDone
                            ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                            : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 active:scale-95"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? "Đã Giao" : "Giao Bắp"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TRẠNG THÁI BUỒNG CHIẾU */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>Trạng Thái Buồng Chiếu & Chu Kỳ Vệ Sinh (Cleaning & Showtimes)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Quy định rạp: Sau mỗi suất chiếu có 15 phút dọn dẹp vệ sinh phòng + 10 phút chiếu trailer/quảng cáo trước khi phim bắt đầu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  room: "Phòng Beta 01 (Dolby 7.1)",
                  type: "Standard & VIP (90 ghế)",
                  status: "Sắp Bắt Đầu",
                  statusColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  movie: "Dune: Phần Hai (166p)",
                  time: "18:45 - 21:30",
                  action: "Đang soát vé cửa phòng",
                },
                {
                  room: "Phòng Beta 02 (Laser HD)",
                  type: "ScreenX Experience (90 ghế)",
                  status: "Đang Dọn Dẹp",
                  statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                  movie: "Quật Mộ Trùng Ma (134p)",
                  time: "19:15 - 21:30",
                  action: "Nhân viên đang khử trùng buồng chiếu (còn 6p)",
                },
                {
                  room: "Phòng Beta 03 (Standard)",
                  type: "Compact Cinema (70 ghế)",
                  status: "Đang Chiếu",
                  statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  movie: "Những Mảnh Ghép Cảm Xúc 2 (96p)",
                  time: "19:40 - 21:15",
                  action: "Cửa phòng đã đóng • Không nhận khách trễ",
                },
              ].map((r, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#13151f] border border-white/10 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{r.room}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border uppercase ${r.statusColor}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs">
                    <div className="text-neutral-400 text-[11px]">{r.type}</div>
                    <div className="font-bold text-white text-sm line-clamp-1">{r.movie}</div>
                    <div className="text-amber-400 font-mono font-bold">{r.time}</div>
                  </div>

                  <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{r.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
