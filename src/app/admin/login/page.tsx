"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from") || "/admin";

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

      // Đăng nhập thành công -> chuyển tiếp tới trang quản trị
      router.push(fromUrl);
      router.refresh();
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0f1826] border border-[#25324a] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#8a99b5] uppercase tracking-wider mb-2">
            Mật khẩu quản trị viên
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a99b5]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              disabled={isLoading}
              autoFocus
              className="w-full pl-10 pr-11 py-2.5 bg-[#070b14] border border-[#25324a] focus:border-accent-gold rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8a99b5] hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1.5">
            Mật khẩu riêng biệt được phân quyền trong biến môi trường <code className="text-accent-gold/80">ADMIN_LOGIN_PASSWORD</code>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-accent-gold hover:bg-[#a8871f] text-black font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-black/40 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <span>Đăng Nhập Quản Trị</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#8a99b5] hover:text-[#d9b95c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ CineMax</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-[#0f1826] border border-[#25324a] shadow-xl mb-4">
            <ShieldCheck className="w-10 h-10 text-accent-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Quản Trị Rạp Chiếu</h1>
          <p className="text-sm text-[#8a99b5] mt-1">CineMax AI • Beta Cinemas Management Portal</p>
        </div>

        {/* Card Form wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="bg-[#0f1826] border border-[#25324a] rounded-2xl p-8 text-center text-neutral-400">Đang tải biểu mẫu...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Bảo mật phiên đăng nhập qua HttpOnly Cookie đã ký HMAC. Không để lộ secret ra giao diện.
        </p>
      </div>
    </div>
  );
}
