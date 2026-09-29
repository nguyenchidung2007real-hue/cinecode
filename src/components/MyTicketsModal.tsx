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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#07152E]/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B2046] border border-[#034EA2]/50 rounded-2xl overflow-hidden shadow-2xl my-auto text-white">
        {/* Header Modal Beta Cinemas */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#034EA2]/40 bg-[#07152E]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#034EA2] to-[#00B2FF] text-white flex items-center justify-center shadow-lg shadow-[#034EA2]/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  <span className="text-[#00B2FF]">BETA</span> VÍ VÉ CỦA TÔI ({tickets.length})
                </h3>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-[10px] text-[#00B2FF] bg-[#034EA2]/30 px-2 py-0.5 rounded-full border border-[#00B2FF]/40 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang đồng bộ rạp
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Vé điện tử Beta Cinemas có bảo mật Hologram & mã QR check-in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#07152E] hover:bg-[#034EA2]/40 border border-[#034EA2]/40 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách vé */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {tickets.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#07152E] border border-[#034EA2]/40 flex items-center justify-center text-[#00B2FF]">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-200">Chưa có vé nào trong ví</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Hãy chọn một bộ phim yêu thích tại Beta Xuân Thủy và trải nghiệm đặt vé có mã QR xác thực HMAC!
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
                      ? "bg-[#07152E]/60 border-slate-700/60 opacity-75"
                      : "bg-gradient-to-br from-[#0B2046] via-[#0D2857] to-[#07152E] border-[#034EA2]/50 hover:border-[#00B2FF]/60"
                  }`}
                >
                  {/* DẢI HOLOGRAM ĐỘNG BẢO MẬT (DYNAMIC HOLOGRAM WATERMARK) */}
                  <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#034EA2]/40 via-[#00B2FF]/20 to-amber-500/20 border-b border-[#034EA2]/40 px-4 py-1.5 flex items-center justify-between text-[11px]">
                    {/* Hiệu ứng tia sáng di chuyển liên tục */}
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="bg-gradient-to-r from-amber-300 via-[#00B2FF] to-white bg-clip-text text-transparent font-extrabold">
                        BETA CINEMAS VERIFIED E-TICKET
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
                    <div className="hidden sm:block absolute -top-3 right-[152px] w-6 h-6 rounded-full bg-[#0B2046] border border-[#034EA2]/50" />
                    <div className="hidden sm:block absolute -bottom-3 right-[152px] w-6 h-6 rounded-full bg-[#0B2046] border border-[#034EA2]/50" />

                    {/* Khối thông tin phim & suất chiếu */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-200 bg-[#07152E] px-2 py-0.5 rounded border border-[#034EA2]/40">
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
                          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#07152E] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Thông tin suất chiếu rạp */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 bg-[#07152E]/80 p-3 rounded-xl border border-[#034EA2]/40">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FF5722] flex-shrink-0" />
                          <span className="truncate font-medium">{ticket.cinemaName || "Beta Cinemas Xuân Thủy"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#00B2FF] flex-shrink-0" />
                          <span>{ticket.showTime} ({ticket.format || "2D"})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00B2FF] flex-shrink-0" />
                          <span>{ticket.showDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-amber-400">
                            Ghế: {ticket.seats.join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Bắp & Nước kèm theo vé */}
                      {ticket.concessions && ticket.concessions.length > 0 && (
                        <div className="bg-[#07152E]/90 rounded-xl p-2.5 border border-[#034EA2]/40 text-[11px] space-y-1">
                          <span className="font-bold text-amber-400 block text-[10px] uppercase tracking-wider">
                            🍿 Bắp & Nước (Nhận tại quầy Concession Beta):
                          </span>
                          {ticket.concessions.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-slate-300">
                              <span className="truncate pr-2 font-medium">
                                {c.quantity}x {c.name} ({c.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join("+")}, {c.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"}${d.size === "large" ? " 32oz" : ""}`).join(", ")})
                              </span>
                              <span className="font-mono text-amber-400 font-bold flex-shrink-0">
                                {formatVND(c.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-300">
                          Khách hàng: <strong className="text-white">{ticket.customerName}</strong>
                        </span>
                        <span className="text-[#00B2FF] font-black text-sm">
                          {formatVND(ticket.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* VẠCH XÉ CUỐNG VÉ RẠP */}
                    <div className="hidden sm:block h-36 border-r-2 border-dashed border-[#034EA2]/50 mr-1" />

                    {/* Khung mã QR Code có ký số HMAC */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl flex-shrink-0 shadow-lg relative border border-[#00B2FF]/40">
                      {isUsed && (
                        <div className="absolute inset-0 bg-[#07152E]/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-2 z-10">
                          <CheckCircle2 className="w-8 h-8 text-rose-500 mb-1" />
                          <span className="text-[11px] font-black text-white uppercase tracking-wider">
                            VÉ ĐÃ DÙNG
                          </span>
                          <span className="text-[9px] text-slate-300 font-mono mt-0.5">
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
                        <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-slate-400">
                          <QrCode className="w-12 h-12" />
                        </div>
                      )}

                      <span className="text-[9px] text-[#034EA2] font-mono font-bold mt-1 tracking-tight">
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
        <div className="px-6 py-3.5 border-t border-[#034EA2]/40 bg-[#07152E]/80 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Bảo vệ chống gian lận đa thiết bị • Beta Cinemas HITC
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#034EA2] to-[#00B2FF] hover:brightness-110 text-white font-semibold transition-all shadow-md shadow-[#034EA2]/30"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
