"use client";

import React, { useState } from "react";
import { Popcorn, Gift, ArrowRight, Ticket, Film, Sparkles, Star } from "lucide-react";

interface CgvLeftSkyscraperBannerProps {
  onSelectGenre?: (genre: string) => void;
  onSelectMovie?: (movie: any) => void;
}

export const CgvLeftSkyscraperBanner: React.FC<CgvLeftSkyscraperBannerProps> = ({
  onSelectGenre,
  onSelectMovie,
}) => {
  const [imgSrc, setImgSrc] = useState("/images/posters/shaun-the-sheep.jpg");

  const handleClick = () => {
    if (onSelectGenre) onSelectGenre("Hoạt hình");
    const el = document.getElementById("commercial-tabs");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 1. Skyscraper Banner: Poster Phim Thật - Shaun the Sheep: Quái Lạ Ghé Nhà */}
      <div
        onClick={handleClick}
        className="w-full rounded-xl overflow-hidden bg-white border border-[#e5e0d8] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col"
        title="Shaun the Sheep: Quái Lạ Ghé Nhà - Khởi chiếu tại CineMax"
      >
        {/* Banner header phong cách cinema */}
        <div className="bg-[#244f3b] py-1 px-1.5 text-center border-b border-[#3b7a5e]">
          <span className="text-[10px] font-black tracking-wider text-[#a7f3d0] uppercase block">
            HOẠT HÌNH BOM TẤN
          </span>
        </div>

        {/* Khung Poster Thật với Badges chuẩn cinema */}
        <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt="Shaun the Sheep Movie - Quái Lạ Ghé Nhà"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              // Fallback nếu ảnh nội bộ gặp lỗi
              setImgSrc("https://upload.wikimedia.org/wikipedia/en/6/62/Shaun_the_Sheep_Movie_-_Farmageddon.jpg");
            }}
          />

          {/* Huy hiệu độ tuổi chuẩn cinema (P - Phổ thông cho mọi lứa tuổi) */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
            <span className="w-5 h-5 rounded bg-[#22c55e] text-white text-[10px] font-black flex items-center justify-center shadow-md border border-white/40">
              P
            </span>
          </div>

          {/* Huy hiệu định dạng 2D Lồng Tiếng */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider border border-white/20 shadow">
              2D • LT
            </span>
          </div>

          {/* Lớp gradient tối mờ bên dưới poster để chữ luôn rõ nét */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end p-2 text-left">
            <span className="text-[9px] font-bold text-amber-300 tracking-wider uppercase drop-shadow">
              Aardman Animations
            </span>
            <h4 className="text-[12px] font-black text-white uppercase leading-tight line-clamp-1 drop-shadow-md">
              Shaun the Sheep
            </h4>
            <p className="text-[10px] font-extrabold text-[#86efac] uppercase tracking-tight line-clamp-1">
              "QUÁI LẠ" GHÉ NHÀ
            </p>
          </div>
        </div>

        {/* Phần chân banner thông tin ngày chiếu & nút đặt vé */}
        <div className="p-2 bg-gradient-to-b from-[#fdfcf9] to-[#f5f2eb] flex flex-col items-center text-center gap-1.5 border-t border-[#f0ece1]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>KHỞI CHIẾU 2026</span>
          </div>

          <p className="text-[10px] text-neutral-600 line-clamp-2 leading-tight font-medium">
            Siêu phẩm hài hước cho cả gia đình tại CineMax
          </p>

          <button
            type="button"
            className="w-full py-1.5 px-2 rounded-lg bg-[#e71a0f] hover:bg-[#c81007] text-white text-[11px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1 shadow-md transition-all group-hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <span>ĐẶT VÉ NGAY</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 2. Banner Phụ: CineMax Combo Bắp Nước Solo */}
      <a
        href="#promo-section"
        className="w-full rounded-xl bg-white border border-[#e5e0d8] p-2.5 text-center text-neutral-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer group block"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-[#e71a0f] text-white uppercase tracking-wider">
            CINEMAX COMBO
          </span>
          <span className="text-[10px] font-extrabold text-[#e71a0f]">HOT DEAL</span>
        </div>

        <div className="w-10 h-10 mx-auto rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#e71a0f] my-1 group-hover:scale-110 transition-transform shadow-inner">
          <Popcorn className="w-5 h-5 text-[#e71a0f]" />
        </div>

        <div className="text-[12px] font-black uppercase text-neutral-900 leading-tight">
          Combo Solo
        </div>
        <div className="text-base font-black text-[#e71a0f] mt-0.5 tracking-tight">
          59.000đ
        </div>
        <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1 font-medium">
          1 Bắp phô mai + 1 Nước
        </p>

        <div className="mt-2 text-[10px] font-bold text-neutral-700 group-hover:text-[#e71a0f] flex items-center justify-center gap-0.5 transition-colors">
          <span>Mua cùng vé</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
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
  const [imgSrc, setImgSrc] = useState("/images/posters/conan-movie-27.jpg");

  const handleClick = () => {
    const el = document.getElementById("commercial-tabs");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 1. Skyscraper Banner: Poster Phim Thật - Thám Tử Conan: Ngôi Sao 5 Cánh */}
      <div
        onClick={handleClick}
        className="w-full rounded-xl overflow-hidden bg-white border border-[#e5e0d8] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col"
        title="Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô - Đang chiếu tại CineMax"
      >
        {/* Banner header phong cách cinema */}
        <div className="bg-[#172554] py-1 px-1.5 text-center border-b border-[#1e40af]">
          <span className="text-[10px] font-black tracking-wider text-[#93c5fd] uppercase block">
            ANIME BOM TẤN
          </span>
        </div>

        {/* Khung Poster Thật với Badges chuẩn cinema */}
        <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt="Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              // Fallback nếu ảnh nội bộ gặp lỗi
              setImgSrc("https://upload.wikimedia.org/wikipedia/en/1/16/Detective_Conan_The_Million_Dollar_Pentagram_Poster.jpg");
            }}
          />

          {/* Huy hiệu độ tuổi (T13 - Khán giả từ 13 tuổi trở lên) */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
            <span className="w-6 h-5 rounded bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-white/40">
              T13
            </span>
          </div>

          {/* Huy hiệu định dạng IMAX / 2D */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <span className="px-1.5 py-0.5 rounded bg-sky-950/85 backdrop-blur-sm text-sky-300 text-[9px] font-black uppercase tracking-wider border border-sky-400/30 shadow">
              IMAX • 2D
            </span>
          </div>

          {/* Lớp gradient tối mờ bên dưới poster để chữ luôn rõ nét */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end p-2 text-left">
            <span className="text-[9px] font-bold text-amber-300 tracking-wider uppercase drop-shadow">
              Gōshō Aoyama
            </span>
            <h4 className="text-[12px] font-black text-white uppercase leading-tight line-clamp-1 drop-shadow-md">
              Thám Tử Conan
            </h4>
            <p className="text-[10px] font-extrabold text-[#fde047] uppercase tracking-tight line-clamp-1">
              NGÔI SAO 5 CÁNH
            </p>
          </div>
        </div>

        {/* Phần chân banner thông tin ngày chiếu & nút đặt vé */}
        <div className="p-2 bg-gradient-to-b from-[#fdfcf9] to-[#f5f2eb] flex flex-col items-center text-center gap-1.5 border-t border-[#f0ece1]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[#e71a0f] font-black">ĐANG CHIẾU TẠI RẠP</span>
          </div>

          <p className="text-[10px] text-neutral-600 line-clamp-2 leading-tight font-medium">
            Đại chiến Hakodate: Conan, Heiji và Siêu Đạo Chích Kid
          </p>

          <button
            type="button"
            className="w-full py-1.5 px-2 rounded-lg bg-[#e71a0f] hover:bg-[#c81007] text-white text-[11px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1 shadow-md transition-all group-hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <span>MUA VÉ NGAY</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 2. Banner Phụ: CineMax Member U22 Pass */}
      <a
        href="#promo-section"
        className="w-full rounded-xl bg-white border border-[#e5e0d8] p-2.5 text-center text-neutral-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer group block"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider">
            CINEMAX MEMBER
          </span>
          <span className="text-[10px] font-extrabold text-amber-600">ƯU ĐÃI</span>
        </div>

        <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 my-1 group-hover:scale-110 transition-transform shadow-inner">
          <Gift className="w-5 h-5 text-amber-600" />
        </div>

        <div className="text-[12px] font-black uppercase text-neutral-900 leading-tight">
          Đặc Quyền U22
        </div>
        <div className="text-base font-black text-[#e71a0f] mt-0.5 tracking-tight">
          45k - 50k
        </div>
        <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1 font-medium">
          Dành riêng cho U22 & HSSV
        </p>

        <div className="mt-2 text-[10px] font-bold text-neutral-700 group-hover:text-[#e71a0f] flex items-center justify-center gap-0.5 transition-colors">
          <span>Xem điều kiện</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </a>
    </div>
  );
};
