"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Movie, Seat, BookingInfo, PopcornFlavor, DrinkType, DrinkSize, SelectedComboItem, ShowTime } from "@/types";
import {
  MOCK_CINEMAS,
  MOCK_SHOWTIMES,
  CONCESSION_COMBOS,
  POPCORN_FLAVOR_OPTIONS,
  DRINK_TYPE_OPTIONS,
  DRINK_SIZE_OPTIONS,
  getShowtimesForMovie,
} from "@/lib/mockData";
import { formatVND } from "@/lib/utils";
import { checkOrphanSeats } from "@/lib/orphanSeatRule";
import { ViewFromSeatModal } from "./ViewFromSeatModal";
import {
  X,
  Check,
  Ticket,
  MapPin,
  Calendar,
  Clock,
  Armchair,
  QrCode,
  Download,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Timer,
  Copy,
  CreditCard,
  Eye,
  Sparkles,
  AlertTriangle,
  Info,
  Utensils,
  Coffee,
} from "lucide-react";
import { useSeatHold, useSeatAvailability } from "@/hooks/useSeatHold";
import { ApiError, describeError, submitBooking } from "@/lib/bookingClient";

interface BookingModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBookingSuccess?: (booking: BookingInfo) => void;
  initialSeats?: string[];
  initialShowtimeId?: string;
}

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "K"];
const SEATS_PER_ROW = 12;
const MAX_SEATS = 8;
const MAX_COMBO_QTY = 10; // khớp maxQuantity phía server
const PHONE_PATTERN = /^(?:\+84|84|0)\d{9,10}$/;
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** Ngày YYYY-MM-DD theo giờ Việt Nam, lệch offset ngày so với hôm nay. */
function vnDate(offsetDays: number): string {
  const d = new Date(Date.now() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function dateLabel(date: string, index: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const ddmm = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  if (index === 0) return `Hôm nay (${ddmm})`;
  if (index === 1) return `Ngày mai (${ddmm})`;
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} (${ddmm})`;
}

function showtimeStartMs(st: ShowTime): number {
  return Date.parse(`${st.date}T${st.time}:00+07:00`);
}

export const BookingModal: React.FC<BookingModalProps> = ({
  movie,
  onClose,
  onBookingSuccess,
  initialSeats,
  initialShowtimeId,
}) => {
  // Trạng thái các bước (1: Suất chiếu, 2: Chọn ghế, 3: Bắp nước & Thông tin, 4: Quét mã QR thanh toán, 5: Vé điện tử QR)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Ghế được chọn để xem mô phỏng góc nhìn 3D (View from seat)
  const [previewSeat, setPreviewSeat] = useState<Seat | null>(null);
  // Bật/tắt chế độ click để xem góc nhìn rạp
  const [viewSeatMode, setViewSeatMode] = useState<boolean>(false);
  // Cảnh báo ghế mồ côi (Orphan Seat Prevention)
  const [orphanWarning, setOrphanWarning] = useState<string | null>(null);

  // Chọn rạp / ngày / suất chiếu (theo id)
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(() => vnDate(0));
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(null);

  // Ghế đang chọn (ý định của người dùng); nguồn sự thật về ghế được giữ là server (h.seats)
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Thông báo lỗi/nhắc nhở hiển thị trong modal (thay alert)
  const [notice, setNotice] = useState<string | null>(null);
  // Tổng tiền do server tính khi báo PRICE_CHANGED, chỉ hiệu lực với đúng giỏ hàng lúc đó
  const [serverTotalRec, setServerTotalRec] = useState<{ total: number; basis: string } | null>(null);

  // Bắp nước (Map comboId -> quantity)
  const [combos, setCombos] = useState<Record<string, number>>({});

  // Cấu hình vị bắp & nước ngọt cho từng combo đã chọn
  const [comboConfigs, setComboConfigs] = useState<Record<string, {
    popcornFlavors: PopcornFlavor[];
    drinks: Array<{ type: DrinkType; size: DrinkSize }>;
  }>>({
    "combo-beta-solo": {
      popcornFlavors: ["sweet"],
      drinks: [{ type: "pepsi", size: "regular" }],
    },
    "combo-beta-couple": {
      popcornFlavors: ["sweet", "cheese"],
      drinks: [
        { type: "pepsi", size: "regular" },
        { type: "7up", size: "regular" },
      ],
    },
    "combo-beta-party": {
      popcornFlavors: ["cheese", "caramel"],
      drinks: [
        { type: "pepsi", size: "regular" },
        { type: "7up", size: "regular" },
        { type: "mirinda", size: "regular" },
      ],
    },
  });

  const handleSetPopcornFlavor = (comboId: string, slotIndex: number, flavor: PopcornFlavor) => {
    setComboConfigs((prev) => {
      const current = prev[comboId] || { popcornFlavors: ["sweet"], drinks: [{ type: "pepsi", size: "regular" }] };
      const newFlavors = [...current.popcornFlavors];
      newFlavors[slotIndex] = flavor;
      return {
        ...prev,
        [comboId]: {
          ...current,
          popcornFlavors: newFlavors,
        },
      };
    });
  };

  const handleSetDrinkType = (comboId: string, slotIndex: number, drinkType: DrinkType) => {
    setComboConfigs((prev) => {
      const current = prev[comboId] || { popcornFlavors: ["sweet"], drinks: [{ type: "pepsi", size: "regular" }] };
      const newDrinks = [...current.drinks];
      newDrinks[slotIndex] = { ...newDrinks[slotIndex], type: drinkType };
      return {
        ...prev,
        [comboId]: {
          ...current,
          drinks: newDrinks,
        },
      };
    });
  };

  const handleToggleDrinkSize = (comboId: string, slotIndex: number) => {
    setComboConfigs((prev) => {
      const current = prev[comboId] || { popcornFlavors: ["sweet"], drinks: [{ type: "pepsi", size: "regular" }] };
      const newDrinks = [...current.drinks];
      const currentSize = newDrinks[slotIndex]?.size || "regular";
      newDrinks[slotIndex] = {
        ...newDrinks[slotIndex],
        size: currentSize === "regular" ? "large" : "regular",
      };
      return {
        ...prev,
        [comboId]: {
          ...current,
          drinks: newDrinks,
        },
      };
    });
  };

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

  // Kết quả vé sau khi tạo
  const [completedBooking, setCompletedBooking] = useState<BookingInfo | null>(null);

  const dateOptions = useMemo(() => [0, 1, 2].map(vnDate), []);

  const [serverShowtimes, setServerShowtimes] = useState<ShowTime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  useEffect(() => {
    if (!movie) {
      setServerShowtimes([]);
      return;
    }
    let cancelled = false;
    setLoadingShowtimes(true);
    fetch(`/api/showtimes?movieId=${encodeURIComponent(String(movie.id))}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && data?.showtimes && Array.isArray(data.showtimes) && data.showtimes.length > 0) {
          setServerShowtimes(data.showtimes);
        } else if (!cancelled) {
          setServerShowtimes(getShowtimesForMovie(movie.id));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerShowtimes(getShowtimesForMovie(movie.id));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingShowtimes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movie]);

  useEffect(() => {
    if (initialShowtimeId) {
      setSelectedShowtimeId(initialShowtimeId);
      const st = (serverShowtimes.length > 0 ? serverShowtimes : (movie ? getShowtimesForMovie(movie.id) : MOCK_SHOWTIMES)).find((s) => s.id === initialShowtimeId);
      if (st) {
        setSelectedCinemaId(st.cinemaId);
        setSelectedDate(st.date);
      }
    }
  }, [initialShowtimeId, serverShowtimes, movie]);

  const movieShowtimes = useMemo<ShowTime[]>(
    () => (serverShowtimes.length > 0 ? serverShowtimes : (movie ? getShowtimesForMovie(movie.id) : [])),
    [serverShowtimes, movie],
  );

  const visibleShowtimes = useMemo(
    () =>
      movieShowtimes
        .filter((s) => s.cinemaId === selectedCinemaId && s.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [movieShowtimes, selectedCinemaId, selectedDate],
  );

  // Tự động kiểm tra và chọn suất chiếu thông minh (không để người dùng bị kẹt nút "Tiếp tục: Chọn ghế")
  useEffect(() => {
    if (!movie || movieShowtimes.length === 0) return;

    const now = Date.now();
    // 1. Kiểm tra nếu rạp hiện tại không có suất nào hôm nay, tự động kiểm tra ngày mai
    if (visibleShowtimes.length === 0) {
      const tomorrowStr = dateOptions[1];
      const hasTomorrow = movieShowtimes.some((s) => s.cinemaId === selectedCinemaId && s.date === tomorrowStr);
      if (selectedDate === dateOptions[0] && hasTomorrow) {
        setSelectedDate(tomorrowStr);
      }
      return;
    }

    // 2. Nếu suất chiếu đang chọn vẫn còn trong danh sách và CHƯA bắt đầu -> giữ nguyên
    const currentStillValid = visibleShowtimes.find(
      (st) => st.id === selectedShowtimeId && showtimeStartMs(st) > now
    );
    if (currentStillValid) return;

    // 3. Tìm suất chiếu sắp tới sớm nhất (chưa bắt đầu)
    const upcoming = visibleShowtimes.find((st) => showtimeStartMs(st) > now);
    if (upcoming) {
      setSelectedShowtimeId(upcoming.id);
    } else {
      // Nếu tất cả suất hôm nay đã bắt đầu rồi:
      // Tự động chuyển sang ngày mai nếu đang ở ngày hôm nay
      const tomorrowStr = dateOptions[1];
      const hasTomorrow = movieShowtimes.some((s) => s.cinemaId === selectedCinemaId && s.date === tomorrowStr);
      if (selectedDate === dateOptions[0] && hasTomorrow) {
        setSelectedDate(tomorrowStr);
      } else {
        // Hoặc giữ suất đầu tiên của ngày được chọn
        setSelectedShowtimeId(visibleShowtimes[0].id);
      }
    }
  }, [visibleShowtimes, movieShowtimes, selectedCinemaId, selectedDate, dateOptions, selectedShowtimeId, movie]);

  const selectedShowtime = movieShowtimes.find((s) => s.id === selectedShowtimeId) ?? null;
  // Giữ đúng tên biến cũ để JSX bước 3–5 không phải sửa
  const selectedCinema = MOCK_CINEMAS.find((c) => c.id === selectedCinemaId)?.name ?? "";
  const selectedTime = selectedShowtime?.time ?? "";
  const selectedFormat = selectedShowtime?.format ?? "";
  const roomName = selectedShowtime?.roomName ?? "";

  // Giữ ghế phía server (300s). Truyền null khi modal đóng => hook tự nhả ghế.
  const h = useSeatHold(movie ? selectedShowtimeId : null, {
    onExpire: () => {
      setSelectedSeats([]);
      setStep((s) => (s >= 2 && s <= 4 ? 2 : s));
      setNotice("Đã hết thời gian giữ ghế. Vui lòng chọn lại ghế.");
    },
  });

  // Trạng thái ghế thời gian thực (chỉ poll khi đang ở bước 2–4)
  const availabilityActive = Boolean(movie && selectedShowtimeId && step >= 2 && step <= 4);
  const avail = useSeatAvailability(availabilityActive ? selectedShowtimeId : null, h.holdId, {
    refreshKey: h.seats.join(","),
  });

  const seatsMatrix: Seat[][] = useMemo(() => {
    return ROWS.map((row) => {
      const isCouple = row === "K";
      const isVip = ["E", "F", "G", "H"].includes(row);
      const count = isCouple ? 6 : SEATS_PER_ROW;
      const seatsInRow: Seat[] = [];
      for (let i = 1; i <= count; i++) {
        const id = `${row}${i}`;
        const remote = avail.seats[id];
        seatsInRow.push({
          id,
          row,
          number: i,
          type: isCouple ? "couple" : isVip ? "vip" : "standard",
          price: isCouple ? 130000 : isVip ? 75000 : 55000, // chỉ để hiển thị; server tính lại
          // "sold" và "held" (do người khác giữ) đều không chọn được; "mine"/"free" thì chọn được.
          // Gán "booked" để checkOrphanSeats coi các ghế này là đã có người.
          status: remote === "sold" || remote === "held" ? "booked" : "available",
        });
      }
      return seatsInRow;
    });
  }, [avail.seats]);

  const preselectedRef = useRef(false);

  // (a) Mở/đóng modal: reset, và chọn sẵn suất chiếu (ưu tiên initialShowtimeId, tránh ghi đè)
  useEffect(() => {
    if (!movie) {
      setStep(1);
      setSelectedSeats([]);
      setCombos({});
      setCompletedBooking(null);
      setSelectedShowtimeId(null);
      setNotice(null);
      setServerTotalRec(null);
      preselectedRef.current = false;
      return;
    }

    // Nếu người dùng/CineBot truyền initialShowtimeId: ưu tiên chọn suất này, không ghi đè
    if (initialShowtimeId) {
      const target = movieShowtimes.find((s) => s.id === initialShowtimeId);
      if (target) {
        setSelectedCinemaId(target.cinemaId);
        setSelectedDate(target.date);
        setSelectedShowtimeId(target.id);
        return;
      }
      // Suất chiếu server chưa tải xong: giữ nguyên initialShowtimeId, không để next ghi đè
      setSelectedShowtimeId(initialShowtimeId);
      return;
    }

    const now = Date.now();
    const next = movieShowtimes
      .filter((s) => showtimeStartMs(s) > now)
      .sort((a, b) => showtimeStartMs(a) - showtimeStartMs(b))[0];
    if (next) {
      setSelectedCinemaId(next.cinemaId);
      setSelectedDate(next.date);
      setSelectedShowtimeId(next.id);
    } else {
      setSelectedShowtimeId(null);
    }
  }, [movie, movieShowtimes, initialShowtimeId]);

  // (b) CineBot đề xuất ghế: chọn sẵn ĐÚNG MỘT LẦN rồi giữ ghế trên server
  useEffect(() => {
    if (!movie || !initialSeats || initialSeats.length === 0 || !selectedShowtimeId || preselectedRef.current) return;
    const wanted = seatsMatrix
      .flat()
      .filter((s) => initialSeats.includes(s.id) && s.status === "available")
      .slice(0, MAX_SEATS);
    if (wanted.length === 0) return;
    preselectedRef.current = true;
    setSelectedSeats(wanted);
    setStep(2);
    h.hold(wanted.map((s) => s.id));
  }, [movie, initialSeats, selectedShowtimeId, seatsMatrix, h.hold]);

  // (c) Đồng bộ: khi hàng đợi giữ ghế đã xong, ghế đang chọn PHẢI bằng ghế server đã giữ.
  //     Xử lý trường hợp bị người khác lấy mất ghế (SEAT_TAKEN), bấm nhanh nhiều ghế, đổi suất, lỗi mạng giữa chừng.
  useEffect(() => {
    if (h.busy || (h.status !== "held" && h.status !== "idle")) return;
    const serverIds = new Set(h.seats);
    const same = selectedSeats.length === serverIds.size && selectedSeats.every((s) => serverIds.has(s.id));
    if (same) return;
    setSelectedSeats(seatsMatrix.flat().filter((s) => serverIds.has(s.id)));
  }, [h.busy, h.status, h.seats, seatsMatrix, selectedSeats]);

  const applySelection = (next: Seat[]) => {
    setSelectedSeats(next);
    setNotice(null);
    h.hold(next.map((s) => s.id)); // xếp hàng + gộp; rỗng = nhả hết
  };

  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === "booked") return;

    // Nếu đang bật chế độ xem góc nhìn 3D thì mở modal thay vì chọn ghế
    if (viewSeatMode) {
      setPreviewSeat(seat);
      return;
    }

    const isCurrentlySelected = selectedSeats.some((s) => s.id === seat.id);

    // Tìm hàng ghế tương ứng trong sơ đồ
    const rowSeats = seatsMatrix.find((r) => r.length > 0 && r[0].row === seat.row) || [];
    const currentSelectedIds = new Set(selectedSeats.map((s) => s.id));

    // Kiểm tra quy tắc chống ghế mồ côi (Orphan Seat Prevention)
    const orphanCheck = checkOrphanSeats(rowSeats, currentSelectedIds, seat);
    if (!orphanCheck.isValid) {
      setOrphanWarning(orphanCheck.message);
      // Tự tắt cảnh báo sau 4.5 giây
      setTimeout(() => setOrphanWarning(null), 4500);
      return;
    }

    // Nếu hợp lệ, xóa cảnh báo và áp dụng chọn/bỏ chọn
    setOrphanWarning(null);

    if (isCurrentlySelected) {
      applySelection(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= MAX_SEATS) {
        setNotice(`Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong một lần đặt.`);
        return;
      }
      applySelection([...selectedSeats, seat]);
    }
  };

  const handleUpdateCombo = (comboId: string, delta: number) => {
    setCombos((prev) => {
      const current = prev[comboId] || 0;
      const next = Math.min(MAX_COMBO_QTY, Math.max(0, current + delta));
      return { ...prev, [comboId]: next };
    });
  };

  // Tính chi tiết combo và phụ thu vị/cỡ ly
  const selectedConcessions: SelectedComboItem[] = useMemo(() => {
    return Object.entries(combos)
      .filter(([_, qty]) => qty > 0)
      .map(([comboId, qty]) => {
        const def = CONCESSION_COMBOS.find((c) => c.id === comboId);
        const config = comboConfigs[comboId];
        if (!def || !config) return null;

        let extraPerUnit = 0;
        config.popcornFlavors.forEach((f) => {
          const flavorDef = POPCORN_FLAVOR_OPTIONS.find((p) => p.id === f);
          if (flavorDef) extraPerUnit += flavorDef.extra;
        });
        config.drinks.forEach((d) => {
          const drinkDef = DRINK_TYPE_OPTIONS.find((dt) => dt.id === d.type);
          if (drinkDef && "extra" in drinkDef) extraPerUnit += (drinkDef as { extra: number }).extra;
          const sizeDef = DRINK_SIZE_OPTIONS.find((s) => s.id === d.size);
          if (sizeDef) extraPerUnit += sizeDef.extra;
        });

        return {
          id: comboId,
          name: def.name,
          quantity: qty,
          basePrice: def.price,
          popcornFlavors: config.popcornFlavors,
          drinks: config.drinks,
          extraPrice: extraPerUnit,
          totalPrice: (def.price + extraPerUnit) * qty,
        };
      })
      .filter((item): item is SelectedComboItem => item !== null);
  }, [combos, comboConfigs]);

  // Early return sau mọi hook
  if (!movie) return null;

  // Tính tổng tiền
  const basis = JSON.stringify([selectedSeats.map((s) => s.id), selectedConcessions]);
  const clientSeatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  // Khi server đã xác nhận giữ ghế, dùng báo giá của server cho phần vé
  const seatsTotal = h.status === "held" && !h.busy && h.quote ? h.quote.ticketsSubtotal : clientSeatsTotal;
  const combosTotal = selectedConcessions.reduce((sum, c) => sum + c.totalPrice, 0);
  // Sau PRICE_CHANGED: dùng đúng số server báo cho giỏ hàng đó (tự vô hiệu khi giỏ hàng đổi)
  const serverTotal = serverTotalRec && serverTotalRec.basis === basis ? serverTotalRec.total : null;
  const grandTotal = serverTotal ?? seatsTotal + combosTotal;

  const seatsReady = selectedSeats.length > 0 && h.status === "held" && !h.busy;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const alertText =
    notice ??
    (h.conflictSeats.length > 0
      ? `Ghế ${h.conflictSeats.join(", ")} vừa được người khác chọn. Vui lòng chọn ghế khác.`
      : h.error
      ? describeError(h.error).message
      : null);

  const alertBanner = alertText ? (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-600/15 border border-red-500/50 text-red-200 text-xs">
      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <span className="flex-1">{alertText}</span>
      {h.status === "error" && (
        <button
          type="button"
          onClick={() => h.hold(selectedSeats.map((s) => s.id))}
          className="px-2 py-0.5 rounded bg-red-500/30 hover:bg-red-500/50 font-bold"
        >
          Thử lại
        </button>
      )}
    </div>
  ) : null;

  const holdBanner =
    h.status === "held" ? (
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs transition-all ${
          h.secondsLeft <= 60
            ? "bg-red-500/15 border-red-500/50 text-red-400 animate-pulse"
            : h.secondsLeft <= 120
            ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" />
          <span>
            Ghế được giữ cho bạn: <strong>{formatTimer(h.secondsLeft)}</strong>
          </span>
        </div>
        <span className="text-[11px] opacity-80 hidden sm:inline">Hết giờ, ghế tự động được nhả</span>
      </div>
    ) : null;

  // URL VietQR mẫu chuẩn Napas247
  const vietQrUrl = `https://img.vietqr.io/image/MB-0388899999-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(
    `VECINEMAX ${selectedSeats.map((s) => s.id).join("")}`
  )}&accountName=BETA%20CINEMAS%20XUAN%20THUY`;

  // Chuyển sang bước thanh toán QR
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setNotice("Vui lòng điền đầy đủ họ tên và số điện thoại nhận vé.");
      return;
    }
    if (!PHONE_PATTERN.test(customerPhone.replace(/[\s.\-()]/g, ""))) {
      setNotice("Số điện thoại không hợp lệ.");
      return;
    }
    if (!seatsReady) {
      setNotice("Ghế của bạn chưa được giữ. Vui lòng chọn lại ghế.");
      setStep(2);
      return;
    }
    setNotice(null);
    h.hold(selectedSeats.map((s) => s.id)); // làm mới 5 phút cho bước thanh toán
    setStep(4);
  };

  // Xác nhận thanh toán & xuất vé chính thức
  const handleConfirmPaid = async () => {
    if (!selectedShowtimeId || !h.holdId || h.status !== "held") {
      setNotice("Ghế chưa được giữ. Vui lòng chọn lại ghế.");
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    setNotice(null);
    try {
      const res = await submitBooking({
        showtimeId: selectedShowtimeId,
        holdId: h.holdId,
        seats: selectedSeats.map((s) => s.id),
        customer: { name: customerName.trim(), phone: customerPhone.trim(), email: customerEmail.trim() || undefined },
        concessions: selectedConcessions.map((c) => ({
          id: c.id,
          quantity: c.quantity,
          popcornFlavors: c.popcornFlavors,
          drinks: c.drinks,
        })),
        expectedTotal: grandTotal, // chỉ để server phát hiện lệch giá
        posterPath: movie.posterPath,
      });

      const newTicket: BookingInfo = res.data;
      h.markConfirmed();
      setCompletedBooking(newTicket);
      try {
        const existing = JSON.parse(localStorage.getItem("cinemax_tickets") || "[]");
        localStorage.setItem("cinemax_tickets", JSON.stringify([newTicket, ...existing]));
        if (customerPhone.trim()) {
          localStorage.setItem("cinemax_customer_phone", customerPhone.trim().replace(/[\s.\-()]/g, ""));
          localStorage.setItem("cinemax_customer_name", customerName.trim() || "Khách Hàng Beta");
        }
      } catch (err) {
        console.error("Lỗi lưu vé vào LocalStorage:", err);
      }
      if (onBookingSuccess) onBookingSuccess(newTicket);
      setStep(5);
    } catch (err) {
      const { message, action } = describeError(err);
      setNotice(message);
      if (action === "reselect") {
        h.release(); // hold đã chết hoặc không khớp: dọn cho sạch (idempotent)
        setSelectedSeats([]);
        setStep(2);
      } else if (action === "review_price") {
        const price = err instanceof ApiError ? (err.body.price as { total?: unknown } | undefined) : undefined;
        if (price && typeof price.total === "number") setServerTotalRec({ total: price.total, basis });
        setStep(3);
      } else if (action === "fix_input") {
        setStep(3);
      } else if (action === "fatal") {
        h.release();
        setSelectedSeats([]);
        setStep(1);
      }
      // "retry": ở lại bước 4, khách bấm lại được
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
                    onClick={() => {
                      setSelectedCinemaId(cinema.id);
                      setSelectedShowtimeId(null);
                      setSelectedSeats([]);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedCinemaId === cinema.id
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
                {dateOptions.map((date, i) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedShowtimeId(null);
                      setSelectedSeats([]);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDate === date
                        ? "bg-white text-black shadow-md"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    {dateLabel(date, i)}
                  </button>
                ))}
              </div>

              {visibleShowtimes.length === 0 ? (
                <div className="mt-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center">
                  <p className="text-xs text-neutral-300">
                    Chưa có suất chiếu phim này tại rạp/ngày đã chọn.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateOptions[1]);
                    }}
                    className="mt-2.5 px-4 py-1.5 rounded-lg bg-[#034EA2]/30 hover:bg-[#034EA2]/50 text-[#00B2FF] font-bold text-xs border border-[#00B2FF]/30 transition-all inline-flex items-center gap-1.5"
                  >
                    <span>Xem suất chiếu Ngày mai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {visibleShowtimes.map((st) => {
                      const started = showtimeStartMs(st) <= Date.now();
                      return (
                        <button
                          key={st.id}
                          type="button"
                          disabled={started}
                          onClick={() => {
                            if (st.id !== selectedShowtimeId) {
                              setSelectedSeats([]); // đổi suất: hook tự nhả ghế của suất cũ
                              setSelectedShowtimeId(st.id);
                            }
                          }}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            started
                              ? "border-neutral-800 bg-neutral-900/20 opacity-40 cursor-not-allowed"
                              : selectedShowtimeId === st.id
                              ? "border-accent-red bg-accent-red/10 ring-1 ring-accent-red"
                              : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                          }`}
                        >
                          <span className="block font-black text-base text-white">{st.time}</span>
                          <span className="text-[11px] text-accent-cyan font-semibold">{st.format}</span>
                          <span className="block text-[10px] text-neutral-400 mt-1">
                            {started ? "Đã chiếu" : st.roomName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {visibleShowtimes.length > 0 && visibleShowtimes.every((st) => showtimeStartMs(st) <= Date.now()) && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                      <span>Tất cả suất chiếu hôm nay tại rạp này đã kết thúc.</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(dateOptions[1])}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-bold transition-all"
                      >
                        Xem Ngày mai
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                disabled={!selectedShowtimeId || (selectedShowtime ? showtimeStartMs(selectedShowtime) <= Date.now() : false)}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-accent-red/20"
              >
                <span>Tiếp tục: Chọn ghế</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỌN GHẾ NGỒI (CHUẨN FANDANGO & CGV) */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {holdBanner}
            {alertBanner}

            {/* Thanh công cụ: Chế độ xem góc nhìn 3D (View from seat) & Sweet Spot */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewSeatMode(!viewSeatMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    viewSeatMode
                      ? "bg-[#8a99b5]/20 border-[#8a99b5]/50 text-[#c7d0de] shadow-md"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{viewSeatMode ? "Đang bật chế độ 3D (Bấm ghế để xem)" : "Xem góc nhìn từ ghế (3D View)"}</span>
                </button>

                {selectedSeats.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewSeat(selectedSeats[0])}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#d9b95c] bg-[#c9a227]/10 border border-[#c9a227]/30 hover:bg-[#c9a227]/20 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#d9b95c]" />
                    <span>Góc nhìn ghế {selectedSeats[0].id}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#d9b95c]/90 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#d9b95c]" />
                <span>Hàng F - G: Vị trí vàng Sweet Spot (Dolby Atmos & THX)</span>
              </div>
            </div>

            {/* Cảnh báo Chống Ghế Mồ Côi (Orphan Seat Warning Banner) */}
            {orphanWarning && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-600/20 border border-red-500/60 text-red-200 text-xs shadow-lg shadow-black/40">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-red-300 uppercase tracking-wider text-[11px]">
                    Quy tắc Chống Ghế Mồ Côi (Orphan Seat Rule)
                  </span>
                  <span className="mt-0.5 block">{orphanWarning}</span>
                </div>
              </div>
            )}

            {/* Màn hình cong phát sáng nhẹ thanh lịch */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-accent-cyan to-transparent rounded-full shadow-lg shadow-black/50" />
              <span className="text-[10px] uppercase tracking-widest text-[#8a99b5] font-extrabold mt-1.5 opacity-90">
                MÀN HÌNH CHIẾU CONG (CINEMA SCREEN)
              </span>
            </div>

            {/* Sơ đồ ghế */}
            <div className="space-y-2 overflow-x-auto py-2">
              {seatsMatrix.map((row, rIdx) => {
                const isSweetSpotRow = ["F", "G"].includes(ROWS[rIdx]);

                return (
                  <div key={rIdx} className="flex items-center justify-center gap-1.5 min-w-[520px]">
                    <span
                      className={`w-6 text-xs font-bold text-center flex items-center justify-center gap-0.5 ${
                        isSweetSpotRow ? "text-[#d9b95c] font-black" : "text-neutral-500"
                      }`}
                      title={isSweetSpotRow ? "Hàng ghế Sweet Spot - Vị trí vàng" : undefined}
                    >
                      {ROWS[rIdx]}
                      {isSweetSpotRow && <span className="text-[9px]">★</span>}
                    </span>
                    <div className="flex gap-1.5">
                      {row.map((seat) => {
                        const isSelected = selectedSeats.some((s) => s.id === seat.id);
                        const isBooked = seat.status === "booked";
                        const heldByOther = avail.seats[seat.id] === "held";

                        return (
                          <div key={seat.id} className="relative group">
                            <button
                              disabled={isBooked}
                              title={heldByOther ? "Đang được người khác giữ" : undefined}
                              onClick={() => handleToggleSeat(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all ${
                                isBooked
                                  ? heldByOther
                                    ? "bg-amber-900/20 border border-dashed border-amber-700/50 text-amber-700/70 cursor-not-allowed"
                                    : "bg-neutral-800/40 border border-neutral-800 text-neutral-600 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-accent-red text-black shadow-lg shadow-black/40 scale-105 ring-2 ring-white/60 font-black"
                                  : seat.type === "vip"
                                  ? "bg-amber-700/20 border border-amber-600/40 text-amber-200 hover:bg-amber-700/40 hover:scale-105"
                                  : seat.type === "couple"
                                  ? "bg-[#8a5a8f]/20 border border-[#8a5a8f]/40 text-[#d9b95c] hover:bg-[#8a5a8f]/40 w-16 hover:scale-105"
                                  : "bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:scale-105"
                              }`}
                            >
                              {seat.id}
                            </button>

                            {/* Nút xem góc nhìn nhanh khi hover */}
                            {!isBooked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewSeat(seat);
                                }}
                                title={`Xem góc nhìn từ ghế ${seat.id}`}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#8a99b5] text-black hidden group-hover:flex items-center justify-center shadow-md scale-90 hover:scale-110 z-10"
                              >
                                <Eye className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chú thích loại ghế */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700" />
                <span>Thường (55k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-700/20 border border-amber-600/40" />
                <span>VIP (75k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-[#8a5a8f]/20 border border-[#8a5a8f]/40" />
                <span>Sweetbox Đôi (130k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-accent-red" />
                <span className="text-white font-bold">Đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-900/20 border border-dashed border-amber-700/50" />
                <span>Đang được giữ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-neutral-800/40 border border-neutral-800" />
                <span>Đã đặt</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#d9b95c] font-medium">
                <span>★ Sweet Spot</span>
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
                  disabled={!seatsReady}
                  onClick={() => {
                    h.hold(selectedSeats.map((s) => s.id));
                    setStep(3);
                  }}
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
            {holdBanner}
            {alertBanner}

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  Combo Bắp & Nước Rạp Chiếu (Tùy Chọn Vị & Cỡ Ly)
                </label>
                <span className="text-[11px] text-accent-cyan font-medium">
                  🍿 Tự do mix vị Phô mai / Caramel & Upsize ly 32oz
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {CONCESSION_COMBOS.map((combo) => {
                  const qty = combos[combo.id] || 0;
                  const config = comboConfigs[combo.id];

                  // Tính đơn giá combo sau khi cộng phụ thu vị/ly lớn
                  let extraPerUnit = 0;
                  if (config) {
                    config.popcornFlavors.forEach((f) => {
                      const flavorDef = POPCORN_FLAVOR_OPTIONS.find((p) => p.id === f);
                      if (flavorDef) extraPerUnit += flavorDef.extra;
                    });
                    config.drinks.forEach((d) => {
                      const drinkDef = DRINK_TYPE_OPTIONS.find((dt) => dt.id === d.type);
                      if (drinkDef && "extra" in drinkDef) extraPerUnit += (drinkDef as { extra: number }).extra;
                      const sizeDef = DRINK_SIZE_OPTIONS.find((s) => s.id === d.size);
                      if (sizeDef) extraPerUnit += sizeDef.extra;
                    });
                  }
                  const comboUnitPrice = combo.price + extraPerUnit;

                  return (
                    <div
                      key={combo.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        qty > 0
                          ? "bg-neutral-900 border-accent-gold/50 shadow-lg shadow-black/40"
                          : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div>
                        {/* Header combo card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{combo.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{combo.name}</h4>
                              </div>
                              {combo.badge && (
                                <span className="inline-block text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30 mt-0.5">
                                  {combo.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                          {combo.description}
                        </p>

                        <div className="mt-2.5 flex items-baseline gap-2">
                          <span className="text-sm font-black text-amber-400">
                            {formatVND(comboUnitPrice)}
                          </span>
                          {extraPerUnit > 0 && (
                            <span className="text-[10px] text-neutral-400">
                              (Gốc: {formatVND(combo.price)} + Phụ thu: {formatVND(extraPerUnit)})
                            </span>
                          )}
                        </div>

                        {/* BẢNG TÙY BIẾN VỊ & NƯỚC KHI ĐÃ CHỌN QUANTITY > 0 */}
                        {qty > 0 && config && (
                          <div className="mt-3.5 pt-3 border-t border-neutral-800 space-y-3 animate-in fade-in duration-200">
                            {/* Chọn vị bắp */}
                            <div>
                              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide block mb-1.5">
                                🍿 Vị bắp ({combo.popcornSlots} phần):
                              </span>
                              {Array.from({ length: combo.popcornSlots }).map((_, slotIdx) => (
                                <div key={slotIdx} className="space-y-1 mb-2">
                                  {combo.popcornSlots > 1 && (
                                    <span className="text-[9px] text-neutral-400 block font-semibold">
                                      Ngăn {slotIdx + 1}:
                                    </span>
                                  )}
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {POPCORN_FLAVOR_OPTIONS.map((flavor) => {
                                      const isSelected = config.popcornFlavors[slotIdx] === flavor.id;
                                      return (
                                        <button
                                          type="button"
                                          key={flavor.id}
                                          onClick={() => handleSetPopcornFlavor(combo.id, slotIdx, flavor.id as PopcornFlavor)}
                                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all border flex flex-col justify-between ${
                                            isSelected
                                              ? "bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/50"
                                              : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                                          }`}
                                        >
                                          <span className="truncate">{flavor.name}</span>
                                          <span className="text-[9px] opacity-75">{flavor.tag}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Chọn nước & cỡ ly */}
                            <div>
                              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide block mb-1.5">
                                🥤 Nước ngọt & cỡ ly:
                              </span>
                              {Array.from({ length: combo.drinkSlots }).map((_, drinkIdx) => {
                                const currentDrink = config.drinks[drinkIdx] || { type: "pepsi", size: "regular" };
                                return (
                                  <div key={drinkIdx} className="bg-neutral-950/80 p-2 rounded-xl border border-neutral-800 space-y-1.5 mb-2">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-semibold text-neutral-300">
                                        Ly {drinkIdx + 1}:
                                      </span>
                                      {/* Nút toggle Upsize 32oz */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleDrinkSize(combo.id, drinkIdx)}
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                                          currentDrink.size === "large"
                                            ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan"
                                            : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white"
                                        }`}
                                      >
                                        {currentDrink.size === "large" ? "⚡ Ly Lớn 32oz (+12k)" : "22oz Tiêu Chuẩn"}
                                      </button>
                                    </div>

                                    {/* Danh sách loại nước */}
                                    <div className="grid grid-cols-2 gap-1">
                                      {DRINK_TYPE_OPTIONS.map((drinkOpt) => {
                                        const isSelected = currentDrink.type === drinkOpt.id;
                                        return (
                                          <button
                                            type="button"
                                            key={drinkOpt.id}
                                            onClick={() => handleSetDrinkType(combo.id, drinkIdx, drinkOpt.id as DrinkType)}
                                            className={`px-1.5 py-1 rounded text-[9px] font-medium text-left truncate transition-colors border ${
                                              isSelected
                                                ? "bg-blue-600/30 border-blue-500 text-blue-200"
                                                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                            }`}
                                          >
                                            {drinkOpt.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bộ điều khiển số lượng combo */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800">
                        <span className="text-xs text-neutral-400 font-medium">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, -1)}
                            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-5 text-center text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, 1)}
                            className="w-7 h-7 rounded-lg bg-accent-red hover:bg-accent-redHover text-white flex items-center justify-center text-sm font-bold shadow-md transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tóm tắt chi tiết bắp nước đã chọn */}
              {selectedConcessions.length > 0 && (
                <div className="mt-4 p-3.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block text-[10px]">
                    🍿 Chi tiết combo bắp nước bạn đã chọn:
                  </span>
                  <div className="space-y-1.5">
                    {selectedConcessions.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between text-neutral-300">
                        <div>
                          <span className="font-bold text-white">{sc.quantity}x {sc.name}</span>
                          <span className="text-[10px] text-neutral-400 block">
                            Vị bắp: {sc.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join(", ")} • Nước: {sc.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"} (${d.size === "large" ? "32oz" : "22oz"})`).join(", ")}
                          </span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">
                          {formatVND(sc.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    pattern="[0-9+\s.\-()]{9,16}"
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
            {holdBanner}
            {alertBanner}

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
                    ? "bg-[#8a5a8f]/20 border-[#8a5a8f]/50 text-[#d9b95c] ring-1 ring-[#8a5a8f]"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#8a5a8f] flex items-center justify-center text-[8px] text-white font-black">M</div>
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
                    paymentMethod === "vietqr" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-900"
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
                    disabled={isSubmitting || h.status !== "held"}
                    className="w-full py-3.5 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-50 text-black font-extrabold text-sm shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2"
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

              {/* Bắp & Nước đã đặt kèm */}
              {completedBooking.concessions && completedBooking.concessions.length > 0 && (
                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    🍿 Bắp & Nước (Nhận tại quầy Concession):
                  </span>
                  {completedBooking.concessions.map((c, i) => (
                    <div key={i} className="flex justify-between items-start text-neutral-300">
                      <div>
                        <span className="font-semibold text-white">{c.quantity}x {c.name}</span>
                        <span className="text-[10px] text-neutral-400 block">
                          Vị: {c.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join(", ")} • Nước: {c.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"} (${d.size === "large" ? "32oz" : "22oz"})`).join(", ")}
                        </span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">{formatVND(c.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

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

        {/* Modal mô phỏng 3D góc nhìn ảo từ ghế (View-From-Seat chuẩn Fandango & AMC) */}
        {previewSeat && (
          <ViewFromSeatModal
            seat={previewSeat}
            movie={movie}
            cinemaName={selectedCinema}
            roomName={roomName}
            isSelected={selectedSeats.some((s) => s.id === previewSeat.id)}
            onConfirmSelect={(st) => {
              const isCurrentlySelected = selectedSeats.some((s) => s.id === st.id);
              const rowSeats = seatsMatrix.find((r) => r.length > 0 && r[0].row === st.row) || [];
              const currentSelectedIds = new Set(selectedSeats.map((s) => s.id));

              const orphanCheck = checkOrphanSeats(rowSeats, currentSelectedIds, st);
              if (!orphanCheck.isValid) {
                setOrphanWarning(orphanCheck.message);
                setTimeout(() => setOrphanWarning(null), 4500);
                return;
              }

              if (isCurrentlySelected) {
                applySelection(selectedSeats.filter((s) => s.id !== st.id));
              } else {
                if (selectedSeats.length >= MAX_SEATS) {
                  setNotice(`Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong một lần đặt.`);
                  return;
                }
                applySelection([...selectedSeats, st]);
              }
            }}
            onClose={() => setPreviewSeat(null)}
          />
        )}
      </div>
    </div>
  );
};
