"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Ticket, X, Copy, Check, Volume2, VolumeX, Flame } from "lucide-react";

interface CustomerAtmosphereProps {
  isHalloween?: boolean;
}

const LIVE_ACTIVITIES = [
  { id: 1, icon: "🎟️", text: "Khán giả tại CineMax Bà Triệu vừa đặt 2 vé VIP", movie: "Dune: Phần Hai" },
  { id: 2, icon: "🍿", text: "Vừa có đơn mua kèm Combo Bắp Phô Mai 60oz", movie: "Conan: Ngôi Sao 5 Cánh" },
  { id: 3, icon: "🎃", text: "Khán giả Minh Anh vừa săn mã ưu đãi thành công", movie: "Giảm 30.000đ vé phim" },
  { id: 4, icon: "⚡", text: "Suất chiếu 20:30 phòng IMAX Laser", movie: "Chỉ còn 6 ghế trống" },
  { id: 5, icon: "🎬", text: "Khán giả Tuấn Kiệt vừa thanh toán xong qua VNPay", movie: "Godzilla x Kong" },
];

export const CustomerAtmosphere: React.FC<CustomerAtmosphereProps> = ({ isHalloween = false }) => {
  // 1. Mouse Spotlight Tracker (Ambient Cursor Follower)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 2. Live Activity Ticker (Thời gian thực)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isTickerVisible, setIsTickerVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 11000);
    return () => clearInterval(timer);
  }, []);

  // 3. Spooky Pumpkin Treat Box Modal (Hộp Quà Lễ Hội Halloween)
  const [isTreatModalOpen, setIsTreatModalOpen] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  const handleCopyVoucher = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 3000);
    } catch {}
  };

  // 4. Subtle Audio Feedback Engine (Web Audio API)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChimeSound = () => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isHalloween ? "sawtooth" : "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(isHalloween ? 330 : 523.25, now);
      osc.frequency.exponentialRampToValueAtTime(isHalloween ? 660 : 783.99, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  };

  if (!isClient) return null;

  const currentActivity = LIVE_ACTIVITIES[currentActivityIndex];

  return (
    <>
      {/* =========================================================================
          1. AMBIENT CURSOR LIGHT SPOTLIGHT LAYER (GPU Accelerated Light Beam)
          ========================================================================= */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 hidden md:block"
        style={{
          background: isHalloween
            ? `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 117, 24, 0.11), rgba(138, 43, 226, 0.07), transparent 75%)`
            : `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(229, 9, 20, 0.08), rgba(245, 197, 24, 0.04), transparent 75%)`,
        }}
      />

      {/* =========================================================================
          2. HALLOWEEN ATMOSPHERIC SPOOKY LAYERS (Only active when isHalloween = true)
          ========================================================================= */}
      {isHalloween && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          {/* A. Bầy Dơi Bay Lượn Xuyên Màn Đêm (Flying Bats) */}
          <div className="absolute animate-bat-fly-1 top-0 left-0 text-[#FF7518]/70 drop-shadow-[0_0_8px_rgba(255,117,24,0.6)]">
            <svg width="48" height="28" viewBox="0 0 64 36" fill="currentColor" className="animate-bat-wing">
              <path d="M32 14c-4-8-12-12-22-10 4 6 5 14 2 20 6-3 12-2 16 2 2-6 3-8 4-12 1 4 2 6 4 12 4-4 10-5 16-2-3-6-2-14 2-20-10-2-18 2-22 10z" />
            </svg>
          </div>

          <div className="absolute animate-bat-fly-2 top-0 left-0 text-purple-400/60 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
            <svg width="38" height="22" viewBox="0 0 64 36" fill="currentColor" className="animate-bat-wing">
              <path d="M32 14c-4-8-12-12-22-10 4 6 5 14 2 20 6-3 12-2 16 2 2-6 3-8 4-12 1 4 2 6 4 12 4-4 10-5 16-2-3-6-2-14 2-20-10-2-18 2-22 10z" />
            </svg>
          </div>

          {/* B. Mạng Nhện Góc Trên Bên Trái (Spiderweb Top-Left) */}
          <div className="absolute top-0 left-0 w-36 h-36 opacity-35 text-[#FF7518]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 0 L100 0" />
              <path d="M0 0 L0 100" />
              <path d="M0 0 L90 90" />
              <path d="M0 0 L50 90" />
              <path d="M0 0 L90 50" />
              <path d="M20 0 Q20 20 0 20" />
              <path d="M40 0 Q40 40 0 40" />
              <path d="M65 0 Q65 65 0 65" />
              <path d="M90 0 Q90 90 0 90" />
            </svg>
          </div>

          {/* C. Mạng Nhện Góc Trên Phải & Chú Nhện Đu Đưa (Spiderweb & Swinging Spider Top-Right) */}
          <div className="absolute top-0 right-0 w-36 h-36 opacity-35 text-[#FF7518]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="transform scale-x-[-1]">
              <path d="M0 0 L100 0" />
              <path d="M0 0 L0 100" />
              <path d="M0 0 L90 90" />
              <path d="M0 0 L50 90" />
              <path d="M0 0 L90 50" />
              <path d="M20 0 Q20 20 0 20" />
              <path d="M40 0 Q40 40 0 40" />
              <path d="M65 0 Q65 65 0 65" />
              <path d="M90 0 Q90 90 0 90" />
            </svg>
          </div>

          {/* Chú nhện đu đưa từ trần góc phải */}
          <div className="absolute top-0 right-14 flex flex-col items-center animate-spider-swing">
            <div className="w-[1px] h-16 bg-gradient-to-b from-white/30 to-orange-400/80" />
            <div className="text-sm select-none filter drop-shadow-[0_2px_4px_rgba(255,117,24,0.6)]">
              🕷️
            </div>
          </div>

          {/* D. Đốm Sáng Ma Quái Bay Lơ Lửng (Glowing Floating Embers) */}
          <div className="absolute bottom-10 left-[15%] w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_12px_#FF7518] animate-float-ember" />
          <div className="absolute bottom-24 right-[25%] w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#A855F7] animate-float-ember" style={{ animationDelay: "1.8s" }} />
          <div className="absolute bottom-32 left-[40%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_#F59E0B] animate-float-ember" style={{ animationDelay: "2.6s" }} />
        </div>
      )}

      {/* =========================================================================
          3. LIVE ACTIVITY & TICKET BOOKING TICKER (Social Proof at Bottom-Left)
          ========================================================================= */}
      {isTickerVisible && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-30 max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className={`p-3 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center justify-between gap-3 text-xs transition-all ${
            isHalloween
              ? "bg-[#140824]/90 border-orange-500/30 text-orange-200 shadow-[0_4px_24px_rgba(255,117,24,0.15)]"
              : "bg-[#11141F]/90 border-white/10 text-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{currentActivity.icon}</span>
              <div className="min-w-0 leading-tight">
                <div className="text-[11px] text-neutral-400 truncate">{currentActivity.text}</div>
                <div className={`font-bold truncate ${isHalloween ? "text-orange-300" : "text-white"}`}>
                  {currentActivity.movie}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsTickerVisible(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. FLOATING HALLOWEEN TREAT BOX & AUDIO CONTROLS (Bottom Right)
          ========================================================================= */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-30 flex flex-col items-end gap-2.5">
        {/* Nút Bật/Tắt Hiệu Ứng Âm Thanh Rạp */}
        <button
          type="button"
          onClick={() => {
            const next = !isAudioEnabled;
            setIsAudioEnabled(next);
            if (next) playChimeSound();
          }}
          className={`p-2.5 rounded-full border shadow-lg backdrop-blur-md transition-all text-xs flex items-center gap-1.5 ${
            isAudioEnabled
              ? isHalloween
                ? "bg-orange-500 text-white border-orange-400 shadow-orange-500/40"
                : "bg-[#E50914] text-white border-red-500 shadow-red-900/40"
              : "bg-black/60 text-neutral-400 border-white/10 hover:text-white"
          }`}
          title={isAudioEnabled ? "Tắt âm thanh tương tác" : "Bật âm thanh tương tác rạp"}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[10px] font-bold hidden sm:inline">
            {isAudioEnabled ? "Âm Thanh BẬT" : "Âm Thanh TẮT"}
          </span>
        </button>

        {/* Floating Jack-o'-Lantern Treat Button (Khi chế độ Halloween được kích hoạt) */}
        {isHalloween && (
          <button
            type="button"
            onClick={() => {
              playChimeSound();
              setIsTreatModalOpen(true);
            }}
            className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF7518] to-purple-600 text-white font-black text-xs shadow-[0_4px_25px_rgba(255,117,24,0.45)] hover:scale-105 active:scale-95 transition-all border border-orange-400 cursor-pointer animate-neon-pulse"
          >
            <span className="text-xl animate-bounce">🎃</span>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-[9px] uppercase tracking-wider text-orange-200 font-extrabold">Hộp Quà Lễ Hội</div>
              <div className="text-white font-black">Nhận Mã 30k!</div>
            </div>
          </button>
        )}
      </div>

      {/* =========================================================================
          5. MODAL HỘP QUÀ HALLOWEEN VOUCHER (Interactive Spooky Gift Box)
          ========================================================================= */}
      {isTreatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#1E0C30] via-[#150722] to-[#0D0417] border border-orange-500/40 shadow-[0_0_50px_rgba(255,117,24,0.35)] text-center text-white space-y-4">
            {/* Nút đóng */}
            <button
              onClick={() => setIsTreatModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Bí Ngô Lớn */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF7518] to-purple-600 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,117,24,0.5)] animate-bounce">
              🎃
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/40">
                TRICK OR TREAT • CINEMAX HALLOWEEN 2026
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-2">
                BẠN ĐÃ MỞ ĐƯỢC VOUCHER 30.000Đ!
              </h3>
              <p className="text-xs text-orange-200/80 mt-1 max-w-sm mx-auto">
                Áp dụng trực tiếp khi đặt vé xem bất kỳ bộ phim điện ảnh hoặc phim kinh dị nào trong mùa lễ hội Halloween năm nay.
              </p>
            </div>

            {/* Mã Voucher Box */}
            <div className="p-4 rounded-2xl bg-black/50 border border-dashed border-orange-500/50 flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Mã Giảm Giá Độc Quyền</span>
                <span className="text-lg font-mono font-black text-orange-400 tracking-wider">SPOOKY30K</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playChimeSound();
                  handleCopyVoucher("SPOOKY30K");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                  hasCopiedCode
                    ? "bg-emerald-500 text-white"
                    : "bg-[#FF7518] hover:bg-[#e0620f] text-white"
                }`}
              >
                {hasCopiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã Chép Mã!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Mã</span>
                  </>
                )}
              </button>
            </div>

            {/* Nút Hành Động Đặt Vé */}
            <button
              type="button"
              onClick={() => {
                setIsTreatModalOpen(false);
                const el = document.getElementById("commercial-tabs");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Dùng Mã Đặt Vé Ngay Bây Giờ</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
