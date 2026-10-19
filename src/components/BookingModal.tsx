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
import { getScreen3DStyle } from "@/lib/screen3D";
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
  Star,
  AlertTriangle,
  Info,
  Utensils,
  Coffee,
  ExternalLink,
} from "lucide-react";
import { useSeatHold, useSeatAvailability } from "@/hooks/useSeatHold";
import { ApiError, describeError, submitBooking } from "@/lib/bookingClient";
import VietQRPaymentModal from "./booking/VietQRPaymentModal";
import { useBookingStore } from "@/store/useBookingStore";

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
  const [isVerifiedCustomer, setIsVerifiedCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tự động nhận diện danh tính khách hàng từ phiên đăng nhập hoặc lần đặt vé trước
  useEffect(() => {
    try {
      const storedPhone = localStorage.getItem("cinemax_customer_phone");
      const storedName = localStorage.getItem("cinemax_customer_name");
      const storedEmail = localStorage.getItem("cinemax_customer_email");
      if (storedPhone && storedPhone.trim()) {
        setCustomerPhone(storedPhone.trim());
        if (storedName && storedName.trim()) setCustomerName(storedName.trim());
        if (storedEmail && storedEmail.trim()) setCustomerEmail(storedEmail.trim());
        setIsVerifiedCustomer(true);
      }
    } catch (e) {
      console.error("Lỗi đọc thông tin khách hàng:", e);
    }
  }, []);

  // Phương thức thanh toán (vnpay / vietqr / momo)
  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "vietqr" | "momo">("vnpay");
  const [isRedirectingVnpay, setIsRedirectingVnpay] = useState(false);
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

  // Đồng bộ giỏ vé với Zustand Persist store (Hạng mục 1)
  useEffect(() => {
    if (h.status === "held" && h.holdId && selectedShowtimeId) {
      useBookingStore.getState().syncHoldFromServer({
        holdId: h.holdId,
        showtimeId: selectedShowtimeId,
        expiresAt: Date.now() + h.secondsLeft * 1000,
        seats: selectedSeats.map((s) => ({ id: s.id, type: s.type })),
      });
    }
  }, [h.status, h.holdId, h.secondsLeft, selectedShowtimeId, selectedSeats]);

  useEffect(() => {
    useBookingStore.getState().setStep(step);
    if (step === 5) {
      useBookingStore.getState().resetBooking();
    }
  }, [step]);

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

  // Khôi phục combo từ useBookingStore nếu có draft của phim này
  useEffect(() => {
    if (!movie) return;
    const storeState = useBookingStore.getState();
    if (storeState.movieId === movie.id && storeState.selectedCombos.length > 0) {
      const restoredCombos: Record<string, number> = {};
      for (const item of storeState.selectedCombos) {
        restoredCombos[item.id] = item.quantity;
      }
      setCombos((prev) => (Object.keys(prev).length === 0 ? restoredCombos : prev));
    }
  }, [movie]);

  // Lưu trạng thái combo vào useBookingStore
  useEffect(() => {
    const selectedList = Object.entries(combos)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const found = CONCESSION_COMBOS.find((c) => c.id === id);
        return { id, name: found?.name || id, quantity };
      });
    useBookingStore.setState({ selectedCombos: selectedList });
  }, [combos]);

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
    const cleanPhone = customerPhone.trim().replace(/[\s.\-()]/g, "");
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setNotice("Số điện thoại không hợp lệ (cần từ 10 chữ số, VD: 0912345678).");
      return;
    }
    if (!seatsReady) {
      setNotice("Ghế của bạn chưa được giữ. Vui lòng chọn lại ghế.");
      setStep(2);
      return;
    }
    setNotice(null);

    // Lưu danh tính khách hàng để ghi nhớ tự động
    try {
      localStorage.setItem("cinemax_customer_phone", cleanPhone);
      localStorage.setItem("cinemax_customer_name", customerName.trim() || "Khách Hàng CineMax");
      if (customerEmail.trim()) {
        localStorage.setItem("cinemax_customer_email", customerEmail.trim());
      }
      setIsVerifiedCustomer(true);
      setIsEditingCustomer(false);
    } catch (e) {
      console.error(e);
    }

    h.hold(selectedSeats.map((s) => s.id)); // làm mới 5 phút cho bước thanh toán
    setStep(4);
  };

  // Tạo phiên thanh toán VNPay và chuyển hướng trình duyệt
  const handlePayWithVnpay = async () => {
    if (!selectedShowtimeId || !h.holdId || h.status !== "held") {
      setNotice("Phiên giữ ghế đã hết hạn hoặc chưa được tạo. Vui lòng chọn lại ghế.");
      setStep(2);
      return;
    }
    setIsRedirectingVnpay(true);
    setNotice(null);
    try {
      const res = await fetch("/api/payment/vnpay/create-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: selectedShowtimeId,
          holdId: h.holdId,
          concessions: selectedConcessions.map((c) => ({
            id: c.id,
            quantity: c.quantity,
            popcornFlavors: c.popcornFlavors,
            drinks: c.drinks,
          })),
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || "Không thể khởi tạo phiên thanh toán VNPay.");
      }

      // Lưu số điện thoại để đồng bộ danh sách vé cá nhân
      try {
        if (customerPhone.trim()) {
          localStorage.setItem("cinemax_customer_phone", customerPhone.trim().replace(/[\s.\-()]/g, ""));
          localStorage.setItem("cinemax_customer_name", customerName.trim() || "Khách Hàng Beta");
        }
      } catch (e) {
        console.error(e);
      }

      // Chuyển hướng người dùng sang Cổng thanh toán Quốc gia VNPay
      window.location.href = data.paymentUrl;
    } catch (err: unknown) {
      setIsRedirectingVnpay(false);
      setNotice(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi kết nối tới VNPay.");
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl my-auto text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 line-clamp-1">
                Đặt vé: {movie.title}
              </h3>
              <p className="text-xs text-slate-500">
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
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BƯỚC 1: CHỌN RẠP & SUẤT CHIẾU */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                        ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <h4 className="font-bold text-sm text-slate-900">{cinema.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{cinema.address}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {dateLabel(date, i)}
                  </button>
                ))}
              </div>

              {visibleShowtimes.length === 0 ? (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-xs text-slate-600">
                    Chưa có suất chiếu phim này tại rạp/ngày đã chọn.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateOptions[1]);
                    }}
                    className="mt-2.5 px-4 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-xs border border-sky-200 transition-all inline-flex items-center gap-1.5"
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
                              ? "border-slate-200 bg-slate-100 opacity-40 cursor-not-allowed text-slate-400"
                              : selectedShowtimeId === st.id
                              ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                              : "border-slate-200 bg-slate-50 hover:border-sky-300"
                          }`}
                        >
                          <span className="block font-black text-base text-slate-900">{st.time}</span>
                          <span className="text-[11px] text-sky-600 font-semibold">{st.format}</span>
                          <span className="block text-[10px] text-slate-500 mt-1">
                            {started ? "Đã chiếu" : st.roomName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {visibleShowtimes.length > 0 && visibleShowtimes.every((st) => showtimeStartMs(st) <= Date.now()) && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                      <span>Tất cả suất chiếu hôm nay tại rạp này đã kết thúc.</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(dateOptions[1])}
                        className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-all"
                      >
                        Xem Ngày mai
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                disabled={!selectedShowtimeId || (selectedShowtime ? showtimeStartMs(selectedShowtime) <= Date.now() : false)}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-md shadow-sky-600/30"
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
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewSeatMode(!viewSeatMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    viewSeatMode
                      ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{viewSeatMode ? "Đang bật chế độ 3D (Bấm ghế để xem)" : "Xem góc nhìn từ ghế (3D View)"}</span>
                </button>

                {selectedSeats.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewSeat(selectedSeats[0])}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Góc nhìn ghế {selectedSeats[0].id}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Hàng F - G: Vị trí vàng Sweet Spot (Dolby Atmos & THX)</span>
              </div>
            </div>

            {/* Cảnh báo Chống Ghế Mồ Côi (Orphan Seat Warning Banner) */}
            {orphanWarning && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shadow-sm">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-red-800 uppercase tracking-wider text-[11px]">
                    Quy tắc Chống Ghế Mồ Côi (Orphan Seat Rule)
                  </span>
                  <span className="mt-0.5 block">{orphanWarning}</span>
                </div>
              </div>
            )}

            {/* Màn hình cong phát sáng nhẹ thanh lịch với góc nhìn 3D perspective theo ghế chọn */}
            <div
              className="flex flex-col items-center pt-2 origin-top"
              style={getScreen3DStyle(selectedSeats[selectedSeats.length - 1]?.id)}
            >
              <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-sky-500 to-transparent rounded-full shadow-sm" />
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mt-1.5 opacity-90">
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
                        isSweetSpotRow ? "text-amber-600 font-black" : "text-slate-400"
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
                                    ? "bg-amber-50 border border-dashed border-amber-300 text-amber-500/80 cursor-not-allowed"
                                    : "bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-105 ring-2 ring-sky-300 font-black"
                                  : seat.type === "vip"
                                  ? "bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 hover:scale-105"
                                  : seat.type === "couple"
                                  ? "bg-pink-50 border border-pink-300 text-pink-700 hover:bg-pink-100 w-16 hover:scale-105"
                                  : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:scale-105"
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
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white hidden group-hover:flex items-center justify-center shadow-md scale-90 hover:scale-110 z-10"
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
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
                <span>Thường (55k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-50 border border-amber-300" />
                <span>VIP (75k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-pink-50 border border-pink-300" />
                <span>Sweetbox Đôi (130k)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-sky-600" />
                <span className="text-slate-900 font-bold">Đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-50 border border-dashed border-amber-300" />
                <span>Đang được giữ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
                <span>Đã đặt</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <span>★ Sweet Spot</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-500">Đã chọn {selectedSeats.length} ghế: </span>
                  <span className="text-sm font-bold text-sky-600">
                    {formatVND(seatsTotal)}
                  </span>
                </div>

                <button
                  disabled={!seatsReady}
                  onClick={() => {
                    h.hold(selectedSeats.map((s) => s.id));
                    setStep(3);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  Combo Bắp & Nước Rạp Chiếu (Tùy Chọn Vị & Cỡ Ly)
                </label>
                <span className="text-[11px] text-sky-600 font-medium">
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
                          ? "bg-sky-50/50 border-sky-300 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        {/* Header combo card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{combo.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900">{combo.name}</h4>
                              </div>
                              {combo.badge && (
                                <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5">
                                  {combo.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          {combo.description}
                        </p>

                        <div className="mt-2.5 flex items-baseline gap-2">
                          <span className="text-sm font-black text-sky-600">
                            {formatVND(comboUnitPrice)}
                          </span>
                          {extraPerUnit > 0 && (
                            <span className="text-[10px] text-slate-400">
                              (Gốc: {formatVND(combo.price)} + Phụ thu: {formatVND(extraPerUnit)})
                            </span>
                          )}
                        </div>

                        {/* BẢNG TÙY BIẾN VỊ & NƯỚC KHI ĐÃ CHỌN QUANTITY > 0 */}
                        {qty > 0 && config && (
                          <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                            {/* Chọn vị bắp */}
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                                🍿 Vị bắp ({combo.popcornSlots} phần):
                              </span>
                              {Array.from({ length: combo.popcornSlots }).map((_, slotIdx) => (
                                <div key={slotIdx} className="space-y-1 mb-2">
                                  {combo.popcornSlots > 1 && (
                                    <span className="text-[9px] text-slate-500 block font-semibold">
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
                                              ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400"
                                              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                                🥤 Nước ngọt & cỡ ly:
                              </span>
                              {Array.from({ length: combo.drinkSlots }).map((_, drinkIdx) => {
                                const currentDrink = config.drinks[drinkIdx] || { type: "pepsi", size: "regular" };
                                return (
                                  <div key={drinkIdx} className="bg-white p-2 rounded-xl border border-slate-200 space-y-1.5 mb-2">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-semibold text-slate-700">
                                        Ly {drinkIdx + 1}:
                                      </span>
                                      {/* Nút toggle Upsize 32oz */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleDrinkSize(combo.id, drinkIdx)}
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                                          currentDrink.size === "large"
                                            ? "bg-sky-50 border-sky-400 text-sky-700 font-bold"
                                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
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
                                                ? "bg-sky-600 text-white font-medium border-sky-600"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-5 text-center text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCombo(combo.id, 1)}
                            className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center text-sm font-bold shadow-sm transition-colors"
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
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-sky-700 uppercase tracking-wider block text-[10px]">
                    🍿 Chi tiết combo bắp nước bạn đã chọn:
                  </span>
                  <div className="space-y-1.5">
                    {selectedConcessions.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">{sc.quantity}x {sc.name}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Vị bắp: {sc.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join(", ")} • Nước: {sc.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"} (${d.size === "large" ? "32oz" : "22oz"})`).join(", ")}
                          </span>
                        </div>
                        <span className="font-mono text-sky-600 font-bold">
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thông tin nhận vé điện tử
                </label>
                {isVerifiedCustomer && !isEditingCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(true)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Thay đổi người nhận</span>
                  </button>
                )}
              </div>

              {isVerifiedCustomer && !isEditingCustomer ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-emerald-50/60 border border-sky-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-sky-600/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{customerName || "Khách Hàng CineMax"}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã xác minh danh tính
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span>SĐT nhận vé: <strong className="font-mono text-slate-900 font-bold">{customerPhone}</strong></span>
                        {customerEmail && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Email: <strong className="text-slate-800">{customerEmail}</strong></span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        ✓ Tự động nhận diện - Bạn có thể bấm tiếp tục thanh toán ngay mà không cần nhập lại!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                    >
                      Sửa thông tin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9+\s.\-()]{9,16}"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Email (tùy chọn)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Hệ thống sẽ ghi nhớ danh tính cho các lần đặt vé sau (không cần nhập lại).</span>
                    </p>
                    {isEditingCustomer && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCustomer(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 underline"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500">Rạp & Suất chiếu: </span>
                <span className="text-xs font-bold text-slate-900">{selectedCinema} - {selectedTime}</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghế: <span className="text-slate-900 font-bold">{selectedSeats.map((s) => s.id).join(", ")}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Tổng thanh toán</p>
                  <p className="text-xl font-black text-sky-600">{formatVND(grandTotal)}</p>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all"
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("vnpay")}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  paymentMethod === "vnpay"
                    ? "bg-red-50 border-red-400 text-red-600 ring-1 ring-red-400"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center text-[7px] text-white font-black">VN</div>
                <span className="truncate">Cổng VNPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("vietqr")}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  paymentMethod === "vietqr"
                    ? "bg-sky-50 border-sky-400 text-sky-600 ring-1 ring-sky-400"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">VietQR Napas</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("momo")}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  paymentMethod === "momo"
                    ? "bg-pink-50 border-pink-400 text-pink-600 ring-1 ring-pink-400"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-pink-600 flex items-center justify-center text-[8px] text-white font-black shrink-0">M</div>
                <span className="truncate">Ví MoMo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {paymentMethod === "vnpay" ? (
                /* Cột Cổng VNPay */
                <div className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-[9px] text-white font-black">VN</div>
                      <span className="font-extrabold text-sm text-slate-900">CỔNG THANH TOÁN VNPAY</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                      Sandbox / Live
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                        <span>Phương thức hỗ trợ qua VNPay:</span>
                      </p>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px] pt-1">
                        <li>Ứng dụng Ngân hàng quét mã <strong>VNPAY-QR</strong></li>
                        <li>Thẻ ATM nội địa (VCB, Techcombank, BIDV, NCB, MB...)</li>
                        <li>Thẻ quốc tế <strong>Visa, MasterCard, JCB</strong></li>
                        <li>Ví điện tử VNPAY</li>
                      </ul>
                    </div>

                    <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-[11px] flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
                      <span>Sau khi nhấn thanh toán, bạn sẽ được chuyển hướng sang cổng bảo mật VNPay để hoàn tất giao dịch. Vé sẽ được kích hoạt tự động qua Webhook IPN.</span>
                    </div>
                  </div>
                </div>
              ) : paymentMethod === "vietqr" ? (
                /* Hạng mục 2: VietQR Payment Modal với âm thanh Ting-Ting & Mock Confirm gác cổng */
                <VietQRPaymentModal
                  bookingId={h.holdId ? `bk-${h.holdId.slice(0, 12)}` : "bk-demo"}
                  holdId={h.holdId ?? ""}
                  showtimeId={selectedShowtimeId ?? ""}
                  amount={grandTotal}
                  qrImageUrl={vietQrUrl}
                  transferContent={`VECINEMAX ${selectedSeats.map((s) => s.id).join("")}`}
                  allowMockPayment={process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_MOCK_PAYMENT === "true"}
                  customer={{
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    email: customerEmail.trim() || undefined,
                  }}
                  concessions={selectedConcessions.map((c) => ({
                    id: c.id,
                    quantity: c.quantity,
                    popcornFlavors: c.popcornFlavors,
                    drinks: c.drinks,
                  }))}
                  posterPath={movie.posterPath}
                  onPaymentVerified={(confirmedTicket) => {
                    const newTicket = confirmedTicket as BookingInfo;
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
                  }}
                  onSwitchToVNPay={() => setPaymentMethod("vnpay")}
                />
              ) : (
                /* Cột mã QR Chuyển khoản Ví MoMo */
                <div className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800">
                  <div className="flex items-center justify-between w-full border-b border-slate-200 pb-2 mb-3">
                    <span className="font-extrabold text-xs text-pink-700">
                      VÍ ĐIỆN TỬ MOMO
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200">
                      MOMO PAY
                    </span>
                  </div>

                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0388899999|CINEMAX CINEMA VN||0|0|${grandTotal}|VECINEMAX ${selectedSeats.map(s => s.id).join("")}`)}`}
                    alt="Mã QR Thanh Toán MoMo"
                    className="w-52 h-52 object-contain"
                  />

                  <div className="mt-3 w-full text-center space-y-1.5 border-t border-slate-200 pt-2.5">
                    <div className="flex items-center justify-between text-xs px-2">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy("0388899999", "account")}
                        className="flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-pink-600 bg-slate-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <span>0388899999</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                        {copiedField === "account" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs px-2">
                      <span className="text-slate-500">Số tiền:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(grandTotal.toString(), "amount")}
                        className="flex items-center gap-1 font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <span>{formatVND(grandTotal)}</span>
                        <Copy className="w-3 h-3 text-sky-400" />
                        {copiedField === "amount" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs px-2">
                      <span className="text-slate-500">Nội dung:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`VECINEMAX ${selectedSeats.map(s => s.id).join("")}`, "content")}
                        className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <span>VECINEMAX {selectedSeats.map(s => s.id).join("")}</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                        {copiedField === "content" && <span className="text-[9px] text-emerald-600 font-sans">Đã chép!</span>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cột thông tin & nút xác nhận */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                    Xác nhận đơn đặt vé
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phim:</span>
                    <span className="font-bold text-slate-900">{movie.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cụm rạp:</span>
                    <span className="text-slate-800">{selectedCinema}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suất chiếu:</span>
                    <span className="text-slate-800">{selectedDate} lúc {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ghế đã chọn:</span>
                    <span className="text-sky-600 font-bold">{selectedSeats.map(s => s.id).join(", ")}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <span className="text-slate-700">Tổng thanh toán:</span>
                    <span className="text-sky-600 text-base">{formatVND(grandTotal)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>
                    {paymentMethod === "vnpay"
                      ? "Bảo mật chuẩn PCI-DSS qua Cổng Thanh Toán VNPay."
                      : "Hệ thống hỗ trợ quét mã tự động từ mọi ứng dụng Ngân hàng & Ví MoMo/ZaloPay."}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  {paymentMethod === "vnpay" ? (
                    <button
                      onClick={handlePayWithVnpay}
                      disabled={isRedirectingVnpay || h.status !== "held"}
                      className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{isRedirectingVnpay ? "Đang kết nối cổng VNPay..." : `Thanh Toán Qua Cổng VNPay (${formatVND(grandTotal)})`}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmPaid}
                      disabled={isSubmitting || h.status !== "held"}
                      className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? "Đang xác thực thanh toán..." : "Tôi Đã Chuyển Khoản Thành Công"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
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
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Đặt Vé Thành Công!</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Vé điện tử đã được lưu vào <strong>Ví Vé Của Tôi</strong>. Vui lòng xuất trình mã QR này tại cổng rạp.
              </p>
            </div>

            {/* Thẻ Vé (Cinema Ticket Card) */}
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 text-left text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">VÉ ĐIỆN TỬ RẠP CHIẾU</span>
                  <h4 className="text-base font-black text-slate-900">{completedBooking.movieTitle}</h4>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                  {completedBooking.bookingId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Rạp:</span>
                  <span className="font-semibold text-slate-800">{completedBooking.cinemaName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phòng:</span>
                  <span className="font-semibold text-slate-800">{completedBooking.roomName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Suất chiếu:</span>
                  <span className="font-semibold text-slate-800">{completedBooking.showDate} lúc {completedBooking.showTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ghế ngồi:</span>
                  <span className="font-extrabold text-sky-600 text-sm">{completedBooking.seats.join(", ")}</span>
                </div>
              </div>

              {/* Bắp & Nước đã đặt kèm */}
              {completedBooking.concessions && completedBooking.concessions.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    🍿 Bắp & Nước (Nhận tại quầy Concession):
                  </span>
                  {completedBooking.concessions.map((c, i) => (
                    <div key={i} className="flex justify-between items-start text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{c.quantity}x {c.name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Vị: {c.popcornFlavors.map(f => f === "cheese" ? "Phô mai" : f === "caramel" ? "Caramel" : f === "sweet" ? "Ngọt" : "Mặn").join(", ")} • Nước: {c.drinks.map(d => `${d.type === "pepsi" ? "Pepsi" : d.type === "7up" ? "7Up" : d.type === "mirinda" ? "Mirinda" : "Trà đào"} (${d.size === "large" ? "32oz" : "22oz"})`).join(", ")}
                        </span>
                      </div>
                      <span className="font-mono text-sky-600 font-bold">{formatVND(c.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Mã QR Code */}
              {completedBooking.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={completedBooking.qrCodeUrl}
                    alt="Mã QR Vé"
                    className="w-44 h-44 object-contain"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                    Quét mã để Check-in tại cổng rạp
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Khách hàng:</span>
                  <span className="font-medium text-slate-800">{completedBooking.customerName} - {completedBooking.customerPhone}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Tổng tiền:</span>
                  <span className="font-extrabold text-sky-600 text-base">{formatVND(completedBooking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Nút bấm in hoặc đóng */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>In / Lưu Vé PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-colors"
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
