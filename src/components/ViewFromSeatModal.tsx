"use client";

import React from "react";
import { Seat, Movie } from "@/types";
import { X, Sparkles, Volume2, Eye, ShieldCheck, Check } from "lucide-react";

interface ViewFromSeatModalProps {
  seat: Seat | null;
  movie: Movie | null;
  cinemaName: string;
  roomName: string;
  onClose: () => void;
  onConfirmSelect?: (seat: Seat) => void;
  isSelected?: boolean;
}

export const ViewFromSeatModal: React.FC<ViewFromSeatModalProps> = ({
  seat,
  movie,
  cinemaName,
  roomName,
  onClose,
  onConfirmSelect,
  isSelected,
}) => {
  if (!seat) return null;

  // Tính toán góc nhìn và đặc tính theo hàng ghế
  const getSeatPerspectiveData = (seat: Seat) => {
    const row = seat.row.toUpperCase();
    const seatNum = seat.number;

    // Khoảng cách hàng ghế
    const rowDistanceMap: Record<string, { distance: number; fov: number; angle: number; level: string; desc: string; isSweetSpot: boolean }> = {
      A: { distance: 4.5, fov: 68, angle: 42, level: "Hàng cận màn chiếu (Front Row)", desc: "Màn hình tràn viền trọn tầm mắt, trải nghiệm hành động choáng ngợp nhưng cần ngước cổ.", isSweetSpot: false },
      B: { distance: 5.8, fov: 62, angle: 36, level: "Hàng cận màn chiếu", desc: "Hình ảnh cực đại, cảm giác hòa mình vào không gian phim rõ nét.", isSweetSpot: false },
      C: { distance: 7.2, fov: 55, angle: 30, level: "Hàng cận trung", desc: "Góc ngước nhẹ, phù hợp ai thích khung hình lớn và âm thanh áp sát.", isSweetSpot: false },
      D: { distance: 8.6, fov: 48, angle: 22, level: "Hàng trung tâm trước", desc: "Độ cao mắt cân bằng, bao quát toàn cảnh mà không bị mỏi mắt.", isSweetSpot: false },
      E: { distance: 10.0, fov: 44, angle: 15, level: "Hàng tiêu chuẩn VIP", desc: "Bắt đầu vùng thưởng thức điện ảnh tối ưu, hình ảnh rõ nét và độ sáng chuẩn.", isSweetSpot: true },
      F: { distance: 11.5, fov: 40, angle: 8, level: "⭐ VỊ TRÍ VÀNG (SWEET SPOT ĐẲNG CẤP)", desc: "Góc nhìn 40° đạt chuẩn SMPTE / THX quốc tế, hình ảnh chuẩn điện ảnh nhất rạp.", isSweetSpot: true },
      G: { distance: 13.0, fov: 38, angle: 2, level: "⭐ VỊ TRÍ VÀNG (DOLBY ATMOS CHUẨN)", desc: "Tâm điểm hội tụ âm thanh vòm vĩ độ 360°, âm bass và hiệu ứng vòm chân thực nhất.", isSweetSpot: true },
      H: { distance: 14.5, fov: 35, angle: -4, level: "Hàng VIP trên cao", desc: "Góc nhìn hơi chúc xuống tự nhiên, toàn cảnh rạp thoáng đãng và không bị chắn tầm nhìn.", isSweetSpot: true },
      K: { distance: 16.5, fov: 30, angle: -10, level: "Sweetbox Ghế Đôi Riêng Tư", desc: "Vách ngăn nỉ nhung đôi lãng mạn, góc nhìn bao quát toàn bộ rạp từ vị trí cao nhất.", isSweetSpot: false },
    };

    const base = rowDistanceMap[row] || rowDistanceMap["F"];

    // Độ lệch tâm ngang (Center offset)
    const centerOffset = Math.abs(seatNum - 6.5);
    const centerRating = centerOffset <= 2 ? "Chính diện màn hình (Trục tâm)" : centerOffset <= 4 ? "Góc nhìn chéo nhẹ" : "Góc nhìn nghiêng rìa rạp";

    return {
      ...base,
      centerRating,
      centerOffset,
    };
  };

  const data = getSeatPerspectiveData(seat);

  // Tính scale và tỷ lệ mô phỏng màn hình cong trên giao diện
  // Khoảng cách càng gần thì màn hình càng to (scale lớn hơn)
  const screenScale = Math.max(0.65, Math.min(1.25, 1.4 - (data.distance / 20)));
  const screenPerspectiveSkewY = (seat.number - 6.5) * -1.2; // Độ nghiêng nhẹ theo góc ngồi

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#161822] via-[#0F1017] to-[#0A0B0E] border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(229,9,20,0.25)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Góc Nhìn Từ Ghế <span className="text-yellow-400 font-extrabold">{seat.id}</span>
                </h3>
                {data.isSweetSpot && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sweet Spot
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {cinemaName} • {roomName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khung mô phỏng 3D góc nhìn ảo ra màn chiếu cong */}
        <div className="relative h-64 sm:h-72 w-full bg-[#050608] flex items-center justify-center overflow-hidden border-b border-white/10">
          {/* Ánh sáng hắt từ màn hình ra hàng ghế */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 15%, rgba(229, 9, 20, 0.45) 0%, rgba(255, 215, 0, 0.15) 35%, transparent 75%)`,
            }}
          />

          {/* Vạch kẻ mô phỏng sàn dốc rạp chiếu phim (Auditorium floor lines) */}
          <div className="absolute inset-x-0 bottom-0 h-28 opacity-20 pointer-events-none [background:radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />

          {/* Màn chiếu cong mô phỏng (Curved Virtual Screen) */}
          <div
            className="relative transition-all duration-500 ease-out flex flex-col items-center justify-center"
            style={{
              transform: `scale(${screenScale}) rotateY(${screenPerspectiveSkewY}deg) translateY(${data.angle * 0.8}px)`,
              perspective: 800,
            }}
          >
            {/* Vòm sáng Neon màn hình cong */}
            <div className="w-[380px] sm:w-[460px] h-4 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent rounded-full blur-[3px] -mb-1 shadow-[0_0_20px_#06b6d4]" />

            {/* Khung màn hình cong IMAX / Cinema Screen */}
            <div className="w-[380px] sm:w-[460px] h-36 sm:h-40 rounded-2xl overflow-hidden border-2 border-cyan-400/40 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative bg-[#090b10]">
              {movie?.backdropPath ? (
                <img
                  src={movie.backdropPath}
                  alt={movie.title}
                  className="w-full h-full object-cover brightness-90 contrast-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  Màn Chiếu Chuẩn Cinema Laser
                </div>
              )}

              {/* Lớp phủ phụ đề / nhãn phim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-end p-3">
                <span className="text-xs font-bold text-white truncate drop-shadow-md">
                  {movie?.title || "CineMax Projection"}
                </span>
                <span className="text-[10px] text-gray-300">
                  Góc mắt: {data.fov}° • Tỉ lệ bao quát: {Math.round(screenScale * 100)}%
                </span>
              </div>
            </div>

            {/* Màn hình cong đáy */}
            <div className="w-[360px] sm:w-[440px] h-1.5 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full mt-1 opacity-70" />
            <span className="text-[10px] text-cyan-400/90 font-medium tracking-widest uppercase mt-1">
              MÀN HÌNH CHÍNH (SCREEN)
            </span>
          </div>

          {/* Vị trí đầu người xem ảo tượng trưng cho góc nhìn */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-85">
            <div className="w-8 h-8 rounded-full bg-gradient-to-t from-gray-700 to-gray-500 border border-white/20 shadow-md flex items-center justify-center text-[10px] font-bold text-white">
              {seat.id}
            </div>
            <div className="w-12 h-3 bg-gray-800 rounded-t-lg -mt-0.5 border-t border-white/10" />
            <span className="text-[9px] text-gray-400 mt-0.5 font-medium">Tầm mắt của bạn</span>
          </div>
        </div>

        {/* Thông số kỹ thuật chuyên môn (Cinema Specs) */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-gray-400 block mb-1">Khoảng cách</span>
              <span className="text-base font-extrabold text-white">{data.distance} mét</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Tới màn chiếu</span>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-gray-400 block mb-1">Góc mở tầm nhìn (FOV)</span>
              <span className="text-base font-extrabold text-cyan-400">{data.fov}°</span>
              <span className="text-[10px] text-cyan-500/70 block mt-0.5">{data.fov >= 36 ? "Chuẩn THX" : "Toàn cảnh"}</span>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-gray-400 block mb-1">Âm thanh vòm</span>
              <span className="text-base font-extrabold text-yellow-400 flex items-center justify-center gap-1">
                <Volume2 className="w-4 h-4" /> {data.isSweetSpot ? "100%" : "88%"}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">{data.centerRating}</span>
            </div>
          </div>

          {/* Nhận xét chuyên gia rạp chiếu */}
          <div className="bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                {data.level}
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {data.desc}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Đóng xem lại
            </button>

            {onConfirmSelect && (
              <button
                onClick={() => {
                  onConfirmSelect(seat);
                  onClose();
                }}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                  isSelected
                    ? "bg-red-600/30 text-red-400 border border-red-500/40 hover:bg-red-600/40"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-900/40"
                }`}
              >
                {isSelected ? (
                  <>
                    <X className="w-4 h-4" /> Bỏ chọn ghế này
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Chọn ngay ghế {seat.id}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
