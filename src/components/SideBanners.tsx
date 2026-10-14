"use client";

import React from "react";
import { Sparkles, Gift, Flame, Popcorn } from "lucide-react";

export const SideBanners: React.FC = () => {
  return (
    <>
      {/* Banner Cột Trái (Gutter Left) */}
      <aside
        aria-label="Khuyến mãi Combo CineMax"
        className="hidden 2xl:flex fixed left-3 top-28 z-20 w-36 flex-col items-center gap-2"
      >
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-center text-slate-800 shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer group">
          <div className="w-10 h-10 mx-auto rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center mb-2 shadow-sm group-hover:rotate-12 transition-transform">
            <Popcorn className="w-5 h-5 text-sky-600" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white tracking-wider mb-1">
            HOT DEAL
          </span>
          <h4 className="text-xs font-black uppercase text-slate-900 leading-tight">
            Combo Solo
          </h4>
          <div className="text-lg font-black text-sky-600 mt-1">
            68.000đ
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
            1 Bắp rang bơ + 1 Nước ngọt mát lạnh
          </p>
          <div className="mt-2 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-700 py-1.5 px-2 rounded-lg transition-colors shadow-sm">
            Đặt vé mua ngay
          </div>
        </div>
      </aside>

      {/* Banner Cột Phải (Gutter Right) */}
      <aside
        aria-label="Khuyến mãi Thành viên CineMax"
        className="hidden 2xl:flex fixed right-3 top-28 z-20 w-36 flex-col items-center gap-2"
      >
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-center text-slate-800 shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer group">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-2 shadow-sm group-hover:rotate-12 transition-transform">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white tracking-wider mb-1">
            CINEMAX VIP
          </span>
          <h4 className="text-xs font-black uppercase text-slate-900 leading-tight">
            Thẻ Thành Viên
          </h4>
          <div className="text-base font-black text-sky-600 mt-1">
            Giảm 20%
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
            Tích điểm đổi vé & bắp nước miễn phí
          </p>
          <div className="mt-2 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-700 py-1.5 px-2 rounded-lg transition-colors shadow-sm">
            Đăng ký ngay
          </div>
        </div>
      </aside>
    </>
  );
};
