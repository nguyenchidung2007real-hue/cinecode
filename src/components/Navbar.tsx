"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Sparkles, Search, MapPin, Ticket, User, ShieldCheck, QrCode, Phone, ChevronDown } from "lucide-react";

interface NavbarProps {
  onSearchChange: (query: string) => void;
  onOpenAiChat: () => void;
  onOpenMyTickets: () => void;
  onOpenSearch?: () => void;
  ticketCount: number;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchChange,
  onOpenAiChat,
  onOpenMyTickets,
  onOpenSearch,
  ticketCount,
  selectedCity,
  onCityChange,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(null);

  React.useEffect(() => {
    try {
      const phone = localStorage.getItem("cinemax_customer_phone");
      const name = localStorage.getItem("cinemax_customer_name");
      if (phone) {
        setCustomerInfo({ phone, name: name || phone });
      }
    } catch {}
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all shadow-md">
      {/* 1. Top Utility Bar chuẩn Beta Cinemas */}
      <div className="w-full bg-[#07152E] text-slate-300 text-[11px] py-1 px-4 sm:px-6 lg:px-8 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Phone className="w-3 h-3 text-[#00B2FF]" />
            Hotline: <strong className="text-white">1900 636 807</strong> (9:00 - 22:00)
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            Rạp trọng điểm: <strong className="text-amber-400">Beta Cinemas Xuân Thủy (Hà Nội)</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-slate-200 hover:text-white font-medium"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>{customerInfo ? `Thành viên: ${customerInfo.name}` : "Đăng nhập Thành viên"}</span>
          </Link>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-slate-300 cursor-pointer hover:text-white">
            <span>🇻🇳 VN</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="w-full bg-[#0B2046]/95 backdrop-blur-md border-b border-[#034EA2]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Beta Cinemas */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#034EA2] via-[#00B2FF] to-[#FF5722] flex items-center justify-center shadow-lg shadow-[#034EA2]/50">
              <Film className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5722] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5722]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-white">
                  BETA<span className="text-[#00B2FF]">CINEMAS</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-[#FF5722] text-white flex items-center gap-0.5 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </div>
              <p className="text-[9px] text-blue-200 font-semibold tracking-wider uppercase">
                Rạp chiếu phim hiện đại & giá hợp lý
              </p>
            </div>
          </div>

          {/* Chọn Cụm Rạp */}
          <div className="hidden lg:flex items-center gap-2 bg-[#07152E]/90 border border-[#034EA2]/40 px-3 py-1.5 rounded-xl text-xs text-white shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-blue-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-[#0B2046] text-white">📍 Tất cả cụm rạp</option>
              <option value="Hà Nội" className="bg-[#0B2046] text-white">📍 Hà Nội - Beta Xuân Thủy</option>
              <option value="TP. Hồ Chí Minh" className="bg-[#0B2046] text-white">📍 TP. HCM - Beta Quang Trung</option>
            </select>
          </div>

          {/* Menu Điều Hướng Rạp Phim */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-bold text-slate-200 tracking-wide uppercase">
            <a
              href="#commercial-tabs"
              className="hover:text-[#00B2FF] transition-colors py-1 border-b-2 border-transparent hover:border-[#00B2FF]"
            >
              Lịch Chiếu
            </a>
            <a
              href="#commercial-tabs"
              className="hover:text-[#00B2FF] transition-colors py-1 border-b-2 border-transparent hover:border-[#00B2FF]"
            >
              Phim
            </a>
            <a
              href="#matrix-section"
              className="hover:text-[#00B2FF] transition-colors py-1 border-b-2 border-transparent hover:border-[#00B2FF]"
            >
              Rạp Chiếu
            </a>
            <a
              href="#price-table"
              className="hover:text-[#00B2FF] transition-colors py-1 border-b-2 border-transparent hover:border-[#00B2FF]"
            >
              Giá Vé
            </a>
            <a
              href="#promo-section"
              className="text-amber-300 hover:text-amber-200 transition-colors py-1 border-b-2 border-transparent hover:border-amber-400"
            >
              Combo 68k
            </a>
          </nav>

          {/* Search Spotlight & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Thanh tìm kiếm AI Spotlight */}
            <div className="w-40 sm:w-56 hidden md:block">
              <div
                onClick={onOpenSearch}
                className="relative flex items-center justify-between bg-[#07152E]/90 hover:bg-[#07152E] text-xs text-slate-400 pl-8 pr-2.5 py-1.5 rounded-full border border-[#034EA2]/50 hover:border-[#00B2FF] cursor-pointer transition-all group"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00B2FF] absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                <span className="truncate text-[11px] text-slate-300 group-hover:text-white">
                  Tìm phim, diễn viên...
                </span>
                <kbd className="inline-flex items-center text-[9px] font-mono font-bold text-slate-400 bg-black/40 border border-white/10 px-1 py-0.5 rounded">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Nút Tìm kiếm Mobile */}
            <button
              onClick={onOpenSearch}
              title="Tìm kiếm (Ctrl+K)"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-[#07152E] border border-[#034EA2]/50 text-slate-200 hover:text-white"
            >
              <Search className="w-3.5 h-3.5 text-[#00B2FF]" />
            </button>

            {/* Nút Ví Vé Của Tôi */}
            <button
              onClick={onOpenMyTickets}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#07152E] hover:bg-[#034EA2] border border-[#034EA2]/60 hover:border-[#00B2FF] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-[#FF5722]" />
              <span className="hidden sm:inline">Vé Của Tôi</span>
              {ticketCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF5722] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {ticketCount}
                </span>
              )}
            </button>

            {/* Nút Hỏi AI Chatbot */}
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#034EA2] to-[#00B2FF] hover:from-[#0070BA] hover:to-[#38B6FF] text-white text-xs font-black shadow-md shadow-[#034EA2]/40 transition-all transform hover:scale-105 active:scale-95 border border-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Hỏi CineBot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
