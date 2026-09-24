import React from "react";
import { Film, Sparkles, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-neutral-800 bg-neutral-950/80 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột Logo & Slogan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-red flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">CINEMAX AI</span>
            </div>
            <p className="text-neutral-500 leading-relaxed">
              Hệ thống đặt vé xem phim thế hệ mới kết hợp trí tuệ nhân tạo Groq AI siêu tốc và dữ liệu điện ảnh toàn cầu.
            </p>
          </div>

          {/* Cột Phim */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Phim Điện Ảnh</h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="hover:text-white cursor-pointer">Phim đang chiếu rạp</li>
              <li className="hover:text-white cursor-pointer">Phim sắp ra mắt 2024</li>
              <li className="hover:text-white cursor-pointer">Phim IMAX & 4DX</li>
              <li className="hover:text-white cursor-pointer">Bảng xếp hạng phim hay nhất</li>
            </ul>
          </div>

          {/* Cột Cụm Rạp */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Cụm Rạp Chiếu</h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="hover:text-accent-red font-medium text-white/90 cursor-pointer">📍 Beta Cinemas Xuân Thủy (HITC Cầu Giấy)</li>
              <li className="hover:text-white cursor-pointer">CGV Vincom Bà Triệu</li>
              <li className="hover:text-white cursor-pointer">Lotte Cinema Keangnam</li>
              <li className="hover:text-white cursor-pointer">CGV Vincom Landmark 81</li>
            </ul>
          </div>

          {/* Cột Công nghệ AI */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Công Nghệ Tích Hợp</h4>
            <div className="space-y-2 text-neutral-400">
              <div className="flex items-center gap-1.5 text-accent-cyan">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">Groq LPU (~500 tokens/s)</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Tư vấn chọn phim và vị trí ghế ngồi rạp chuẩn xác không độ trễ.
              </p>
              <div className="pt-2">
                <span className="inline-block bg-neutral-900 border border-neutral-700 text-neutral-300 px-2.5 py-1 rounded-md text-[10px] font-mono">
                  TMDB API v3 Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-500 text-[11px]">
          <p>© 2024 - 2026 CineMax AI. Tất cả quyền được bảo lưu.</p>
          <p className="flex items-center gap-1">
            Xây dựng với <Heart className="w-3 h-3 text-accent-red fill-accent-red" /> bằng Next.js 14, TypeScript & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};
