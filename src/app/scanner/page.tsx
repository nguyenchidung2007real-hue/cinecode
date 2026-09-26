"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Key,
  RefreshCw,
  ArrowLeft,
  Clock,
  MapPin,
  Film,
  User,
  History,
  QrCode,
  Sparkles,
} from "lucide-react";
import { TicketRecord } from "@/lib/ticketStore";

// Web Audio API Synth phát âm thanh phản hồi không cần file mp3 ngoài
class SoundFeedback {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(880, now); // Note A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // Note E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio error
    }
  }

  playWarning() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore audio error
    }
  }
}

const soundManager = new SoundFeedback();

interface ScanHistoryItem {
  id: string;
  token: string;
  outcome: "checked_in" | "already_used" | "invalid" | "not_found";
  movieTitle?: string;
  seats?: string[];
  timestamp: string;
}

export default function StaffScannerPage() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [staffPasscode, setStaffPasscode] = useState<string>("");
  const [selectedGate, setSelectedGate] = useState<string>("Cổng 01 - Screen 1 (Beta Xuân Thủy)");
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  const [scanResult, setScanResult] = useState<{
    status: "checked_in" | "already_used" | "invalid" | "not_found" | "error";
    message: string;
    ticket?: TicketRecord;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const scannerRef = useRef<unknown>(null);
  const html5QrCodeId = "reader";

  // Khởi tạo passcode từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cinemax_staff_secret") || "";
    setStaffPasscode(saved);
  }, []);

  const handleSavePasscode = (code: string) => {
    setStaffPasscode(code);
    localStorage.setItem("cinemax_staff_secret", code);
    setShowConfigModal(false);
  };

  // Xử lý gửi token vé lên API POST /api/tickets/check-in
  const handleCheckInToken = async (token: string) => {
    if (!token.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (staffPasscode.trim()) {
        headers["Authorization"] = `Bearer ${staffPasscode.trim()}`;
      }

      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers,
        body: JSON.stringify({
          token: token.trim(),
          scannedBy: selectedGate,
        }),
      });

      const data = await res.json();

      if (res.status === 200 && data.outcome === "checked_in") {
        soundManager.playSuccess();
        const ticket: TicketRecord = data.ticket;
        setScanResult({
          status: "checked_in",
          message: "VÉ HỢP LỆ • CHECK-IN THÀNH CÔNG",
          ticket,
        });

        setScanHistory((prev) => [
          {
            id: Date.now().toString(),
            token,
            outcome: "checked_in",
            movieTitle: ticket.movieTitle,
            seats: ticket.seats,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
          },
          ...prev.slice(0, 19),
        ]);
      } else if (res.status === 409 || data.outcome === "already_used") {
        soundManager.playWarning();
        const ticket: TicketRecord = data.ticket;
        const usedTime = ticket?.usedAt ? new Date(ticket.usedAt).toLocaleTimeString("vi-VN") : "trước đó";
        setScanResult({
          status: "already_used",
          message: `CẢNH BÁO: VÉ ĐÃ DÙNG! (Đã check-in lúc ${usedTime})`,
          ticket,
        });

        setScanHistory((prev) => [
          {
            id: Date.now().toString(),
            token,
            outcome: "already_used",
            movieTitle: ticket?.movieTitle,
            seats: ticket?.seats,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
          },
          ...prev.slice(0, 19),
        ]);
      } else if (data.outcome === "not_found") {
        soundManager.playWarning();
        setScanResult({
          status: "not_found",
          message: "KHÔNG TÌM THẤY VÉ TRONG HỆ THỐNG",
        });
      } else {
        soundManager.playWarning();
        setScanResult({
          status: "invalid",
          message: data.error || "MÃ VÉ KHÔNG HỢP LỆ / SAI CHỮ KÝ HMAC",
        });
      }
    } catch (err) {
      console.error("Lỗi khi gọi API check-in:", err);
      soundManager.playWarning();
      setScanResult({
        status: "error",
        message: "LỖI KẾT NỐI MÁY CHỦ KHI SOÁT VÉ",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Khởi động Camera Scanner bằng thư viện html5-qrcode
  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode(html5QrCodeId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          handleCheckInToken(decodedText);
        },
        () => {
          // Frame không có QR code
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Lỗi mở camera:", err);
      alert("Không thể truy cập camera. Vui lòng cấp quyền camera hoặc dùng chế độ nhập mã thủ công.");
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as { stop: () => Promise<void> };
        await scanner.stop();
      } catch (err) {
        console.error("Lỗi dừng camera:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Nút test nhanh: lấy vé mẫu gần nhất trong LocalStorage để kiểm thử
  const handleTestWithLatestLocalTicket = () => {
    try {
      const stored = localStorage.getItem("cinemax_tickets");
      if (stored) {
        const list = JSON.parse(stored);
        if (list.length > 0 && list[0].qrToken) {
          setManualToken(list[0].qrToken);
          handleCheckInToken(list[0].qrToken);
          return;
        }
      }
      alert("Chưa có vé nào trong Ví vé của máy này để test. Hãy đặt 1 vé trên trang chủ trước!");
    } catch {
      alert("Lỗi đọc vé mẫu");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      {/* Top Header dành riêng cho nhân viên */}
      <header className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-colors"
              title="Về Trang Chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  CINEMAX STAFF • SOÁT VÉ
                </span>
                <span className="text-[10px] bg-accent-red/20 text-accent-red border border-accent-red/30 px-1.5 py-0.2 rounded font-bold">
                  BETA XUÂN THỦY
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Xác thực mã QR chữ ký HMAC & chống dùng vé kép thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundManager.enabled = next;
              }}
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-neutral-800 border-neutral-700 text-neutral-500"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              title="Cài đặt mã phân quyền nhân viên"
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Phân quyền</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Khung Camera & Quét mã (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Cụm chọn cổng soát vé */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Vị trí trực:</span>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-accent-cyan"
            >
              <option value="Cổng 01 - Screen 1 (Beta Xuân Thủy)">Cổng 01 - Screen 1</option>
              <option value="Cổng 02 - Screen 2 (Beta Xuân Thủy)">Cổng 02 - Screen 2</option>
              <option value="Cổng 03 - IMAX Laser (Beta Xuân Thủy)">Cổng 03 - IMAX Laser</option>
            </select>
          </div>

          {/* KHUNG QUÉT CAMERA */}
          <div className="relative bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[320px]">
            <div id={html5QrCodeId} className="w-full h-full min-h-[300px]" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-neutral-900/95">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-700">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Camera Đang Tắt</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mt-1">
                    Bật camera trên điện thoại hoặc máy tính bảng để quét mã QR vé khách hàng.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật Camera Quét Mã</span>
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={stopCamera}
                  className="px-5 py-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-rose-400 border border-rose-500/40 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Dừng Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* NHẬP MÃ THỦ CÔNG HOẶC TEST NHANH */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Nhập Mã Token Thủ Công (Dự Phòng / Test)
              </span>
              <button
                onClick={handleTestWithLatestLocalTicket}
                className="text-[11px] text-accent-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>Thử với vé vừa đặt trên máy</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Dán chuỗi token vé: TICKET-123456-ABC.3f7a..."
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-accent-cyan"
              />
              <button
                onClick={() => handleCheckInToken(manualToken)}
                disabled={isProcessing || !manualToken.trim()}
                className="px-4 py-2 rounded-xl bg-accent-cyan text-neutral-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Kiểm tra"}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả Quét Vé & Lịch Sử (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* MÀN HÌNH KẾT QUẢ SOÁT VÉ HIỆN TẠI */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Kết Quả Soát Vé Tức Thì
            </span>

            {scanResult ? (
              <div
                className={`rounded-2xl border p-5 shadow-2xl transition-all ${
                  scanResult.status === "checked_in"
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                    : scanResult.status === "already_used"
                    ? "bg-rose-950/40 border-rose-500/60 text-rose-200 animate-pulse"
                    : "bg-amber-950/40 border-amber-500/60 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {scanResult.status === "checked_in" ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : scanResult.status === "already_used" ? (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">
                      {scanResult.message}
                    </h3>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Thời điểm quét: {new Date().toLocaleTimeString("vi-VN")}
                    </p>
                  </div>
                </div>

                {/* Thông tin vé chi tiết */}
                {scanResult.ticket && (
                  <div className="bg-black/40 rounded-xl p-3 border border-white/10 space-y-2 text-xs text-white">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-[10px] text-neutral-400">
                        {scanResult.ticket.bookingId}
                      </span>
                      <span className="font-extrabold text-amber-400">
                        {scanResult.ticket.format}
                      </span>
                    </div>

                    <div className="font-black text-sm text-white line-clamp-1">
                      {scanResult.ticket.movieTitle}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Phòng & Suất:</span>
                        <span>{scanResult.ticket.roomName} • {scanResult.ticket.showTime}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Ghế khách ngồi:</span>
                        <span className="font-extrabold text-accent-cyan text-sm">
                          {scanResult.ticket.seats.join(", ")}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-neutral-500 block text-[10px]">Khách hàng:</span>
                        <span>{scanResult.ticket.customerName} - {scanResult.ticket.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs">
                <QrCode className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
                <p>Chưa có lượt quét nào. Hãy hướng camera vào mã QR vé của khách.</p>
              </div>
            )}
          </div>

          {/* NHẬT KÝ SOÁT VÉ GẦN ĐÂY */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-accent-cyan" />
                Nhật Ký Ca Trực ({scanHistory.length})
              </span>
              {scanHistory.length > 0 && (
                <button
                  onClick={() => setScanHistory([])}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {scanHistory.length === 0 ? (
                <p className="text-[11px] text-neutral-600 text-center py-4">
                  Chưa có lịch sử soát vé trong phiên làm việc này.
                </p>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800"
                  >
                    <div>
                      <div className="font-semibold text-white truncate max-w-[180px]">
                        {item.movieTitle || "Mã vé ngoài"}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {item.seats ? `Ghế: ${item.seats.join(", ")}` : item.token.slice(0, 16) + "..."} • {item.timestamp}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.outcome === "checked_in"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {item.outcome === "checked_in" ? "HỢP LỆ" : "ĐÃ DÙNG"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Cài Đặt Passcode Nhân Viên */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full space-y-4 text-white">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base">Phân Quyền Nhân Viên Soát Vé</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Nhập mã bí mật <strong>ADMIN_SYNC_SECRET</strong> được quản lý rạp cấp. Mã này được lưu an toàn trong máy nhân viên để gửi kèm yêu cầu soát vé.
            </p>

            <input
              type="password"
              defaultValue={staffPasscode}
              id="staff-passcode-input"
              placeholder="Nhập secret (để trống nếu môi trường dev)"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-cyan"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("staff-passcode-input") as HTMLInputElement;
                  handleSavePasscode(input?.value || "");
                }}
                className="px-4 py-2 rounded-xl bg-accent-red hover:bg-accent-redHover text-xs font-bold text-white"
              >
                Lưu vào máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
