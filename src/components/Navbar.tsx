"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Search, Ticket, User, MapPin, Phone, Megaphone, AlertTriangle, Sparkles, X, ChevronRight } from "lucide-react";

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenMyTickets: () => void;
  ticketCount: number;
  onOpenAiChat?: () => void;
  customerInfo?: { name: string; phone: string } | null;
  announcement?: {
    enabled: boolean;
    text: string;
    type: "promo" | "alert" | "event" | "maintenance";
    actionText?: string;
    actionUrl?: string;
  } | null;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenMyTickets,
  ticketCount,
  customerInfo,
  announcement,
  selectedCity,
  onCityChange,
  onSearchChange,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phím tắt bí mật cho Quản trị viên: Ctrl + Shift + A (hoặc Cmd + Shift + A trên Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        window.location.href = "/admin";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  const showAnnouncement = announcement?.enabled && !!announcement?.text && !isAnnouncementDismissed;

  return (
    <header className="sticky top-0 z-40 w-full -mb-[97px] transition-all">
      {/* 0. Live Admin Broadcast Banner (Cập nhật trực tiếp từ Admin Dashboard) */}
      {showAnnouncement && (
        <div
          className={`w-full py-1.5 px-4 text-xs font-medium flex items-center justify-between gap-3 border-b shadow-lg transition-all backdrop-blur-md ${
            announcement.type === "alert"
              ? "bg-amber-950/90 text-amber-200 border-amber-500/40"
              : announcement.type === "event"
              ? "bg-purple-950/90 text-purple-200 border-purple-500/40"
              : announcement.type === "maintenance"
              ? "bg-blue-950/90 text-blue-200 border-blue-500/40"
              : "bg-red-950/90 text-red-100 border-red-500/40"
          }`}
        >
          <div className="flex-1 flex items-center justify-center gap-2.5 text-center flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 border border-white/20">
              {announcement.type === "alert" ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> CẢNH BÁO
                </>
              ) : announcement.type === "event" ? (
                <>
                  <Sparkles className="w-3 h-3 text-purple-300" /> SỰ KIỆN ĐẶC BIỆT
                </>
              ) : (
                <>
                  <Megaphone className="w-3 h-3 text-red-400 animate-pulse" /> THÔNG BÁO RẠP
                </>
              )}
            </span>
            <span className="font-semibold text-white/90">{announcement.text}</span>
            {announcement.actionText && announcement.actionUrl && (
              <a
                href={announcement.actionUrl}
                className="inline-flex items-center gap-1 font-bold text-white underline hover:no-underline ml-1.5 hover:text-red-300 transition-colors"
              >
                {announcement.actionText} <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAnnouncementDismissed(true)}
            aria-label="Đóng thông báo"
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Top Utility Bar - Dark Cinema Strip */}
      <div className="w-full bg-black/50 backdrop-blur-sm text-[#9CA3AF] text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#9CA3AF] font-medium">
            <Phone className="w-3.5 h-3.5 text-[#E50914]" />
            Hotline CineMax: <strong className="text-white">1900 6017</strong> (8:00 - 22:00)
          </span>
          <span className="hidden md:inline text-white/20">|</span>
          <span className="hidden md:inline text-[#9CA3AF]">
            Rạp trọng điểm: <strong className="text-[#E50914]">CineMax Bà Triệu</strong> & <strong className="text-[#E50914]">CineMax Landmark 81</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#promo-section"
            className="hidden sm:inline text-[#9CA3AF] hover:text-[#E50914] font-medium transition-colors"
          >
            Tin Mới & Ưu Đãi
          </a>
          <span className="hidden sm:inline text-white/20">•</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#E50914] font-medium transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#E50914]" />
            <span>{customerInfo ? `Thành viên: ${customerInfo.name}` : "Đăng ký / Đăng nhập CineMax"}</span>
          </Link>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1 text-[#9CA3AF] cursor-pointer hover:text-[#E50914]">
            <span>🇻🇳 VN</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar - Dark Mode Cinematic Style */}
      <div className="w-full bg-black/60 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo CINEMAX (Đã bỏ nhãn chữ AI) */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#E50914] to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center leading-none">
                <span className="font-black text-2xl tracking-tighter text-white">CINE</span>
                <span className="font-black text-2xl tracking-tight text-[#E50914]">MAX</span>
              </div>
              <span className="block text-[8px] text-[#9CA3AF] font-bold uppercase tracking-wider mt-0.5">
                CULTUREPLEX • ĐIỆN ẢNH VƯỢT TRỘI
              </span>
            </div>
          </div>

          {/* Chọn Cụm Rạp CineMax */}
          <div className="hidden lg:flex items-center gap-2 bg-[#12141C] border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#E50914]" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-[#12141C] text-white">📍 Tất cả cụm rạp CineMax</option>
              <option value="Hà Nội" className="bg-[#12141C] text-white">📍 CineMax Vincom Bà Triệu (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-[#12141C] text-white">📍 CineMax Landmark 81 (TP. HCM)</option>
              <option value="Hà Nội" className="bg-[#12141C] text-white">📍 CineMax Metropolis (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-[#12141C] text-white">📍 CineMax Sư Vạn Hạnh (TP. HCM)</option>
            </select>
          </div>

          {/* Menu Điều Hướng Rạp CineMax */}
          <nav className="hidden xl:flex items-center gap-7 text-xs font-black text-white/90 tracking-wider uppercase">
            <a
              href="#commercial-tabs"
              className="text-[#9CA3AF] hover:text-white transition-colors py-1 border-b-2 border-transparent hover:border-[#E50914]"
            >
              Phim
            </a>
            <a
              href="#matrix-section"
              className="text-[#9CA3AF] hover:text-white transition-colors py-1 border-b-2 border-transparent hover:border-[#E50914]"
            >
              Lịch Chiếu
            </a>
            <a
              href="#special-cinema-section"
              className="text-[#9CA3AF] hover:text-white transition-colors py-1 border-b-2 border-transparent hover:border-[#E50914]"
            >
              Rạp Đặc Biệt
            </a>
            <a
              href="#price-table"
              className="text-[#9CA3AF] hover:text-white transition-colors py-1 border-b-2 border-transparent hover:border-[#E50914]"
            >
              Giá Vé
            </a>
            <a
              href="#promo-section"
              className="text-[#F5C518] hover:text-[#E50914] transition-colors py-1 border-b-2 border-transparent hover:border-[#E50914]"
            >
              Ưu Đãi & Combo
            </a>
          </nav>

          {/* Search Spotlight & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Thanh tìm kiếm Spotlight (Đã bỏ ký hiệu phím tắt Ctrl K) */}
            <div className="w-44 sm:w-60 hidden md:block">
              <div
                onClick={onOpenSearch}
                className="relative flex items-center justify-between bg-[#12141C] hover:bg-[#161922] text-xs text-[#9CA3AF] pl-8 pr-3 py-2 rounded-lg border border-white/10 hover:border-[#E50914] cursor-pointer transition-all group shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E50914] absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                <span className="truncate text-[11px] text-[#9CA3AF] group-hover:text-white">
                  Tìm phim, rạp CineMax...
                </span>
              </div>
            </div>

            {/* Nút Tìm kiếm Mobile */}
            <button
              onClick={onOpenSearch}
              title="Tìm kiếm phim"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-[#12141C] border border-white/10 text-white hover:text-[#E50914] shadow-sm"
            >
              <Search className="w-4 h-4 text-[#E50914]" />
            </button>

            {/* Nút Ví Vé Của Tôi (Đã bỏ nút robot bên cạnh) */}
            <button
              onClick={onOpenMyTickets}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#12141C] hover:bg-[#161922] border border-white/10 hover:border-[#E50914] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden sm:inline">Vé Của Tôi</span>
              {ticketCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#E50914] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {ticketCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
