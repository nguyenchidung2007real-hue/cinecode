"use client";

import React, { useState } from "react";
import { User, Phone, Mail, ShieldCheck, X, Sparkles, Film, ArrowRight, Check, Zap } from "lucide-react";

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: { name: string; phone: string; email?: string }) => void;
  pendingMovieTitle?: string;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  pendingMovieTitle,
}) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.trim().replace(/[\s.\-()]/g, "");
    if (!cleanPhone) {
      setErrorMessage("Vui lòng nhập Số điện thoại của bạn.");
      return;
    }

    const phoneRegex = /^(?:\+84|84|0)\d{9,10}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage("Số điện thoại không hợp lệ. Vui lòng nhập định dạng 10 chữ số (VD: 0912345678).");
      return;
    }

    const displayName = name.trim() || "Thành Viên CineMax";
    const cleanEmail = email.trim();

    try {
      localStorage.setItem("cinemax_customer_phone", cleanPhone);
      localStorage.setItem("cinemax_customer_name", displayName);
      if (cleanEmail) {
        localStorage.setItem("cinemax_customer_email", cleanEmail);
      }
    } catch {}

    onLoginSuccess({
      name: displayName,
      phone: cleanPhone,
      email: cleanEmail || undefined,
    });
    onClose();
  };

  const handleQuickFill = () => {
    setName("Nguyễn Văn A");
    setPhone("0912345678");
    setEmail("nguyenvana@gmail.com");
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111420] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Modal */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E50914] to-amber-500 text-white shadow-lg shadow-red-900/40">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[#E50914] text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Thành Viên CineMax 2026</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Đăng Nhập Để Mua Vé
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Quý khách vui lòng đăng nhập tài khoản thành viên để chọn ghế, nhận mã vé QR và tích điểm xem phim.
            </p>
          </div>
        </div>

        {/* Badge phim đang chọn nếu có */}
        {pendingMovieTitle && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between gap-2">
            <span className="text-neutral-400">Phim đang đặt:</span>
            <span className="font-bold text-amber-300 truncate">{pendingMovieTitle}</span>
          </div>
        )}

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Số điện thoại thành viên *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-[#E50914] rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Họ và tên của bạn *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-[#E50914] rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              Email nhận vé điện tử (Tùy chọn)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 focus:border-[#E50914] rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Nút điền nhanh tài khoản mẫu */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-neutral-400 text-[11px]">Trải nghiệm nhanh?</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Điền mẫu: Nguyễn Văn A</span>
            </button>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#E50914] to-red-600 hover:from-red-600 hover:to-[#E50914] text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>ĐĂNG NHẬP & TIẾP TỤC ĐẶT VÉ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Cam kết bảo mật */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-neutral-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Tài khoản được lưu an toàn trên thiết bị của bạn cho mọi lần đặt vé sau.</span>
        </div>
      </div>
    </div>
  );
};
