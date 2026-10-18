"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, Film, Sparkles, Key, Check } from "lucide-react";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/admin";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = safeNext(searchParams.get("from"));

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu quản trị.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Mật khẩu không chính xác.");
        setIsLoading(false);
        return;
      }

      // Đăng nhập thành công -> chuyển tiếp thẳng tới trang quản trị (hard navigation để nạp cookie phiên tức thì)
      window.location.href = fromUrl;
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black text-neutral-300 uppercase tracking-wider">
              Mật khẩu quản trị viên
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Ẩn mật khẩu</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Hiện mật khẩu</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu quản trị..."
              disabled={isLoading}
              autoFocus
              className="w-full pl-10 pr-11 py-3 bg-black/40 border border-white/15 focus:border-[#e71a0f] rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white z-10 cursor-pointer"
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick-fill & default password preview card */}
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-300 min-w-0">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                Mặc định: <strong className="text-emerald-400 font-mono font-bold tracking-wide">cinemax2026</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPassword("cinemax2026");
                setShowPassword(true);
              }}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              Tự động điền
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#e71a0f] hover:bg-[#c81007] text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all duration-200 shadow-lg shadow-[#e71a0f]/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang chuyển hướng vào hệ thống...</span>
            </>
          ) : (
            <span>ĐĂNG NHẬP HỆ THỐNG QUẢN TRỊ</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-neutral-100 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e71a0f]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors font-bold bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ CineMax</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header Icon */}
        <div className="text-center">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-[#e71a0f] to-amber-500 shadow-xl shadow-[#e71a0f]/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
            Hệ Thống Quản Trị Rạp Chiếu
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            CINEMAX CULTUREPLEX • EXECUTIVE COMMAND CENTER
          </p>
        </div>

        {/* Card Form wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="bg-[#13151f] border border-white/10 rounded-2xl p-8 text-center text-neutral-400">Đang tải biểu mẫu...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="text-center text-[11px] text-neutral-500 leading-relaxed">
          Bảo mật phiên đăng nhập qua HttpOnly Cookie đã ký HMAC. Ngăn chặn truy cập trái phép và bảo vệ an ninh hệ thống vé rạp.
        </p>
      </div>
    </div>
  );
}
