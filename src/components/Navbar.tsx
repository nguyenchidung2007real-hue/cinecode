"use client";

import React, { useState } from "react";
import { Film, Sparkles, Search, MapPin, Ticket } from "lucide-react";

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-red to-orange-500 flex items-center justify-center shadow-lg shadow-accent-red/30">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                CINEMAX
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded font-bold bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium tracking-wide">
              RẠP PHIM & TRỢ LÝ THÔNG MINH
            </p>
          </div>
        </div>

        {/* Thanh tìm kiếm AI Spotlight */}
        <div className="flex-1 max-w-md hidden md:block">
          <div
            onClick={onOpenSearch}
            className="relative flex items-center justify-between bg-neutral-900/90 hover:bg-neutral-800/90 text-sm text-neutral-400 pl-9 pr-3 py-2 rounded-full border border-neutral-700/60 hover:border-accent-red/50 cursor-pointer transition-all group"
          >
            <Search className="w-4 h-4 text-neutral-400 group-hover:text-accent-red absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
            <span className="truncate text-xs text-neutral-400 group-hover:text-neutral-200">
              Tìm theo cốt truyện, cảm xúc, AI RAG...
            </span>
            <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-neutral-400 bg-neutral-800 border border-neutral-700/80 px-1.5 py-0.5 rounded shadow-sm">
              Ctrl K
            </kbd>
          </div>
        </div>


        {/* Khu vực chọn Tỉnh/Thành & Nút Ví Vé & Nút AI Chat */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900/70 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-accent-red" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="Tất cả" className="bg-neutral-900 text-white">Tất cả cụm rạp</option>
              <option value="Hà Nội" className="bg-neutral-900 text-white">Hà Nội</option>
              <option value="TP. Hồ Chí Minh" className="bg-neutral-900 text-white">TP. Hồ Chí Minh</option>
            </select>
          </div>

          {/* Nút Tìm kiếm AI trên Mobile */}
          <button
            onClick={onOpenSearch}
            title="Tìm kiếm AI (Ctrl+K)"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all"
          >
            <Search className="w-3.5 h-3.5 text-accent-cyan" />
          </button>

          {/* Nút Ví Vé Của Tôi */}
          <button
            onClick={onOpenMyTickets}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium transition-all"
          >

            <Ticket className="w-3.5 h-3.5 text-accent-red" />
            <span className="hidden sm:inline">Vé Của Tôi</span>
            {ticketCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center">
                {ticketCount}
              </span>
            )}
          </button>

          {/* Nút Hỏi AI */}
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-accent-cyan/20 to-blue-500/20 border border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/30 text-xs font-semibold shadow-sm transition-all transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Hỏi AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
