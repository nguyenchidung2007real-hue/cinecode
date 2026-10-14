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
    <header className="sticky top-0 z-40 w-full transition-all shadow-sm">
      {/* 1. Top Utility Bar */}
      <div className="w-full bg-slate-50 text-slate-600 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            Hotline: <strong className="text-slate-900">1900 636 807</strong> (9:00 - 22:00)
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-600">
            Rạp trọng điểm: <strong className="text-sky-600">Beta Cinemas Xuân Thủy (Hà Nội)</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-600 hover:text-sky-600 font-medium transition-colors"
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>{customerInfo ? `Thành viên: ${customerInfo.name}` : "Đăng nhập Thành viên"}</span>
          </Link>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1 text-slate-600 cursor-pointer hover:text-sky-600">
            <span>🇻🇳 VN</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Beta Cinemas */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="relative w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-md shadow-sky-600/30">
              <Film className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  BETA<span className="text-sky-600">CINEMAS</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-sky-500 text-white flex items-center gap-0.5 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                Rạp chiếu phim hiện đại & giá hợp lý
              </p>
            </div>
          </div>

          {/* Chọn Cụm Rạp */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-white text-slate-900">📍 Tất cả cụm rạp</option>
              <option value="Hà Nội" className="bg-white text-slate-900">📍 Hà Nội - Beta Xuân Thủy</option>
              <option value="TP. Hồ Chí Minh" className="bg-white text-slate-900">📍 TP. HCM - Beta Quang Trung</option>
            </select>
          </div>

          {/* Menu Điều Hướng Rạp Phim */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-600 tracking-wide uppercase">
            <a
              href="#commercial-tabs"
              className="hover:text-sky-600 transition-colors py-1 border-b-2 border-transparent hover:border-sky-500"
            >
              Lịch Chiếu
            </a>
            <a
              href="#commercial-tabs"
              className="hover:text-sky-600 transition-colors py-1 border-b-2 border-transparent hover:border-sky-500"
            >
              Phim
            </a>
            <a
              href="#matrix-section"
              className="hover:text-sky-600 transition-colors py-1 border-b-2 border-transparent hover:border-sky-500"
            >
              Rạp Chiếu
            </a>
            <a
              href="#price-table"
              className="hover:text-sky-600 transition-colors py-1 border-b-2 border-transparent hover:border-sky-500"
            >
              Giá Vé
            </a>
            <a
              href="#promo-section"
              className="text-sky-700 hover:text-sky-800 transition-colors py-1 border-b-2 border-transparent hover:border-sky-600"
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
                className="relative flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-xs text-slate-500 pl-8 pr-2.5 py-1.5 rounded-full border border-slate-200 hover:border-sky-400 cursor-pointer transition-all group shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                <span className="truncate text-[11px] text-slate-600 group-hover:text-slate-900">
                  Tìm phim, diễn viên...
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
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-600 shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-sky-600" />
            </button>

            {/* Nút Ví Vé Của Tôi */}
            <button
              onClick={onOpenMyTickets}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-sky-400 text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Vé Của Tôi</span>
              {ticketCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {ticketCount}
                </span>
              )}
            </button>

            {/* Nút Hỏi AI Chatbot - Xanh da trời tiêu chuẩn */}
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Hỏi CineBot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
