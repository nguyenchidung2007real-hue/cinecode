"use client";

import React from "react";
import { Popcorn, Sparkles, Gift, Ticket, ArrowRight, Star, Heart } from "lucide-react";

interface CgvLeftSkyscraperBannerProps {
  onSelectGenre?: (genre: string) => void;
}

export const CgvLeftSkyscraperBanner: React.FC<CgvLeftSkyscraperBannerProps> = ({ onSelectGenre }) => {
  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 1. Skyscraper Banner: Shaun the Sheep & Hoạt Hình (Chuẩn như ảnh mẫu CGV) */}
      <div
        onClick={() => {
          if (onSelectGenre) onSelectGenre("Hoạt hình");
          const el = document.getElementById("commercial-tabs");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#2d6a4f] via-[#40916c] to-[#1b4332] text-white border-2 border-[#52b788] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group flex flex-col items-center text-center p-2.5"
      >
        {/* Họa tiết đầu phim */}
        <div className="w-full py-1 bg-black/30 rounded-lg mb-2">
          <span className="text-[9px] font-black tracking-widest text-[#d8f3dc] uppercase block">
            SIÊU PHẨM HOẠT HÌNH
          </span>
        </div>

        {/* Tiêu đề & Nhân vật */}
        <h4 className="text-xs font-black uppercase text-[#95d5b2] leading-tight drop-shadow">
          Shaun the Sheep
        </h4>
        <span className="text-sm font-black text-amber-300 uppercase tracking-tighter drop-shadow">
          "QUÁI LẠ"
        </span>
        <span className="text-[9px] font-bold text-white uppercase tracking-wider">
          GHÉ NHÀ
        </span>

        {/* Minh họa chú cừu Shaun & phi thuyền */}
        <div className="w-14 h-14 my-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform">
          🐑🛸
        </div>

        <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-amber-400 text-neutral-900 uppercase tracking-wider mb-1.5 shadow-sm">
          Khởi Chiếu 2026
        </span>

        <p className="text-[9px] text-[#d8f3dc] line-clamp-2 leading-tight">
          Hài hước vui nhộn cho cả gia đình tại CGV!
        </p>

        <div className="w-full mt-2 py-1 px-2 rounded-lg bg-[#e71a0f] text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-0.5 shadow-sm group-hover:bg-[#c81007]">
          <span>Đặt vé</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 2. Banner Phụ: CGV Combo Solo 59k */}
      <a
        href="#promo-section"
        className="w-full rounded-2xl bg-[#fdfcf0] border-2 border-[#e71a0f] p-2.5 text-center text-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group block"
      >
        <div className="w-8 h-8 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[#e71a0f] mb-1 group-hover:rotate-12 transition-transform">
          <Popcorn className="w-4 h-4 text-[#e71a0f]" />
        </div>
        <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-black bg-[#e71a0f] text-white uppercase tracking-wider mb-1">
          CGV COMBO
        </span>
        <div className="text-[11px] font-black uppercase text-neutral-900 leading-tight">
          Combo Solo
        </div>
        <div className="text-sm font-black text-[#e71a0f] mt-0.5">
          59.000đ
        </div>
        <p className="text-[9px] text-neutral-500 mt-0.5 line-clamp-1">
          1 Bắp phô mai + 1 Nước
        </p>
      </a>
    </div>
  );
};

interface CgvRightSkyscraperBannerProps {
  onSelectMovie?: (movie: any) => void;
  onBookMovie?: (movie: any) => void;
}

export const CgvRightSkyscraperBanner: React.FC<CgvRightSkyscraperBannerProps> = ({
  onSelectMovie,
  onBookMovie,
}) => {
  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 1. Skyscraper Banner: Thám Tử Lừng Danh Conan / Doraemon */}
      <div
        onClick={() => {
          const el = document.getElementById("commercial-tabs");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#1e3a8a] via-[#2563eb] to-[#172554] text-white border-2 border-[#60a5fa] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group flex flex-col items-center text-center p-2.5"
      >
        {/* Họa tiết đầu phim */}
        <div className="w-full py-1 bg-black/30 rounded-lg mb-2">
          <span className="text-[9px] font-black tracking-widest text-[#dbeafe] uppercase block">
            ANIME BOM TẤN
          </span>
        </div>

        {/* Tiêu đề & Nhân vật */}
        <h4 className="text-xs font-black uppercase text-[#bfdbfe] leading-tight drop-shadow">
          Thám Tử Conan
        </h4>
        <span className="text-xs font-black text-amber-300 uppercase tracking-tighter drop-shadow">
          NGÔI SAO 5 CÁNH
        </span>
        <span className="text-[8px] font-bold text-white uppercase tracking-wider">
          1 TRIỆU ĐÔ
        </span>

        {/* Minh họa bảo kiếm & kính thám tử */}
        <div className="w-14 h-14 my-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform">
          🔍💎
        </div>

        <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white uppercase tracking-wider mb-1.5 shadow-sm">
          Đang Chiếu
        </span>

        <p className="text-[9px] text-[#dbeafe] line-clamp-2 leading-tight">
          Cuộc đối đầu kịch tính giữa Conan & Siêu đạo chích Kid!
        </p>

        <div className="w-full mt-2 py-1 px-2 rounded-lg bg-[#e71a0f] text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-0.5 shadow-sm group-hover:bg-[#c81007]">
          <span>Xem suất</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 2. Banner Phụ: CGV U22 Pass */}
      <a
        href="#promo-section"
        className="w-full rounded-2xl bg-[#fdfcf0] border-2 border-amber-500 p-2.5 text-center text-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group block"
      >
        <div className="w-8 h-8 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1 group-hover:rotate-12 transition-transform">
          <Gift className="w-4 h-4 text-amber-600" />
        </div>
        <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500 text-white uppercase tracking-wider mb-1">
          CGV MEMBER
        </span>
        <div className="text-[11px] font-black uppercase text-neutral-900 leading-tight">
          Đặc Quyền U22
        </div>
        <div className="text-sm font-black text-[#e71a0f] mt-0.5">
          45k - 50k
        </div>
        <p className="text-[9px] text-neutral-500 mt-0.5 line-clamp-1">
          Ưu đãi HSSV & Tặng bắp
        </p>
      </a>
    </div>
  );
};
