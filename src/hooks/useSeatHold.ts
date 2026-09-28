"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, seatApi, type PriceBreakdown, type SeatStatus } from "@/lib/bookingClient";

/**
 * useSeatHold — giữ ghế 5 phút phía server, đếm ngược theo mốc do server trả về.
 *
 * Nguyên tắc:
 *  - Server là nguồn sự thật về TTL/ghế/giá. Hook chỉ hiển thị. `holdId` là bearer secret nên chỉ giữ trong bộ nhớ
 *    (không localStorage). Tải lại trang = bỏ hold, ghế tự nhả khi hết TTL.
 *  - Các lần gọi `hold()` được XẾP HÀNG và gộp (chỉ lần chọn ghế mới nhất được gửi) để bấm ghế liên tục
 *    không làm các request chạy chồng lên nhau và ghi đè theo thứ tự sai.
 *  - Đóng modal / đổi suất chiếu / rời trang: gửi DELETE với keepalive để nhả ghế sớm (best-effort; TTL là lưới an toàn).
 */

export type HoldStatus = "idle" | "holding" | "held" | "expired" | "confirmed" | "error";

export interface SeatHoldState {
  status: HoldStatus;
  holdId: string | null;
  seats: string[];
  secondsLeft: number;
  /** Báo giá do server tính (chưa gồm combo). Chỉ để hiển thị. */
  quote: PriceBreakdown | null;
  /** Ghế vừa bị người khác lấy trong lần chọn gần nhất: UI nên bỏ chọn các ghế này. */
  conflictSeats: string[];
  error: ApiError | null;
}

const INITIAL_STATE: SeatHoldState = {
  status: "idle",
  holdId: null,
  seats: [],
  secondsLeft: 0,
  quote: null,
  conflictSeats: [],
  error: null,
};

export interface UseSeatHoldOptions {
  /** Gọi khi hết thời gian giữ ghế (để modal quay lại bước chọn ghế). */
  onExpire?: () => void;
}

export function useSeatHold(showtimeId: string | null, options: UseSeatHoldOptions = {}) {
  const [state, setState] = useState<SeatHoldState>(INITIAL_STATE);

  const showtimeRef = useRef<string | null>(showtimeId);
  const holdIdRef = useRef<string | null>(null);
  const deadlineRef = useRef<number | null>(null); // mốc hết hạn theo performance.now() (đơn điệu, không lệch theo đồng hồ máy)
  const pendingRef = useRef<string[] | null>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const onExpireRef = useRef(options.onExpire);

  useEffect(() => {
    onExpireRef.current = options.onExpire;
  });

  const fireAndForgetRelease = useCallback((showtime: string | null) => {
    const holdId = holdIdRef.current;
    if (showtime && holdId) {
      void seatApi.release(showtime, holdId, { keepalive: true }).catch(() => undefined);
    }
  }, []);

  /* Đổi suất chiếu / unmount / rời trang -> nhả ghế. */
  useEffect(() => {
    mountedRef.current = true;
    showtimeRef.current = showtimeId;
    setState(INITIAL_STATE);

    const onPageHide = () => fireAndForgetRelease(showtimeId);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      fireAndForgetRelease(showtimeId);
      holdIdRef.current = null;
      deadlineRef.current = null;
      pendingRef.current = null;
      mountedRef.current = false;
    };
  }, [showtimeId, fireAndForgetRelease]);

  const expire = useCallback(() => {
    holdIdRef.current = null;
    deadlineRef.current = null;
    if (!mountedRef.current) return;
    setState({ ...INITIAL_STATE, status: "expired" });
    onExpireRef.current?.();
  }, []);

  /* Đếm ngược: tính lại từ mốc hết hạn mỗi giây và khi tab hiện lại (tab ẩn có thể bị trình duyệt làm chậm timer). */
  useEffect(() => {
    if (state.status !== "held") return;

    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      if (left <= 0) {
        expire();
        return;
      }
      setState((s) => (s.secondsLeft === left ? s : { ...s, secondsLeft: left }));
    };

    tick();
    const timer = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state.status, expire]);

  const doRelease = useCallback(async () => {
    const showtime = showtimeRef.current;
    const holdId = holdIdRef.current;
    holdIdRef.current = null;
    deadlineRef.current = null;
    if (mountedRef.current) setState(INITIAL_STATE);
    if (showtime && holdId) await seatApi.release(showtime, holdId).catch(() => undefined);
  }, []);

  const doHold = useCallback(
    async (seats: string[]) => {
      const showtime = showtimeRef.current;
      if (!showtime) return;
      if (seats.length === 0) {
        await doRelease();
        return;
      }

      if (mountedRef.current) setState((s) => ({ ...s, status: "holding", conflictSeats: [], error: null }));
      try {
        const response = await seatApi.hold({ showtimeId: showtime, seats, holdId: holdIdRef.current ?? undefined });

        if (!mountedRef.current || showtimeRef.current !== showtime) {
          // Người dùng đã đổi suất/đóng modal trong lúc chờ: nhả ngay hold vừa tạo.
          void seatApi.release(showtime, response.holdId, { keepalive: true }).catch(() => undefined);
          return;
        }

        holdIdRef.current = response.holdId;
        deadlineRef.current = performance.now() + response.expiresInSeconds * 1000;
        setState({
          status: "held",
          holdId: response.holdId,
          seats: response.seats,
          secondsLeft: response.expiresInSeconds,
          quote: response.quote,
          conflictSeats: [],
          error: null,
        });
      } catch (caught) {
        if (!mountedRef.current) return;
        const error = caught instanceof ApiError ? caught : new ApiError(0, "UNKNOWN", "Không thể giữ ghế, vui lòng thử lại.");
        const conflictSeats =
          error.code === "SEAT_TAKEN" && Array.isArray(error.body.seats)
            ? error.body.seats.filter((s): s is string => typeof s === "string")
            : [];
        // Khi xung đột, server GIỮ NGUYÊN hold cũ (nếu có) -> quay về "held" thay vì mất trạng thái.
        setState((s) => ({
          ...s,
          status: holdIdRef.current ? "held" : conflictSeats.length > 0 ? "idle" : "error",
          conflictSeats,
          error,
        }));
      }
    },
    [doRelease],
  );

  const drain = useCallback(async () => {
    runningRef.current = true;
    try {
      while (pendingRef.current !== null) {
        const next = pendingRef.current;
        pendingRef.current = null;
        await doHold(next);
      }
    } finally {
      runningRef.current = false;
    }
  }, [doHold]);

  /** Giữ (hoặc đổi sang) tập ghế này. Mảng rỗng = nhả hết. Gọi liên tục an toàn: chỉ lần mới nhất được gửi. */
  const hold = useCallback(
    (seats: string[]) => {
      pendingRef.current = seats;
      if (!runningRef.current) void drain();
    },
    [drain],
  );

  const release = useCallback(() => hold([]), [hold]);

  /** Gọi sau khi đặt vé thành công: dừng đếm ngược, không nhả ghế (ghế đã chuyển sang "sold" ở server). */
  const markConfirmed = useCallback(() => {
    holdIdRef.current = null;
    deadlineRef.current = null;
    pendingRef.current = null;
    setState({ ...INITIAL_STATE, status: "confirmed" });
  }, []);

  /** Xoá trạng thái lỗi/expired để UI bắt đầu chọn ghế lại. */
  const reset = useCallback(() => {
    holdIdRef.current = null;
    deadlineRef.current = null;
    pendingRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return { ...state, hold, release, markConfirmed, reset };
}

/* -------------------------------------------------------------------------- */
/*  Trạng thái ghế theo thời gian thực (polling)                              */
/* -------------------------------------------------------------------------- */

/**
 * Poll trạng thái ghế của suất chiếu. Chỉ poll khi tab đang hiện. Truyền `holdId` để server đánh dấu ghế của mình là "mine".
 * `refreshKey` đổi giá trị (ví dụ seats.join(",")) => tải lại ngay, vì đổi ghế không làm đổi holdId.
 * Lưu ý: GET /api/seats giới hạn 120 lượt/phút/IP; 10 giây/lần là an toàn cho vài chục người dùng chung một IP (rạp/wifi).
 */
export function useSeatAvailability(
  showtimeId: string | null,
  holdId: string | null,
  options: { intervalMs?: number; refreshKey?: string } = {},
) {
  const { intervalMs = 10_000, refreshKey = "" } = options;
  const [seats, setSeats] = useState<Record<string, SeatStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!showtimeId) {
      setSeats({});
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await seatApi.availability(showtimeId, holdId ?? undefined, controller.signal);
        if (cancelled) return;
        setSeats(response.seats);
        setError(null);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof ApiError ? caught : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    void load();
    const timer = setInterval(() => void load(), intervalMs);
    const onVisible = () => void load();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [showtimeId, holdId, intervalMs, refreshKey]);

  return { seats, loading, error };
}
