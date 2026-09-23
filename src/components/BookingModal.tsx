"use client";

import React, { useState, useMemo } from "react";
import { Movie, Seat, ShowTime, BookingInfo } from "@/types";
import { MOCK_CINEMAS, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "@/lib/mockData";
import { formatVND } from "@/lib/utils";
import { X, Check, Ticket, MapPin, Calendar, Clock, Armchair, QrCode, Download, ArrowRight, ArrowLeft } from "lucide-react";

interface BookingModalProps {
  movie: Movie | null;
  onClose: () => void;
}

// Tạo cấu trúc sơ đồ ghế mẫu cho rạp
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "K"];
const SEATS_PER_ROW = 12;

export const BookingModal: React.FC<BookingModalProps> = ({ movie, onClose }) => {
  // Trạng thái các bước (1: Suất chiếu, 2: Chọn ghế, 3: Bắp nước & Thông tin, 4: Vé điện tử QR)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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

  // Kết quả vé sau khi tạo
  const [completedBooking, setCompletedBooking] = useState<BookingInfo | null>(null);

  // Khởi tạo trạng thái ghế ngẫu nhiên (có một số ghế đã có người đặt)
  const seatsMatrix: Seat[][] = useMemo(() => {
    // Dùng hash đơn giản từ tên phim để giữ ổn định trạng thái ghế
    const bookedSeed = [
      "B4", "B5", "E6", "E7", "F6", "F7", "F8", "G5", "G6", "G7"
    ];

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

  // Toggle chọn ghế
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

  // Cập nhật số lượng combo bắp nước
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

  // Gửi đặt vé lên Server
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert("Vui lòng điền đầy đủ họ tên và số điện thoại nhận vé!");
      return;
    }

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
        setCompletedBooking(data.data);
        setStep(4);
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
                {step === 3 && "Bước 3: Combo bắp nước & Thanh toán"}
                {step === 4 && "Bước 4: Vé điện tử của bạn"}
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
                    <div className="flex items-start gap-2.5">
                      <MapPin className={`w-4 h-4 mt-0.5 ${selectedCinema === cinema.name ? "text-accent-red" : "text-neutral-400"}`} />
                      <div>
                        <h4 className="font-bold text-sm text-white">{cinema.name}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{cinema.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chọn ngày & định dạng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  2. Chọn ngày chiếu
                </label>
                <div className="flex gap-2">
                  {[
                    { label: "Hôm nay", date: "2026-09-24" },
                    { label: "Ngày mai", date: "2026-09-25" },
                    { label: "Thứ Sáu", date: "2026-09-26" },
                  ].map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDate === d.date
                          ? "bg-accent-red text-white border-accent-red"
                          : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  3. Định dạng phòng chiếu
                </label>
                <div className="flex gap-2">
                  {["2D Phụ Đề", "IMAX Laser", "2D Lồng Tiếng"].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedFormat(fmt)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        selectedFormat === fmt
                          ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan"
                          : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chọn giờ chiếu */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                4. Chọn giờ chiếu
              </label>
              <div className="flex flex-wrap gap-3">
                {["17:15", "18:30", "19:00", "20:15", "21:30", "22:45"].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedTime === time
                        ? "bg-white text-black border-white shadow-lg"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-800">
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

        {/* BƯỚC 2: SƠ ĐỒ GHẾ TƯƠNG TÁC */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Màn hình rạp với hiệu ứng phát sáng */}
            <div className="flex flex-col items-center">
              <div className="w-3/4 h-2.5 bg-gradient-to-r from-accent-cyan/20 via-accent-cyan to-accent-cyan/20 rounded-full cinema-screen-glow mb-2" />
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Màn hình phòng chiếu (Screen)
              </p>
            </div>

            {/* Sơ đồ ghế */}
            <div className="overflow-x-auto py-2 flex justify-center">
              <div className="space-y-2 min-w-[500px]">
                {seatsMatrix.map((rowSeats, rIdx) => {
                  const rowLabel = ROWS[rIdx];
                  const isCoupleRow = rowLabel === "K";

                  return (
                    <div key={rowLabel} className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="w-5 text-xs font-bold text-neutral-500 text-center">
                        {rowLabel}
                      </span>

                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {rowSeats.map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.id === seat.id);
                          const isBooked = seat.status === "booked";

                          let seatColor = "bg-neutral-800 border-neutral-700 hover:border-neutral-500 text-neutral-300"; // standard
                          if (seat.type === "vip") {
                            seatColor = "bg-amber-950/40 border-amber-600/50 hover:border-amber-400 text-amber-300";
                          }
                          if (seat.type === "couple") {
                            seatColor = "bg-pink-950/40 border-pink-600/50 hover:border-pink-400 text-pink-300";
                          }
                          if (isBooked) {
                            seatColor = "bg-neutral-900 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-40";
                          }
                          if (isSelected) {
                            seatColor = "bg-accent-cyan text-black font-extrabold border-accent-cyan shadow-md shadow-accent-cyan/40";
                          }

                          return (
                            <button
                              key={seat.id}
                              disabled={isBooked}
                              onClick={() => handleToggleSeat(seat)}
                              title={`${seat.id} - ${seat.type.toUpperCase()} - ${formatVND(seat.price)}`}
                              className={`h-7 rounded text-[10px] font-semibold border flex items-center justify-center transition-all ${
                                isCoupleRow ? "w-14" : "w-7"
                              } ${seatColor}`}
                            >
                              {seat.id}
                            </button>
                          );
                        })}
                      </div>

                      <span className="w-5 text-xs font-bold text-neutral-500 text-center">
                        {rowLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chú thích loại ghế */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700" />
                <span>Thường (90k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-950/60 border border-amber-500" />
                <span>VIP (115k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-4 rounded bg-pink-950/60 border border-pink-500" />
                <span>Ghế Đôi (220k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-accent-cyan border border-accent-cyan" />
                <span className="text-white font-bold">Đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-900 border border-neutral-900 opacity-40" />
                <span>Đã đặt</span>
              </div>
            </div>

            {/* Thanh điều khiển tiếp tục */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Chọn lại suất chiếu</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-neutral-400">
                    Ghế: {selectedSeats.map((s) => s.id).join(", ") || "Chưa chọn"}
                  </p>
                  <p className="text-base font-extrabold text-accent-red">
                    {formatVND(seatsTotal)}
                  </p>
                </div>

                <button
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all"
                >
                  <span>Tiếp tục: Bắp nước</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 3: BẮP NƯỚC & THÔNG TIN THANH TOÁN */}
        {step === 3 && (
          <form onSubmit={handleConfirmBooking} className="p-6 space-y-6">
            {/* Chọn bắp nước */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Combo Bắp & Nước Rạp Phim (Tùy chọn)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONCESSION_COMBOS.map((combo) => {
                  const qty = combos[combo.id] || 0;
                  return (
                    <div
                      key={combo.id}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{combo.icon}</span>
                          <div>
                            <h5 className="font-bold text-xs text-white">{combo.name}</h5>
                            <p className="text-xs text-accent-gold font-bold">{formatVND(combo.price)}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2">{combo.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <span className="text-xs text-neutral-400">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-xs font-bold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-xs font-bold"
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
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Thông tin nhận vé điện tử (E-Ticket)
              </h4>
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
                  <label className="block text-xs text-neutral-400 mb-1">Email nhận vé</label>
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
                <span className="text-xs text-neutral-400">Suất chiếu: </span>
                <span className="text-xs font-bold text-white">{selectedDate} - {selectedTime} ({selectedFormat})</span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ghế: <span className="text-white font-bold">{selectedSeats.map((s) => s.id).join(", ")}</span> | Rạp: <span className="text-white">{selectedCinema}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-neutral-400">Tổng thanh toán</p>
                  <p className="text-xl font-black text-accent-red">{formatVND(grandTotal)}</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-accent-red/30 transition-all"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác Nhận & Xuất Vé"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* BƯỚC 4: VÉ ĐIỆN TỬ VỚI MÃ QR CODE */}
        {step === 4 && completedBooking && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Đặt Vé Thành Công!</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Vé điện tử đã được tạo. Vui lòng xuất trình mã QR này tại quầy soát vé rạp để vào xem phim.
              </p>
            </div>

            {/* Thẻ Vé (Cinema Ticket Card) */}
            <div className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-red">VÉ ĐIỆN TỬ</span>
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
                  <span className="font-semibold text-white">{completedBooking.roomName} ({completedBooking.format})</span>
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
                    className="w-48 h-48 object-contain"
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
