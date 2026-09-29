"use client";

import React from "react";
import { Sparkles, Gift, Flame, Popcorn } from "lucide-react";

export const SideBanners: React.FC = () => {
  return (
    <>
      {/* Banner Cột Trái (Gutter Left) */}
      <aside
        aria-label="Khuyến mãi Combo Beta"
        className="hidden 2xl:flex fixed left-3 top-28 z-20 w-36 flex-col items-center gap-2"
      >
        <div className="w-full bg-gradient-to-b from-[#034EA2] to-[#0B2046] border border-[#00B2FF]/40 rounded-2xl p-3 text-center text-white shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer group">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#FF5722] flex items-center justify-center mb-2 shadow-md group-hover:rotate-12 transition-transform">
            <Popcorn className="w-5 h-5 text-white" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF5722] text-white tracking-wider mb-1">
            HOT DEAL
          </span>
          <h4 className="text-xs font-black uppercase text-[#00B2FF] leading-tight">
            Combo Solo
          </h4>
          <div className="text-lg font-black text-amber-300 mt-1">
            68.000đ
          </div>
          <p className="text-[10px] text-blue-100 mt-1 line-clamp-2">
            1 Bắp rang bơ + 1 Nước ngọt mát lạnh
          </p>
          <div className="mt-2 text-[10px] font-bold text-white bg-[#00B2FF]/20 py-1 px-2 rounded-lg border border-[#00B2FF]/40">
            Đặt vé mua ngay
          </div>
        </div>
      </aside>

      {/* Banner Cột Phải (Gutter Right) */}
      <aside
        aria-label="Khuyến mãi Thành viên Beta"
        className="hidden 2xl:flex fixed right-3 top-28 z-20 w-36 flex-col items-center gap-2"
      >
        <div className="w-full bg-gradient-to-b from-[#0B2046] to-[#034EA2] border border-amber-400/40 rounded-2xl p-3 text-center text-white shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer group">
          <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-md group-hover:rotate-12 transition-transform">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black tracking-wider mb-1">
            BETA VIP
          </span>
          <h4 className="text-xs font-black uppercase text-amber-300 leading-tight">
            Thẻ Thành Viên
          </h4>
          <div className="text-base font-black text-white mt-1">
            Giảm 20%
          </div>
          <p className="text-[10px] text-blue-100 mt-1 line-clamp-2">
            Tích điểm đổi vé & bắp nước miễn phí
          </p>
          <div className="mt-2 text-[10px] font-bold text-amber-300 bg-amber-400/20 py-1 px-2 rounded-lg border border-amber-400/40">
            Đăng ký ngay
          </div>
        </div>
      </aside>
    </>
  );
};
