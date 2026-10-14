"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  QrCode,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export interface VietQRPaymentProps {
  bookingId: string;
  holdId: string;
  showtimeId: string;
  amount: number;
  qrImageUrl?: string;
  transferContent: string;
  allowMockPayment?: boolean;
  customer?: { name?: string; phone?: string; email?: string };
  concessions?: unknown[];
  posterPath?: string;
  onPaymentVerified: (confirmedTicket: unknown) => void;
  onSwitchToVNPay?: () => void;
}

export function VietQRPaymentModal({
  bookingId,
  holdId,
  showtimeId,
  amount,
  qrImageUrl,
  transferContent,
  allowMockPayment = false,
  customer,
  concessions,
  posterPath,
  onPaymentVerified,
  onSwitchToVNPay,
}: VietQRPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRedirectingVNPay, setIsRedirectingVNPay] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Dọn dẹp tài nguyên khi component unmount (chống memory leak & âm thanh phát ngầm)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Sinh fallback VietQR URL nếu server chưa truyền qrImageUrl
  const resolvedQrUrl =
    qrImageUrl ||
    `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent("CINEMAX AI")}`;

  // Phát âm thanh "Ting-Ting!" máy POS bằng Web Audio API thuần (không tốn file MP3)
  const playTingTingSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(987.77, now, 0.18); // B5 (987.77 Hz)
      playNote(1318.51, now + 0.15, 0.5); // E6 (1318.51 Hz) -> "Ting-Ting!"

      // Tự động đóng AudioContext sau khi âm thanh kết thúc (750ms)
      setTimeout(() => {
        if (ctx.state !== "closed") {
          ctx.close().catch(() => {});
        }
      }, 750);
    } catch {
      // Bỏ qua nếu môi trường chặn autoplay audio
    }
  };

  // Xác thực thanh toán demo qua API gác cổng server (chốt ghế Redis thật)
  const handleSimulateTransfer = async () => {
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/payment/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          holdId,
          showtimeId,
          customer,
          concessions,
          posterPath,
        }),
      });

      const data = (await res.json()) as { error?: string; ticket?: unknown };
      if (!res.ok) {
        throw new Error(data.error || "Không thể xác thực thanh toán trên máy chủ.");
      }

      // Chỉ phát âm thanh Ting-Ting SAU KHI Server đã chốt ghế Redis và duyệt vé thành công
      playTingTingSound();
      setIsPaid(true);
      timeoutRef.current = setTimeout(() => {
        onPaymentVerified(data.ticket);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi kết nối máy chủ khi xác thực thanh toán.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Chuyển hướng sang cổng thanh toán VNPay Sandbox
  const handleSwitchToVNPay = async () => {
    if (onSwitchToVNPay) {
      onSwitchToVNPay();
      return;
    }

    setIsRedirectingVNPay(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/payment/vnpay/create-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, holdId, showtimeId }),
      });
      const data = (await res.json()) as { paymentUrl?: string; error?: string };
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || "Không tạo được đường dẫn thanh toán VNPay.");
      }
      window.location.href = data.paymentUrl;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi kết nối cổng thanh toán VNPay.");
      setIsRedirectingVNPay(false);
    }
  };

  const copyContent = () => {
    void navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto text-white shadow-2xl backdrop-blur-md">
      {/* Thanh tab lựa chọn phương thức thanh toán */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl mb-6 border border-zinc-800">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-accent-red text-white font-medium text-sm shadow-lg"
        >
          <QrCode className="w-4 h-4" />
          Chuyển khoản VietQR
        </button>
        <button
          type="button"
          disabled={isRedirectingVNPay || isSimulating}
          onClick={() => void handleSwitchToVNPay()}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-zinc-400 hover:text-white text-sm transition disabled:opacity-50"
        >
          {isRedirectingVNPay ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent-red" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Cổng VNPay
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isPaid ? (
        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400">Thanh toán thành công!</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Máy chủ đã xác thực nhận {amount.toLocaleString("vi-VN")}đ. Đang xuất vé...
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white p-3 rounded-xl w-56 h-56 mx-auto mb-5 shadow-inner flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedQrUrl}
              alt="Mã thanh toán VietQR CineMax"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div className="space-y-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 text-sm mb-6">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Số tiền:</span>
              <span className="font-bold text-lg text-amber-400">
                {amount.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <code className="bg-zinc-800 px-2 py-0.5 rounded text-emerald-400 font-mono font-semibold">
                  {transferContent}
                </code>
                <button
                  onClick={copyContent}
                  type="button"
                  className="text-zinc-400 hover:text-white transition p-1"
                  title="Sao chép nội dung"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Chỉ hiển thị nút Giả lập chuyển khoản khi allowMockPayment = true từ server */}
          {allowMockPayment && (
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => void handleSimulateTransfer()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang chốt ghế trên máy chủ Redis...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Giả lập đã chuyển khoản thành công (Demo)
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default VietQRPaymentModal;
