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
import type { TicketRecord } from "@/lib/ticketStore";

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

  initAndResume() {
    this.initCtx();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
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
  const [staffId, setStaffId] = useState<string>("");
  const [staffPasscode, setStaffPasscode] = useState<string>("");
  const [selectedGate, setSelectedGate] = useState<string>("Cổng 01 - Screen 1 (Beta Xuân Thủy)");
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  const [scanResult, setScanResult] = useState<{
    status: "checked_in" | "already_used" | "invalid" | "not_found" | "error";
    message: string;
    ticket?: TicketRecord;
    scannedAt?: string;
    warning?: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const processingRef = useRef(false);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);
  const staffIdRef = useRef("");
  const passcodeRef = useRef("");
  const gateRef = useRef(selectedGate);

  useEffect(() => { staffIdRef.current = staffId; }, [staffId]);
  useEffect(() => { passcodeRef.current = staffPasscode; }, [staffPasscode]);
  useEffect(() => { gateRef.current = selectedGate; }, [selectedGate]);

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const scannerRef = useRef<unknown>(null);
  const html5QrCodeId = "reader";

  // Khởi tạo thông tin nhân viên từ sessionStorage
  useEffect(() => {
    const savedId = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("cinemax_staff_id")) || "";
    const savedPass =
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("cinemax_staff_secret")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("cinemax_staff_secret")) ||
      "";
    setStaffId(savedId);
    setStaffPasscode(savedPass);
  }, []);

  // Cleanup dừng camera khi rời trang
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSaveStaff = (id: string, code: string) => {
    setStaffId(id);
    setStaffPasscode(code);
    staffIdRef.current = id;
    passcodeRef.current = code;
    try {
      sessionStorage.setItem("cinemax_staff_id", id);
      sessionStorage.setItem("cinemax_staff_secret", code);
      localStorage.setItem("cinemax_staff_secret", code);
    } catch {}
    setShowConfigModal(false);
  };

  // Xử lý gửi token vé lên API POST /api/tickets/check-in
  const handleCheckInToken = async (token: string) => {
    const clean = token.trim();
    if (!clean || processingRef.current) return;
    const last = lastScanRef.current;
    if (last && last.token === clean && Date.now() - last.at < 4000) return; // cùng mã: bỏ qua 4 giây
    processingRef.current = true;
    lastScanRef.current = { token: clean, at: Date.now() };
    setIsProcessing(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (passcodeRef.current.trim()) {
        headers["Authorization"] = `Bearer ${passcodeRef.current.trim()}`;
      }

      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers,
        body: JSON.stringify({
          token: clean,
          staffId: staffIdRef.current.trim(),
          passcode: passcodeRef.current.trim(),
          scannedBy: gateRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const nowStr = new Date().toLocaleTimeString("vi-VN");

      if (res.status === 200 && data.outcome === "checked_in") {
        soundManager.playSuccess();
        const ticket: TicketRecord = data.ticket;
        setScanResult({
          status: "checked_in",
          message: "VÉ HỢP LỆ • CHECK-IN THÀNH CÔNG",
          ticket,
          scannedAt: nowStr,
          warning: data.warning,
        });

        setScanHistory((prev) => [
          {
            id: Date.now().toString(),
            token,
            outcome: "checked_in",
            movieTitle: ticket?.movieTitle,
            seats: ticket?.seats,
            timestamp: nowStr,
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
          scannedAt: nowStr,
        });

        setScanHistory((prev) => [
          {
            id: Date.now().toString(),
            token,
            outcome: "already_used",
            movieTitle: ticket?.movieTitle,
            seats: ticket?.seats,
            timestamp: nowStr,
          },
          ...prev.slice(0, 19),
        ]);
      } else if (data.outcome === "not_found") {
        soundManager.playWarning();
        setScanResult({
          status: "not_found",
          message: "KHÔNG TÌM THẤY VÉ TRONG HỆ THỐNG",
          scannedAt: nowStr,
        });
      } else {
        soundManager.playWarning();
        setScanResult({
          status: "invalid",
          message: data.error || "MÃ VÉ KHÔNG HỢP LỆ / SAI CHỮ KÝ HMAC",
          ticket: data.ticket,
          scannedAt: nowStr,
        });
      }
    } catch (err) {
      console.error("Lỗi khi gọi API check-in:", err);
      soundManager.playWarning();
      setScanResult({
        status: "error",
        message: "LỖI KẾT NỐI MÁY CHỦ KHI SOÁT VÉ",
        scannedAt: new Date().toLocaleTimeString("vi-VN"),
      });
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Khởi động Camera Scanner bằng thư viện html5-qrcode
  const startCamera = async () => {
    soundManager.initAndResume();
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header dành riêng cho nhân viên */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              title="Về Trang Chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  CINEMAX STAFF • SOÁT VÉ
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-bold">
                  BETA XUÂN THỦY
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
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
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              title="Cài đặt mã phân quyền nhân viên ca trực"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Key className="w-4 h-4 text-amber-500" />
              <span>{staffId ? `NV: ${staffId}` : "Ca Trực"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Khung Camera & Quét mã (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Cụm chọn cổng soát vé */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs shadow-sm">
            <span className="text-slate-600 font-medium">Vị trí trực:</span>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
            >
              <option value="Cổng 01 - Screen 1 (Beta Xuân Thủy)">Cổng 01 - Screen 1</option>
              <option value="Cổng 02 - Screen 2 (Beta Xuân Thủy)">Cổng 02 - Screen 2</option>
              <option value="Cổng 03 - IMAX Laser (Beta Xuân Thủy)">Cổng 03 - IMAX Laser</option>
            </select>
          </div>

          {/* KHUNG QUÉT CAMERA */}
          <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center min-h-[320px]">
            <div id={html5QrCodeId} className="w-full h-full min-h-[300px]" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white/95">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">Camera Đang Tắt</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Bật camera trên điện thoại hoặc máy tính bảng để quét mã QR vé khách hàng.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center gap-2 transition-all"
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
                  className="px-5 py-2 rounded-full bg-white/90 hover:bg-white text-rose-600 border border-rose-300 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Dừng Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* NHẬP MÃ THỦ CÔNG HOẶC TEST NHANH */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nhập Mã Token Thủ Công (Dự Phòng / Test)
              </span>
              {process.env.NODE_ENV !== "production" && (
                <button
                  onClick={handleTestWithLatestLocalTicket}
                  className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Thử với vé vừa đặt trên máy (Dev)</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Dán chuỗi token vé: TICKET-123456-ABC.3f7a..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleCheckInToken(manualToken)}
                disabled={isProcessing || !manualToken.trim()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kết Quả Soát Vé Tức Thì
            </span>

            {scanResult ? (
              <div
                className={`rounded-2xl border p-5 shadow-sm transition-all ${
                  scanResult.status === "checked_in"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : scanResult.status === "already_used"
                    ? "bg-rose-50 border-rose-300 text-rose-900 animate-pulse"
                    : "bg-amber-50 border-amber-300 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {scanResult.status === "checked_in" ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : scanResult.status === "already_used" ? (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">
                      {scanResult.message}
                    </h3>
                    <p className="text-[10px] opacity-75 mt-0.5">
                      Thời điểm quét: {scanResult.scannedAt || new Date().toLocaleTimeString("vi-VN")}
                    </p>
                    {scanResult.warning && (
                      <p className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-0.5 mt-1.5 inline-block">
                        ⚠️ {scanResult.warning}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thông tin vé chi tiết */}
                {scanResult.ticket && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 text-xs text-slate-800 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-mono text-[10px] text-slate-500">
                        {scanResult.ticket.bookingId}
                      </span>
                      <span className="font-extrabold text-sky-600">
                        {scanResult.ticket.format}
                      </span>
                    </div>

                    <div className="font-black text-sm text-slate-900 line-clamp-1">
                      {scanResult.ticket.movieTitle}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Phòng & Suất:</span>
                        <span>{scanResult.ticket.roomName} • {scanResult.ticket.showTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Ghế khách ngồi:</span>
                        <span className="font-extrabold text-sky-600 text-sm">
                          {scanResult.ticket.seats.join(", ")}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Khách hàng:</span>
                        <span>{scanResult.ticket.customerName} - {scanResult.ticket.customerPhone}</span>
                      </div>

                      {/* Bắp & Nước giao tại quầy */}
                      {scanResult.ticket.concessions && scanResult.ticket.concessions.length > 0 && (
                        <div className="col-span-2 pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                            🍿 Bắp Nước Nhận Tại Quầy:
                          </span>
                          {scanResult.ticket.concessions.map((c, i) => (
                            <div key={i} className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded-lg flex justify-between items-center border border-slate-200">
                              <span>
                                <strong className="text-slate-900">{c.quantity}x {c.name}</strong> ({c.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join("+")}, {c.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"}${d.size === "large" ? " 32oz" : ""}`).join(", ")})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
                <QrCode className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p>Chưa có lượt quét nào. Hãy hướng camera vào mã QR vé của khách.</p>
              </div>
            )}
          </div>

          {/* NHẬT KÝ SOÁT VÉ GẦN ĐÂY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-600" />
                Nhật Ký Ca Trực ({scanHistory.length})
              </span>
              {scanHistory.length > 0 && (
                <button
                  onClick={() => setScanHistory([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {scanHistory.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">
                  Chưa có lịch sử soát vé trong phiên làm việc này.
                </p>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {item.movieTitle || "Mã vé ngoài"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.seats ? `Ghế: ${item.seats.join(", ")}` : item.token.slice(0, 16) + "..."} • {item.timestamp}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.outcome === "checked_in"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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

      {/* Modal Cài Đặt Thông Tin Nhân Viên Soát Vé */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 text-slate-800 shadow-xl">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">Phân Quyền Nhân Viên Soát Vé</h3>
            </div>
            <p className="text-xs text-slate-500">
              Nhập <strong>Mã nhân viên</strong> và <strong>Mật khẩu ca trực</strong> do rạp cấp. Khi soát vé, thông tin cá nhân sẽ được server xác thực và ghi vết chính xác vào vé.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Mã nhân viên (Staff ID)
                </label>
                <input
                  type="text"
                  defaultValue={staffId}
                  id="staff-id-input"
                  placeholder="Ví dụ: NV01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Mật khẩu ca trực (Passcode)
                </label>
                <input
                  type="password"
                  defaultValue={staffPasscode}
                  id="staff-passcode-input"
                  placeholder="Nhập passcode ca trực"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs text-slate-600 hover:bg-slate-200 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const idInput = document.getElementById("staff-id-input") as HTMLInputElement;
                  const passInput = document.getElementById("staff-passcode-input") as HTMLInputElement;
                  handleSaveStaff(idInput?.value || "", passInput?.value || "");
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white shadow-sm"
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
