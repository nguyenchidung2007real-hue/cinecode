"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Movie, Seat, BookingInfo } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "@/lib/mockData";
import { formatVND } from "@/lib/utils";
import { X, Check, Ticket, MapPin, Calendar, Clock, Armchair, QrCode, Download, ArrowRight, ArrowLeft, ShieldCheck, Timer, Copy, CreditCard } from "lucide-react";

interface BookingModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBookingSuccess?: (booking: BookingInfo) => void;
}

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "K"];
const SEATS_PER_ROW = 12;

export const BookingModal: React.FC<BookingModalProps> = ({ movie, onClose, onBookingSuccess }) => {
  // Trạng thái các bước (1: Suất chiếu, 2: Chọn ghế, 3: Bắp nước & Thông tin, 4: Quét mã QR thanh toán, 5: Vé điện tử QR)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Chọn rạp và suất chiếu
  const [selectedCinema, setSelectedCinema] = useState(MOCK_CINEMAS[0].name);
  const [selectedDate, setSelectedDate] = useState("2026-09-24");
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [selectedFormat, setSelectedFormat] = useState("2D Phụ Đề");

  // Ghế đã chọn
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Bắp nước (Map comboId -> quantity)
  const [combos, setCombos] = useState<Record<string, number>>({});

  // Thông tin người mua
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phương thức thanh toán (vietqr / momo)
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "momo">("vietqr");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Đếm ngược giữ ghế (300 giây = 5 phút)
  const [timeLeft, setTimeLeft] = useState(300);

  // Kết quả vé sau khi tạo
  const [completedBooking, setCompletedBooking] = useState<BookingInfo | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 4 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Khởi tạo trạng thái ghế ngẫu nhiên
  const seatsMatrix: Seat[][] = useMemo(() => {
    const bookedSeed = ["B4", "B5", "E6", "E7", "F6", "F7", "F8", "G5", "G6", "G7"];

    return ROWS.map((row) => {
      const seatsInRow: Seat[] = [];
      const isCouple = row === "K";
      const isVip = ["E", "F", "G", "H"].includes(row);
      const count = isCouple ? 6 : SEATS_PER_ROW;

      for (let i = 1; i <= count; i++) {
        const id = `${row}${i}`;
        const isBooked = bookedSeed.includes(id);
        const type = isCouple ? "couple" : isVip ? "vip" : "standard";
        const price = isCouple ? 220000 : isVip ? 115000 : 90000;

        seatsInRow.push({
          id,
          row,
          number: i,
          type,
          price,
          status: isBooked ? "booked" : "available",
        });
      }
      return seatsInRow;
    });
  }, [movie]);

  if (!movie) return null;

  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === "booked") return;

    const exists = selectedSeats.find((s) => s.id === seat.id);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        alert("Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt!");
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleUpdateCombo = (comboId: string, delta: number) => {
    setCombos((prev) => {
      const current = prev[comboId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [comboId]: next };
    });
  };

  // Tính tổng tiền
  const seatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const combosTotal = Object.entries(combos).reduce((sum, [id, qty]) => {
    const item = CONCESSION_COMBOS.find((c) => c.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const grandTotal = seatsTotal + combosTotal;

  // Chuyển sang bước thanh toán QR
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Vui lòng điền đầy đủ họ tên và số điện thoại nhận vé!");
      return;
    }
    setTimeLeft(300); // Reset timer 5 phút
    setStep(4);
  };

  // Xác nhận thanh toán & xuất vé chính thức
  const handleConfirmPaid = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitle: movie.title,
          posterPath: movie.posterPath,
          cinemaName: selectedCinema,
          roomName: selectedFormat.includes("IMAX") ? "Phòng IMAX Laser 01" : "Phòng Cinema 03",
          format: selectedFormat,
          showDate: selectedDate,
          showTime: selectedTime,
          seats: selectedSeats.map((s) => s.id),
          totalAmount: grandTotal,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newTicket: BookingInfo = data.data;
        setCompletedBooking(newTicket);

        // Lưu vé vào LocalStorage
        try {
          const existing = JSON.parse(localStorage.getItem("cinemax_tickets") || "[]");
          localStorage.setItem("cinemax_tickets", JSON.stringify([newTicket, ...existing]));
          if (onBookingSuccess) onBookingSuccess(newTicket);
        } catch (err) {
          console.error("Lỗi lưu vé vào LocalStorage:", err);
        }

        setStep(5);
      } else {
        alert(data.error || "Đặt vé không thành công, vui lòng thử lại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // URL VietQR mẫu chuẩn Napas247
  const vietQrUrl = `https://img.vietqr.io/image/MB-0388899999-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(`VECINEMAX ${selectedSeats.map(s => s.id).join("")}`)}&accountName=CINEMAX%20CINEMA%20VIETNAM`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl my-auto text-white">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-red/20 text-accent-red border border-accent-red/30 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white line-clamp-1">
                Đặt vé: {movie.title}
              </h3>
              <p className="text-xs text-neutral-400">
                {step === 1 && "Bước 1: Chọn rạp & Suất chiếu"}
                {step === 2 && "Bước 2: Chọn ghế ngồi phòng chiếu"}
                {step === 3 && "Bước 3: Combo bắp nước & Thông tin"}
                {step === 4 && "Bước 4: Quét mã QR thanh toán"}
                {step === 5 && "Bước 5: Vé điện tử của bạn"}
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

        {/* BƯỚC 1: CHỌN RẠP & SUẤT CHIẾU */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                1. Chọn cụm rạp
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_CINEMAS.map((cinema) => (
                  <div
                    key={cinema.id}
                    onClick={() => setSelectedCinema(cinema.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedCinema === cinema.name
                        ? "border-accent-red bg-accent-red/10 ring-1 ring-accent-red"
                        : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                    }`}
                  >
                    <h4 className="font-bold text-sm text-white">{cinema.name}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{cinema.address}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                2. Chọn ngày & Suất chiếu
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["2026-09-24", "2026-09-25", "2026-09-26"].map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === date
                        ? "bg-white text-black shadow-md"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    {date === "2026-09-24" ? "Hôm nay (24/09)" : date === "2026-09-25" ? "Ngày mai (25/09)" : "Thứ Bảy (26/09)"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {MOCK_SHOWTIMES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedTime(st.time);
                      setSelectedFormat(st.format);
                    }}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      selectedTime === st.time
                        ? "border-accent-red bg-accent-red/10 ring-1 ring-accent-red"
                        : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                    }`}
                  >
                    <span className="block font-black text-base text-white">{st.time}</span>
                    <span className="text-[11px] text-accent-cyan font-semibold">{st.format}</span>
                    <span className="block text-[10px] text-neutral-400 mt-1">{st.roomName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all"
              >
                <span>Tiếp tục: Chọn ghế</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỌN GHẾ NGỒI */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            {/* Màn hình cong phát sáng */}
            <div className="flex flex-col items-center">
              <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-accent-cyan to-transparent rounded-full shadow-[0_0_20px_rgba(0,240,255,0.6)]" />
              <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold mt-2">
                MÀN HÌNH CHIẾU
              </span>
            </div>

            {/* Sơ đồ ghế */}
            <div className="space-y-2 overflow-x-auto py-2">
              {seatsMatrix.map((row, rIdx) => (
                <div key={rIdx} className="flex items-center justify-center gap-1.5 min-w-[500px]">
                  <span className="w-5 text-xs text-neutral-500 font-bold text-center">
                    {ROWS[rIdx]}
                  </span>
                  <div className="flex gap-1.5">
                    {row.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isBooked = seat.status === "booked";

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleToggleSeat(seat)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all ${
                            isBooked
                              ? "bg-neutral-800/40 border border-neutral-800 text-neutral-600 cursor-not-allowed"
                              : isSelected
                              ? "bg-accent-red text-white shadow-lg shadow-accent-red/50 scale-105 ring-2 ring-white"
                              : seat.type === "vip"
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/40"
                              : seat.type === "couple"
                              ? "bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/40 w-16"
                              : "bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Chú thích loại ghế */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700" />
                <span>Thường (90k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40" />
                <span>VIP (115k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-pink-500/20 border border-pink-500/40" />
                <span>Sweetbox Đôi (220k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-accent-red" />
                <span className="text-white font-bold">Đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-800/40 border border-neutral-800" />
                <span>Đã đặt</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-neutral-400">Đã chọn {selectedSeats.length} ghế: </span>
                  <span className="text-sm font-bold text-accent-red">
                    {formatVND(seatsTotal)}
                  </span>
                </div>

                <button
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-50 text-white font-bold text-sm transition-all"
                >
                  <span>Tiếp tục: Bắp nước</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 3: COMBO BẮP NƯỚC & THÔNG TIN KHÁCH HÀNG */}
        {step === 3 && (
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Combo bắp & Nước rạp chiếu
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONCESSION_COMBOS.map((combo) => {
                  const qty = combos[combo.id] || 0;
                  return (
                    <div
                      key={combo.id}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">{combo.name}</h4>
                        <p className="text-xs text-neutral-400 mt-1">{combo.description}</p>
                        <span className="block text-xs font-black text-amber-400 mt-2">
                          {formatVND(combo.price)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800">
                        <span className="text-xs text-neutral-400">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông tin người nhận vé */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Thông tin nhận vé điện tử
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email (tùy chọn)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
              </div>
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-neutral-400">Rạp & Suất chiếu: </span>
                <span className="text-xs font-bold text-white">{selectedCinema} - {selectedTime}</span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ghế: <span className="text-white font-bold">{selectedSeats.map((s) => s.id).join(", ")}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-neutral-400">Tổng thanh toán</p>
                  <p className="text-xl font-black text-accent-red">{formatVND(grandTotal)}</p>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm shadow-lg shadow-accent-red/30 transition-all"
                >
                  <span>Thanh Toán QR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* BƯỚC 4: QUÉT MÃ QR THANH TOÁN (VIETQR / MOMO SIMULATOR) */}
        {step === 4 && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-4 py-3 rounded-xl text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 animate-spin text-amber-400" />
                <span>Thời gian giữ ghế còn lại: <strong>{formatTimer(timeLeft)}</strong></span>
              </div>
              <span className="text-neutral-400">Ghế sẽ tự giải phóng nếu hết hạn</span>
            </div>

            {/* Tùy chọn phương thức */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("vietqr")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  paymentMethod === "vietqr"
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 ring-1 ring-blue-500"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>VietQR (Mọi Ngân Hàng)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("momo")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  paymentMethod === "momo"
                    ? "bg-pink-600/20 border-pink-500 text-pink-400 ring-1 ring-pink-500"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-pink-500 flex items-center justify-center text-[8px] text-white font-black">M</div>
                <span>Ví MoMo / QR Pay</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Cột mã QR */}
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-xl text-black">
                <div className="flex items-center justify-between w-full border-b pb-2 mb-3">
                  <span className="font-extrabold text-xs text-blue-700">
                    {paymentMethod === "vietqr" ? "NAPAS 247 | VIETQR" : "VÍ ĐIỆN TỬ MOMO"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    paymentMethod === "vietqr" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                  }`}>
                    {paymentMethod === "vietqr" ? "MB BANK" : "MOMO PAY"}
                  </span>
                </div>

                <img
                  src={paymentMethod === "vietqr" ? vietQrUrl : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0388899999|CINEMAX CINEMA VN||0|0|${grandTotal}|VECINEMAX ${selectedSeats.map(s => s.id).join("")}`)}`}
                  alt="Mã QR Thanh Toán"
                  className="w-52 h-52 object-contain"
                />

                <div className="mt-3 w-full text-center space-y-1.5 border-t pt-2.5">
                  <div className="flex items-center justify-between text-xs px-2">
                    <span className="text-neutral-500">Số tài khoản / SĐT:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("0388899999", "account")}
                      className="flex items-center gap-1 font-mono font-bold text-neutral-900 hover:text-blue-600 bg-neutral-100 px-1.5 py-0.5 rounded"
                    >
                      <span>0388899999</span>
                      <Copy className="w-3 h-3 text-neutral-500" />
                      {copiedField === "account" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs px-2">
                    <span className="text-neutral-500">Số tiền:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(grandTotal.toString(), "amount")}
                      className="flex items-center gap-1 font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded"
                    >
                      <span>{formatVND(grandTotal)}</span>
                      <Copy className="w-3 h-3 text-red-400" />
                      {copiedField === "amount" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs px-2">
                    <span className="text-neutral-500">Nội dung:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`VECINEMAX ${selectedSeats.map(s => s.id).join("")}`, "content")}
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded"
                    >
                      <span>VECINEMAX {selectedSeats.map(s => s.id).join("")}</span>
                      <Copy className="w-3 h-3 text-neutral-500" />
                      {copiedField === "content" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột thông tin & nút xác nhận */}
              <div className="space-y-4">
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white text-sm border-b border-neutral-800 pb-2">
                    Xác nhận đơn đặt vé
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Phim:</span>
                    <span className="font-bold text-white">{movie.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Cụm rạp:</span>
                    <span className="text-white">{selectedCinema}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Suất chiếu:</span>
                    <span className="text-white">{selectedDate} lúc {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ghế đã chọn:</span>
                    <span className="text-accent-cyan font-bold">{selectedSeats.map(s => s.id).join(", ")}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-800 pt-2 font-bold">
                    <span className="text-neutral-300">Tổng thanh toán:</span>
                    <span className="text-accent-red text-sm">{formatVND(grandTotal)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <span>Hệ thống hỗ trợ quét mã tự động từ mọi ứng dụng Ngân hàng & Ví MoMo/ZaloPay.</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleConfirmPaid}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? "Đang xác thực thanh toán..." : "Tôi Đã Chuyển Khoản Thành Công"}</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 text-xs text-neutral-400 hover:text-white"
                  >
                    Quay lại chỉnh sửa thông tin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 5: VÉ ĐIỆN TỬ VỚI MÃ QR CODE */}
        {step === 5 && completedBooking && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Đặt Vé Thành Công!</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Vé điện tử đã được lưu vào <strong>Ví Vé Của Tôi</strong>. Vui lòng xuất trình mã QR này tại cổng rạp.
              </p>
            </div>

            {/* Thẻ Vé (Cinema Ticket Card) */}
            <div className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-red">VÉ ĐIỆN TỬ RẠP CHIẾU</span>
                  <h4 className="text-base font-black text-white">{completedBooking.movieTitle}</h4>
                </div>
                <span className="text-xs font-mono font-bold bg-neutral-800 px-2 py-1 rounded text-neutral-300">
                  {completedBooking.bookingId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Rạp:</span>
                  <span className="font-semibold text-white">{completedBooking.cinemaName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Phòng:</span>
                  <span className="font-semibold text-white">{completedBooking.roomName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Suất chiếu:</span>
                  <span className="font-semibold text-white">{completedBooking.showDate} lúc {completedBooking.showTime}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Ghế ngồi:</span>
                  <span className="font-extrabold text-accent-cyan text-sm">{completedBooking.seats.join(", ")}</span>
                </div>
              </div>

              {/* Mã QR Code */}
              {completedBooking.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl">
                  <img
                    src={completedBooking.qrCodeUrl}
                    alt="Mã QR Vé"
                    className="w-44 h-44 object-contain"
                  />
                  <p className="text-[10px] text-neutral-600 font-mono mt-1 font-semibold">
                    Quét mã để Check-in tại cổng rạp
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-neutral-800 pt-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Khách hàng:</span>
                  <span className="font-medium text-white">{completedBooking.customerName} - {completedBooking.customerPhone}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Tổng tiền:</span>
                  <span className="font-extrabold text-accent-red text-sm">{formatVND(completedBooking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Nút bấm in hoặc đóng */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>In / Lưu Vé PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-xs transition-colors"
              >
                Hoàn tất & Về Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
