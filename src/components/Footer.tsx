import React from "react";
import { Film, Sparkles, Phone, Mail, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột Logo & Thông tin công ty Beta Media */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-black text-base text-slate-900 tracking-tight">
                BETA<span className="text-sky-600">CINEMAS</span> AI
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              CÔNG TY CỔ PHẦN BETA MEDIA
              <br />
              Tầng 3, Tòa nhà HITC, 239 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Hotline: <strong className="text-slate-900">1900 636 807</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>Email: cskh@betacinemas.vn</span>
              </div>
            </div>
          </div>

          {/* Cột Phim */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs">Phim Chiếu Rạp</h4>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="hover:text-sky-600 cursor-pointer transition-colors">Phim đang chiếu rạp</li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">Phim sắp ra mắt 2026</li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">Suất chiếu đặc biệt (Sneak Show)</li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">Phim bom tấn hành động</li>
            </ul>
          </div>

          {/* Cột Cụm Rạp */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs">Cụm Rạp Beta</h4>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="hover:text-sky-600 font-semibold text-slate-800 cursor-pointer transition-colors">
                📍 Beta Cinemas Xuân Thủy (HITC Cầu Giấy)
              </li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">📍 Beta Cinemas Thanh Xuân (Hà Nội)</li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">📍 Beta Cinemas Mỹ Đình (Hà Nội)</li>
              <li className="hover:text-sky-600 cursor-pointer transition-colors">📍 Beta Cinemas Quang Trung (TP. HCM)</li>
            </ul>
          </div>

          {/* Cột Công nghệ AI & An toàn */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs">Hệ Thống Thông Minh</h4>
            <div className="space-y-2 text-slate-600 text-[11px]">
              <div className="flex items-center gap-1.5 text-sky-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold">Trợ Lý Phim Trực Tuyến</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tư vấn chọn phim theo cảm xúc và đề xuất ghế ngồi rạp trực quan.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 pt-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vé ký số HMAC chống giả mạo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2024 - 2026 Beta Media Joint Stock Company. Bảo lưu mọi quyền.</p>

          <p className="flex items-center gap-1">
            Thiết kế theo nhận diện thương hiệu <span className="text-sky-600 font-bold">Beta Cinemas</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
