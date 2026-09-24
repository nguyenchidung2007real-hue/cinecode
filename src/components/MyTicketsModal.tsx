"use client";

import React, { useState, useEffect } from "react";
import { BookingInfo } from "@/types";
import { formatVND } from "@/lib/utils";
import { X, Ticket, Calendar, Clock, MapPin, QrCode, Trash2, Printer, ExternalLink } from "lucide-react";

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({ isOpen, onClose }) => {
  const [tickets, setTickets] = useState<BookingInfo[]>([]);

  // Tải danh sách vé từ LocalStorage khi mở modal
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("cinemax_tickets");
        if (stored) {
          setTickets(JSON.parse(stored));
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error("Lỗi đọc vé từ LocalStorage:", err);
        setTickets([]);
      }
    }
  }, [isOpen]);

  const handleDeleteTicket = (bookingId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa vé này khỏi lịch sử không?")) {
      const updated = tickets.filter((t) => t.bookingId !== bookingId);
      setTickets(updated);
      localStorage.setItem("cinemax_tickets", JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl my-auto text-white">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Ví Vé Của Tôi ({tickets.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Danh sách vé điện tử đã đặt & mã QR check-in tại rạp
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
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {tickets.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-300">Chưa có vé nào trong ví</h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                Hãy chọn một bộ phim bạn yêu thích và trải nghiệm quy trình đặt vé thông minh cùng CineMax AI!
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.bookingId}
                className="relative bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 hover:border-neutral-700 transition-all shadow-lg"
              >
                {/* Poster / Phim */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider bg-accent-red/10 px-2 py-0.5 rounded">
                        MÃ VÉ: {ticket.bookingId}
                      </span>
                      <h4 className="font-extrabold text-base sm:text-lg text-white mt-1 line-clamp-1">
                        {ticket.movieTitle}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteTicket(ticket.bookingId)}
                      title="Xóa khỏi lịch sử"
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thông tin suất chiếu */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/80">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <span className="truncate">{ticket.cinemaName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <span>{ticket.showTime} - {ticket.format}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <span>{ticket.showDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-accent-cyan">Ghế: {ticket.seats.join(", ")}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-400">
                      Khách: <strong className="text-white">{ticket.customerName}</strong>
                    </span>
                    <span className="text-accent-red font-black text-sm">
                      {formatVND(ticket.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Khung mã QR Code */}
                {ticket.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl flex-shrink-0 shadow-md">
                    <img
                      src={ticket.qrCodeUrl}
                      alt="Mã QR"
                      className="w-28 h-28 object-contain"
                    />
                    <span className="text-[9px] text-neutral-700 font-mono font-bold mt-1">
                      QUÉT TẠI CỔNG
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
