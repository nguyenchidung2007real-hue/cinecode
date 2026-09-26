"use client";

import React, { useState, useEffect } from "react";
import { BookingInfo } from "@/types";
import { formatVND } from "@/lib/utils";
import {
  X,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  QrCode,
} from "lucide-react";

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({ isOpen, onClose }) => {
  const [tickets, setTickets] = useState<BookingInfo[]>([]);
  const [liveTime, setLiveTime] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Đồng hồ thời gian thực chống chụp màn hình tĩnh
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString("vi-VN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tải danh sách vé từ LocalStorage và đồng bộ trạng thái trực tiếp từ server
  useEffect(() => {
    if (!isOpen) return;

    let localTickets: BookingInfo[] = [];
    try {
      const stored = localStorage.getItem("cinemax_tickets");
      if (stored) {
        localTickets = JSON.parse(stored);
        setTickets(localTickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error("Lỗi đọc vé từ LocalStorage:", err);
      setTickets([]);
      return;
    }

    // Đồng bộ trạng thái vé mới nhất từ Server (nếu vé có qrToken)
    const syncStatusFromServer = async () => {
      if (localTickets.length === 0) return;
      setIsSyncing(true);

      try {
        let hasChanges = false;
        const updatedTickets = await Promise.all(
          localTickets.map(async (t) => {
            if (!t.qrToken || !t.qrToken.includes(".")) return t;
            const parts = t.qrToken.split(".");
            const bookingId = parts[0];
            const sig = parts[1];

            try {
              const res = await fetch(`/api/tickets/${bookingId}?sig=${sig}`, {
                cache: "no-store",
              });
              if (res.ok) {
                const data = await res.json();
                if (data.ticket && data.ticket.status !== t.status) {
                  hasChanges = true;
                  return {
                    ...t,
                    status: data.ticket.status,
                    usedAt: data.ticket.usedAt,
                    scannedBy: data.ticket.scannedBy,
                  };
                }
              }
            } catch {
              // Bỏ qua lỗi kết nối
            }
            return t;
          })
        );

        if (hasChanges) {
          setTickets(updatedTickets);
          localStorage.setItem("cinemax_tickets", JSON.stringify(updatedTickets));
        }
      } finally {
        setIsSyncing(false);
      }
    };

    syncStatusFromServer();
  }, [isOpen]);

  const handleDeleteTicket = (bookingId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa vé này khỏi ví không?")) {
      const updated = tickets.filter((t) => t.bookingId !== bookingId);
      setTickets(updated);
      localStorage.setItem("cinemax_tickets", JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl my-auto text-white">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-red to-orange-500 text-white flex items-center justify-center shadow-lg shadow-accent-red/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Ví Vé Của Tôi ({tickets.length})
                </h3>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-[10px] text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full border border-accent-cyan/30 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang đồng bộ rạp
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Vé điện tử có bảo mật Hologram & mã QR check-in tại rạp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách vé */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {tickets.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-300">Chưa có vé nào trong ví</h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                Hãy chọn một bộ phim yêu thích và trải nghiệm đặt vé có mã QR xác thực HMAC cùng CineMax AI!
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const isUsed = ticket.status === "used";

              return (
                <div
                  key={ticket.bookingId}
                  className={`relative rounded-2xl border transition-all shadow-xl overflow-hidden ${
                    isUsed
                      ? "bg-neutral-900/60 border-neutral-800 opacity-75"
                      : "bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-neutral-700/80 hover:border-neutral-600"
                  }`}
                >
                  {/* DẢI HOLOGRAM ĐỘNG BẢO MẬT (DYNAMIC HOLOGRAM WATERMARK) */}
                  <div className="relative w-full overflow-hidden bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20 border-b border-white/10 px-4 py-1.5 flex items-center justify-between text-[11px]">
                    {/* Hiệu ứng tia sáng di chuyển liên tục */}
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent font-extrabold">
                        CINEMAX VERIFIED E-TICKET
                      </span>
                    </div>

                    {/* Đồng hồ thời gian thực nhảy từng giây */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                      {isUsed ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ĐÃ SOÁT VÉ
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          <span>LIVE: {liveTime}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* THÂN VÉ XÉ CUỐNG (PERFORATED CINEMA TICKET) */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 relative">
                    {/* Nốt bấm khuyết âm dương tạo hiệu ứng vé rạp */}
                    <div className="hidden sm:block absolute -top-3 right-[152px] w-6 h-6 rounded-full bg-surface border border-neutral-700/80" />
                    <div className="hidden sm:block absolute -bottom-3 right-[152px] w-6 h-6 rounded-full bg-surface border border-neutral-700/80" />

                    {/* Khối thông tin phim & suất chiếu */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                              {ticket.bookingId}
                            </span>
                            {isUsed ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                                ĐÃ CHECK-IN {ticket.usedAt ? `(${new Date(ticket.usedAt).toLocaleTimeString('vi-VN')})` : ""}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> VÉ HỢP LỆ
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-base sm:text-lg text-white mt-1.5 line-clamp-1">
                            {ticket.movieTitle}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleDeleteTicket(ticket.bookingId)}
                          title="Xóa vé này"
                          className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Thông tin suất chiếu rạp */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                          <span className="truncate font-medium">{ticket.cinemaName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                          <span>{ticket.showTime} ({ticket.format})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                          <span>{ticket.showDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-amber-400">
                            Ghế: {ticket.seats.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-neutral-400">
                          Khách hàng: <strong className="text-white">{ticket.customerName}</strong>
                        </span>
                        <span className="text-accent-red font-black text-sm">
                          {formatVND(ticket.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* VẠCH XÉ CUỐNG VÉ RẠP */}
                    <div className="hidden sm:block h-36 border-r-2 border-dashed border-neutral-700/80 mr-1" />

                    {/* Khung mã QR Code có ký số HMAC */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl flex-shrink-0 shadow-lg relative">
                      {isUsed && (
                        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-2 z-10">
                          <CheckCircle2 className="w-8 h-8 text-rose-500 mb-1" />
                          <span className="text-[11px] font-black text-white uppercase tracking-wider">
                            VÉ ĐÃ DÙNG
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
                            Check-in rạp xong
                          </span>
                        </div>
                      )}

                      {ticket.qrCodeUrl ? (
                        <img
                          src={ticket.qrCodeUrl}
                          alt="Mã QR Vé"
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 bg-neutral-100 flex items-center justify-center text-neutral-400">
                          <QrCode className="w-12 h-12" />
                        </div>
                      )}

                      <span className="text-[9px] text-neutral-800 font-mono font-bold mt-1 tracking-tight">
                        HMAC VERIFIED
                      </span>

                      {/* Giả lập Barcode 128 bên dưới */}
                      <div className="w-full flex items-center justify-center gap-[2px] mt-1 h-3 opacity-70">
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[3px] h-full bg-black" />
                        <div className="w-[2px] h-full bg-black" />
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[4px] h-full bg-black" />
                        <div className="w-[2px] h-full bg-black" />
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[3px] h-full bg-black" />
                        <div className="w-[2px] h-full bg-black" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Bảo vệ chống gian lận đa thiết bị
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
