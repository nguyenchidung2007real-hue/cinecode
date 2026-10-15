import React from "react";
import { Film, Bot, Phone, Mail, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-neutral-800 bg-[#1c1c1c] text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột Logo & Thông tin CineMax */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e71a0f] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[#e71a0f]/30">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-base text-white tracking-tight">
                CINE<span className="text-[#e71a0f]">MAX</span> CINEMAS
              </span>
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              CÔNG TY CỔ PHẦN ĐIỆN ẢNH VÀ CÔNG NGHỆ CINEMAX VIỆT NAM
              <br />
              Tầng 5, Tòa nhà Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, TP. Hồ Chí Minh.
            </p>
            <div className="text-[11px] text-neutral-400 space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#e71a0f]" />
                <span>Hotline: <strong className="text-white">1900 6017</strong> (8:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#e71a0f]" />
                <span>Email: cskh@cinemax.vn</span>
              </div>
            </div>
          </div>

          {/* Cột Phim */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Phim Chiếu Rạp</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">Phim đang chiếu rạp</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">Phim sắp ra mắt 2026</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">Phim hoạt hình chiếu rạp</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">Suất chiếu đặc biệt (Sneak Show)</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">Phim IMAX & 4DX Bom Tấn</li>
            </ul>
          </div>

          {/* Cột Cụm Rạp */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Cụm Rạp CineMax</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li className="hover:text-[#e71a0f] font-semibold text-neutral-200 cursor-pointer transition-colors">
                📍 CineMax Vincom Center Bà Triệu (Hà Nội)
              </li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">📍 CineMax Vincom Landmark 81 (TP. HCM)</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">📍 CineMax Mipec Tower Tây Sơn (Hà Nội)</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">📍 CineMax Sư Vạn Hạnh (TP. HCM)</li>
              <li className="hover:text-[#e71a0f] cursor-pointer transition-colors">📍 CineMax Vincom Metropolis (Hà Nội)</li>
            </ul>
          </div>

          {/* Cột Công nghệ & An toàn */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Hệ Thống Tiện Ích</h4>
            <div className="space-y-2 text-neutral-400 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#e71a0f]">
                <Bot className="w-4 h-4" />
                <span className="font-bold text-neutral-200">Trợ Lý Đặt Vé Trực Tuyến</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Gợi ý phim thông minh theo sở thích và hỗ trợ đặt vé giữ chỗ tức thì.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-400 pt-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vé ký số HMAC chống vé giả</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
          <div>
            <p>© 2026 CineMax Cinema Corporation. Tất cả quyền được bảo lưu.</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              Nền tảng đặt vé xem phim thông minh kết hợp hệ thống cụm rạp hiện đại toàn quốc.
            </p>
          </div>

          {/* Huy Hiệu Bộ Công Thương */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
            </div>
            <p className="flex items-center gap-1 text-[11px]">
              Trải nghiệm điện ảnh <span className="text-[#e71a0f] font-bold">CineMax Cultureplex</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
