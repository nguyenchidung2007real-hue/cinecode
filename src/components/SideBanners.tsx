"use client";

import React from "react";
import { Gift, Popcorn, Sparkles, Tag, ArrowRight, Flame } from "lucide-react";

export const SideBanners: React.FC = () => {
  return (
    <>
      {/* Banner Quảng Cáo Cột Trái (Gutter Left) - Hiển thị từ màn hình lớn xl trở lên */}
      <aside
        aria-label="Quảng cáo Khuyến mãi CGV"
        className="hidden xl:flex fixed left-3 top-36 z-20 w-36 flex-col items-center gap-3"
      >
        <a
          href="#promo-section"
          className="w-full bg-[#fdfcf0] border-2 border-[#e71a0f] rounded-2xl p-3 text-center text-[#1c1c1c] shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group block"
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-rose-50 text-[#e71a0f] border border-rose-200 flex items-center justify-center mb-1.5 shadow-sm group-hover:rotate-12 transition-transform">
            <Popcorn className="w-5 h-5 text-[#e71a0f]" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-[#e71a0f] text-white tracking-wider mb-1 uppercase">
            CGV COMBO
          </span>
          <h4 className="text-xs font-black uppercase text-[#1c1c1c] leading-tight">
            Combo Solo
          </h4>
          <div className="text-base font-black text-[#e71a0f] mt-0.5">
            59.000đ
          </div>
          <p className="text-[10px] text-neutral-600 mt-1 line-clamp-2 leading-tight">
            1 Bắp phô mai nóng + 1 Nước ngọt mát lạnh
          </p>
          <div className="mt-2 text-[10px] font-bold text-white bg-[#e71a0f] hover:bg-[#c81007] py-1.5 px-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1">
            <span>Mua kèm vé</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </a>

        {/* Banner 2: Thứ 4 Vui Vẻ */}
        <a
          href="#price-table"
          className="w-full bg-gradient-to-b from-[#1c1c1c] to-[#2b2b2b] border border-neutral-700 rounded-2xl p-3 text-center text-white shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group block"
        >
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-neutral-900 tracking-wider mb-1 uppercase">
            THỨ 4 VUI VẺ
          </span>
          <div className="text-xs font-black uppercase text-amber-400 leading-tight">
            Đồng Giá Vé
          </div>
          <div className="text-lg font-black text-[#e71a0f] mt-0.5 drop-shadow">
            45.000đ
          </div>
          <p className="text-[9px] text-neutral-300 mt-0.5 leading-tight">
            Áp dụng cho mọi suất chiếu 2D toàn hệ thống
          </p>
        </a>
      </aside>

      {/* Banner Quảng Cáo Cột Phải (Gutter Right) */}
      <aside
        aria-label="Quảng cáo Thành viên CGV"
        className="hidden xl:flex fixed right-3 top-36 z-20 w-36 flex-col items-center gap-3"
      >
        <a
          href="#promo-section"
          className="w-full bg-[#fdfcf0] border-2 border-amber-500 rounded-2xl p-3 text-center text-[#1c1c1c] shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group block"
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-1.5 shadow-sm group-hover:rotate-12 transition-transform">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white tracking-wider mb-1 uppercase">
            CGV MEMBER
          </span>
          <h4 className="text-xs font-black uppercase text-[#1c1c1c] leading-tight">
            Đặc Quyền U22
          </h4>
          <div className="text-base font-black text-[#e71a0f] mt-0.5">
            45k - 50k
          </div>
          <p className="text-[10px] text-neutral-600 mt-1 line-clamp-2 leading-tight">
            Ưu đãi sinh viên & tặng bắp rang bơ ngày sinh nhật
          </p>
          <div className="mt-2 text-[10px] font-bold text-white bg-[#e71a0f] hover:bg-[#c81007] py-1.5 px-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1">
            <span>Chi tiết</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </a>

        {/* Banner IMAX & ScreenX */}
        <div
          onClick={() => {
            const el = document.getElementById("commercial-tabs");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full bg-gradient-to-b from-[#e71a0f] to-[#b71007] border border-white/20 rounded-2xl p-3 text-center text-white shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
        >
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-white text-[#e71a0f] tracking-wider mb-1 uppercase">
            CULTUREPLEX
          </span>
          <div className="text-xs font-black uppercase leading-tight text-white">
            IMAX & 4DX
          </div>
          <p className="text-[9px] text-white/90 mt-1 leading-tight">
            Màn hình 7 tầng & ghế chuyển động đa chiều
          </p>
          <div className="mt-2 text-[9px] font-bold text-white bg-black/30 py-1 px-2 rounded-lg">
            Khám phá rạp
          </div>
        </div>
      </aside>
    </>
  );
};
