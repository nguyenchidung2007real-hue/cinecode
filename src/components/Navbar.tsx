"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Search, MapPin, Ticket, User, ShieldCheck, QrCode, Phone, ChevronDown, Bot } from "lucide-react";

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
      {/* 1. Top Utility Bar - CGV Dark Cinema Strip */}
      <div className="w-full bg-[#1c1c1c] text-neutral-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-[#e71a0f]" />
            Hotline CGV: <strong className="text-white">1900 6017</strong> (8:00 - 22:00)
          </span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:inline text-neutral-300">
            Rạp trọng điểm: <strong className="text-[#e71a0f]">CGV Vincom Center Bà Triệu</strong> & <strong className="text-[#e71a0f]">CGV Landmark 81</strong>
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
            <span>{customerInfo ? `Thành viên: ${customerInfo.name}` : "Đăng ký / Đăng nhập CGV"}</span>
          </Link>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-1 text-neutral-300 cursor-pointer hover:text-[#e71a0f]">
            <span>🇻🇳 VN</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar - CGV Vintage Cultureplex Style */}
      <div className="w-full bg-[#fdfcf0]/95 backdrop-blur-md border-b border-[#e5e0d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo CJ CGV VIETNAM */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="flex items-baseline gap-1">
              <span className="font-black text-2xl tracking-tighter text-[#1c1c1c]">CJ</span>
              <span className="font-black text-3xl tracking-tight text-[#e71a0f] drop-shadow-sm group-hover:scale-105 transition-transform">CGV</span>
            </div>
            <div className="border-l-2 border-[#e71a0f] pl-2.5 text-left hidden sm:block">
              <span className="block text-[11px] font-black tracking-widest text-[#1c1c1c] uppercase leading-none">
                CULTUREPLEX
              </span>
              <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Vượt xa điện ảnh
              </span>
            </div>
          </div>

          {/* Chọn Cụm Rạp CGV */}
          <div className="hidden lg:flex items-center gap-2 bg-white border border-[#e5e0d8] px-3 py-1.5 rounded-xl text-xs text-slate-800 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#e71a0f]" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-white text-slate-900">📍 Tất cả cụm rạp CGV</option>
              <option value="Hà Nội" className="bg-white text-slate-900">📍 CGV Vincom Bà Triệu (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-white text-slate-900">📍 CGV Landmark 81 (TP. HCM)</option>
              <option value="Hà Nội" className="bg-white text-slate-900">📍 CGV Metropolis Liễu Giai (Hà Nội)</option>
              <option value="TP. Hồ Chí Minh" className="bg-white text-slate-900">📍 CGV Sư Vạn Hạnh (TP. HCM)</option>
            </select>
          </div>

          {/* Menu Điều Hướng Rạp CGV Chuẩn CGV.VN */}
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
              Rạp CGV
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
              Cultureplex & Combo
            </a>
          </nav>

          {/* Search Spotlight & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Thanh tìm kiếm AI Spotlight */}
            <div className="w-40 sm:w-56 hidden md:block">
              <div
                onClick={onOpenSearch}
                className="relative flex items-center justify-between bg-white hover:bg-slate-50 text-xs text-slate-500 pl-8 pr-2.5 py-1.5 rounded-full border border-[#e5e0d8] hover:border-[#e71a0f] cursor-pointer transition-all group shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#e71a0f] absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                <span className="truncate text-[11px] text-slate-600 group-hover:text-slate-900">
                  Tìm phim, rạp CGV...
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
              title="Trợ lý"
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
