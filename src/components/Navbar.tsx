"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Search, Ticket, User, Sparkles, MapPin, Compass, Bot, Phone } from "lucide-react";

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenMyTickets: () => void;
  ticketCount: number;
  onOpenAiChat: () => void;
  customerInfo?: { name: string; phone: string } | null;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenMyTickets,
  ticketCount,
  onOpenAiChat,
  customerInfo,
  selectedCity,
  onCityChange,
  onSearchChange,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all shadow-sm">
      {/* 1. Top Utility Bar - Dark Cinema Strip */}
      <div className="w-full bg-[#1c1c1c] text-neutral-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-[#e71a0f]" />
            Hotline CineMax: <strong className="text-white">1900 6017</strong> (8:00 - 22:00)
          </span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:inline text-neutral-300">
            Rạp trọng điểm: <strong className="text-[#e71a0f]">CineMax Bà Triệu</strong> & <strong className="text-[#e71a0f]">CineMax Landmark 81</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#promo-section"
            className="hidden sm:inline text-neutral-300 hover:text-[#e71a0f] font-medium transition-colors"
          >
            Tin Mới & Ưu Đãi
          </a>
          <span className="hidden sm:inline text-neutral-600">•</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-neutral-300 hover:text-[#e71a0f] font-medium transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#e71a0f]" />
            <span>{customerInfo ? `Thành viên: ${customerInfo.name}` : "Đăng ký / Đăng nhập CineMax"}</span>
          </Link>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-1 text-neutral-300 cursor-pointer hover:text-[#e71a0f]">
            <span>🇻🇳 VN</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar - CineMax Cultureplex Style */}
      <div className="w-full bg-[#fdfcf0]/95 backdrop-blur-md border-b border-[#e5e0d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between gap-4">
          
          {/* Logo CINEMAX */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e71a0f] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[#e71a0f]/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 leading-none">
                <span className="font-black text-2xl tracking-tighter text-[#1c1c1c]">CINE</span>
                <span className="font-black text-2xl tracking-tight text-[#e71a0f]">MAX</span>
                <span className="text-[10px] font-black text-white bg-[#e71a0f] px-1.5 py-0.5 rounded ml-0.5">AI</span>
              </div>
              <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                CULTUREPLEX • ĐIỆN ẢNH VƯỢT TRỘI
              </span>
            </div>
          </div>

          {/* Chọn Cụm Rạp CineMax */}
          <div className="hidden lg:flex items-center gap-2 bg-white border border-[#e5e0d8] px-3 py-1.5 rounded-xl text-xs text-slate-800 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#e71a0f]" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-white text-slate-900">📍 Tất cả cụm rạp CineMax</option>
              <option value="Hà Nội" className="bg-white text-slate-900">📍 CineMax Vincom Bà Triệu (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-white text-slate-900">📍 CineMax Landmark 81 (TP. HCM)</option>
              <option value="Hà Nội" className="bg-white text-slate-900">📍 CineMax Metropolis (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-white text-slate-900">📍 CineMax Sư Vạn Hạnh (TP. HCM)</option>
            </select>
          </div>

          {/* Menu Điều Hướng Rạp CineMax */}
          <nav className="hidden xl:flex items-center gap-7 text-xs font-black text-slate-800 tracking-wider uppercase">
            <a
              href="#commercial-tabs"
              className="hover:text-[#e71a0f] transition-colors py-1 border-b-2 border-transparent hover:border-[#e71a0f]"
            >
              Phim
            </a>
            <a
              href="#matrix-section"
              className="hover:text-[#e71a0f] transition-colors py-1 border-b-2 border-transparent hover:border-[#e71a0f]"
            >
              Lịch Chiếu
            </a>
            <a
              href="#special-cinema-section"
              className="hover:text-[#e71a0f] transition-colors py-1 border-b-2 border-transparent hover:border-[#e71a0f]"
            >
              Rạp Đặc Biệt
            </a>
            <a
              href="#price-table"
              className="hover:text-[#e71a0f] transition-colors py-1 border-b-2 border-transparent hover:border-[#e71a0f]"
            >
              Giá Vé
            </a>
            <a
              href="#promo-section"
              className="text-[#e71a0f] hover:text-[#c81007] transition-colors py-1 border-b-2 border-transparent hover:border-[#e71a0f]"
            >
              Ưu Đãi & Combo
            </a>
          </nav>

          {/* Search Spotlight & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Thanh tìm kiếm Spotlight */}
            <div className="w-40 sm:w-56 hidden md:block">
              <div
                onClick={onOpenSearch}
                className="relative flex items-center justify-between bg-white hover:bg-slate-50 text-xs text-slate-500 pl-8 pr-2.5 py-1.5 rounded-full border border-[#e5e0d8] hover:border-[#e71a0f] cursor-pointer transition-all group shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#e71a0f] absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                <span className="truncate text-[11px] text-slate-600 group-hover:text-slate-900">
                  Tìm phim, rạp CineMax...
                </span>
                <kbd className="inline-flex items-center text-[9px] font-mono font-bold text-slate-500 bg-slate-200/80 border border-slate-300 px-1 py-0.5 rounded">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Nút Tìm kiếm Mobile */}
            <button
              onClick={onOpenSearch}
              title="Tìm kiếm (Ctrl+K)"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#e5e0d8] text-slate-600 hover:text-[#e71a0f] shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-[#e71a0f]" />
            </button>

            {/* Nút Ví Vé Của Tôi */}
            <button
              onClick={onOpenMyTickets}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-[#e5e0d8] hover:border-[#e71a0f] text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-[#e71a0f]" />
              <span className="hidden sm:inline">Vé Của Tôi</span>
              {ticketCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#e71a0f] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {ticketCount}
                </span>
              )}
            </button>

            {/* Nút Trợ Lý - Chỉ hình icon Robot, không chữ, không icon sấm sét */}
            <button
              onClick={onOpenAiChat}
              aria-label="Trợ lý"
              title="Trợ lý đặt vé"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#e71a0f] hover:bg-[#c81007] text-white shadow-md shadow-red-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
            >
              <Bot className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
