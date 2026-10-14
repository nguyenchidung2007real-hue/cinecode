"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { formatVND } from "@/lib/utils";

export default function StaffPortalPage() {
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim();
    if (!clean) return;

    setIsLookingUp(true);
    setLookupError(null);
    setTicketResult(null);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success && data.ticket) {
        setTicketResult(data.ticket);
      } else {
        setLookupError(data.error || "Không tìm thấy vé trong hệ thống.");
      }
    } catch {
      setLookupError("Lỗi kết nối tra cứu vé.");
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-md shadow-sky-600/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-slate-900">CINEMAX STAFF PORTAL</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                  NHÂN VIÊN RẠP
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Beta Cinemas Xuân Thủy • Phân hệ Vận hành & Soát vé</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors font-medium"
            >
              Về Trang Chủ
            </Link>
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors font-medium"
            >
              Quản Trị Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8 w-full">
        {/* Banner Chào Mừng */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Hệ Thống Phục Vụ & Soát Vé Cửa Rạp</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Kiểm tra tính hợp lệ vé điện tử, xác thực mã QR bảo mật HMAC-SHA256 và quản lý check-in vào phòng chiếu.
            </p>
          </div>
          <Link
            href="/staff/scanner"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 font-bold text-sm text-white shadow-md shadow-sky-600/25 transition-all shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Mở Máy Quét /staff/scanner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Thẻ Tính Năng Chính */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Scanner */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:border-sky-300 shadow-sm transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. Máy Soát Vé QR Scanner</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ứng dụng quét camera thời gian thực, cảnh báo âm thanh Synth, nhận diện vé đã dùng, vé giả mạo hoặc vé sai ngày chiếu.
              </p>
            </div>
            <Link
              href="/staff/scanner"
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:underline pt-2"
            >
              <span>Truy cập máy quét ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Tra cứu vé */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:border-sky-300 shadow-sm transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Tra Cứu Vé & Bắp Nước</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tra cứu thông tin theo mã đơn (bookingId), kiểm tra danh sách ghế, combo bắp nước F&B khách đã mua và trạng thái thanh toán.
              </p>
            </div>
            <a
              href="#lookup-section"
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:underline pt-2"
            >
              <span>Tra cứu trực tiếp bên dưới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3: Admin Dashboard */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:border-sky-300 shadow-sm transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Quản Trị & Sơ Đồ Rạp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xem sơ đồ 102 ghế, khóa ghế bảo trì, giải phóng ghế ảo, xếp lịch suất chiếu và thống kê doanh thu phòng chiếu HITC.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:underline pt-2"
            >
              <span>Đến trang Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Khu vực Tra Cứu Vé Nhanh */}
        <div id="lookup-section" className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-600" />
                <span>Tra Cứu Nhanh Thông Tin Vé Khách Hàng</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dành cho nhân viên kiểm tra thủ công khi điện thoại khách hết pin, màn hình vỡ hoặc mã QR không quét được.
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Nhập mã đơn vé (VD: bk-a3f6de0923a7 hoặc mã token)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isLookingUp || !lookupQuery.trim()}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 font-bold text-sm text-white disabled:opacity-50 transition-colors shadow-md shadow-sky-600/20"
            >
              {isLookingUp ? "Đang Tra Cứu..." : "Kiểm Tra Vé"}
            </button>
          </form>

          {/* Lỗi tra cứu */}
          {lookupError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Chi tiết vé tìm thấy */}
          {ticketResult && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-mono text-slate-500">MÃ ĐƠN: {ticketResult.bookingId}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{ticketResult.movieTitle}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                    ticketResult.status === "valid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : ticketResult.status === "used"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  TRẠNG THÁI: {ticketResult.status?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Cụm rạp & Phòng:</span>
                  <span className="font-semibold text-slate-900">{ticketResult.roomName}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Suất chiếu:</span>
                  <span className="font-semibold text-slate-900">
                    {ticketResult.showTime} • {ticketResult.showDate}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Danh sách ghế:</span>
                  <span className="font-bold text-sky-600">{ticketResult.seats?.join(", ")}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Tổng tiền đơn:</span>
                  <span className="font-bold text-slate-900">{formatVND(ticketResult.totalAmount)}</span>
                </div>
              </div>

              {ticketResult.concessions && ticketResult.concessions.length > 0 && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Bắp Nước F&B Kèm Theo:</span>
                  <div className="space-y-1">
                    {ticketResult.concessions.map((c: any, i: number) => (
                      <div key={i} className="text-slate-700">
                        • {c.name} (x{c.quantity})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
