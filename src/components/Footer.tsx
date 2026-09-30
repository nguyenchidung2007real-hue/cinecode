import React from "react";
import Link from "next/link";
import { Film, Sparkles, Heart, Phone, Mail, MapPin, ShieldCheck, QrCode } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#034EA2]/30 bg-[#07152E] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột Logo & Thông tin công ty Beta Media */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#034EA2] via-[#00B2FF] to-[#FF5722] flex items-center justify-center text-white shadow-md">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-black text-base text-white tracking-tight">
                BETA<span className="text-[#00B2FF]">CINEMAS</span> AI
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              CÔNG TY CỔ PHẦN BETA MEDIA
              <br />
              Tầng 3, Tòa nhà HITC, 239 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00B2FF]" />
                <span>Hotline: <strong className="text-white">1900 636 807</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF5722]" />
                <span>Email: cskh@betacinemas.vn</span>
              </div>
            </div>
          </div>

          {/* Cột Phim */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Phim Chiếu Rạp</h4>
            <ul className="space-y-2 text-slate-300 text-[11px]">
              <li className="hover:text-[#00B2FF] cursor-pointer">Phim đang chiếu rạp</li>
              <li className="hover:text-[#00B2FF] cursor-pointer">Phim sắp ra mắt 2026</li>
              <li className="hover:text-[#00B2FF] cursor-pointer">Suất chiếu đặc biệt (Sneak Show)</li>
              <li className="hover:text-[#00B2FF] cursor-pointer">Phim bom tấn hành động</li>
            </ul>
          </div>

          {/* Cột Cụm Rạp */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Cụm Rạp Beta</h4>
            <ul className="space-y-2 text-slate-300 text-[11px]">
              <li className="hover:text-[#00B2FF] font-semibold text-white cursor-pointer">
                📍 Beta Cinemas Xuân Thủy (HITC Cầu Giấy)
              </li>
              <li className="hover:text-[#00B2FF] cursor-pointer">📍 Beta Cinemas Thanh Xuân (Hà Nội)</li>
              <li className="hover:text-[#00B2FF] cursor-pointer">📍 Beta Cinemas Mỹ Đình (Hà Nội)</li>
              <li className="hover:text-[#00B2FF] cursor-pointer">📍 Beta Cinemas Quang Trung (TP. HCM)</li>
            </ul>
          </div>

          {/* Cột Công nghệ AI & An toàn */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Hệ Thống Thông Minh</h4>
            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#00B2FF]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold">Groq LPU (~500 tokens/s)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tư vấn chọn phim theo cảm xúc và đề xuất ghế ngồi rạp trực quan.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-400 pt-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vé ký số HMAC chống giả mạo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2024 - 2026 Beta Media Joint Stock Company. Bảo lưu mọi quyền.</p>
          
          {/* Cổng đăng nhập nội bộ cho Nhân viên & Quản trị */}
          <div className="flex items-center gap-3 text-[11px]">
            <Link
              href="/scanner"
              className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <QrCode className="w-3 h-3" />
              <span>Cổng Soát Vé</span>
            </Link>
            <span>•</span>
            <Link
              href="/admin"
              className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Quản Trị Rạp</span>
            </Link>
          </div>

          <p className="flex items-center gap-1">
            Thiết kế theo nhận diện thương hiệu <span className="text-[#00B2FF] font-bold">Beta Cinemas</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
