import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SeatType } from "@/types";

export interface SelectedSeat {
  id: string; // VD: "F7", "K1"
  type: SeatType; // Chuẩn "standard" | "vip" | "couple" toàn dự án, không lưu giá cứng ở client
}

export interface SelectedCombo {
  id: string;
  name: string;
  quantity: number;
}

export interface HoldSyncPayload {
  holdId: string;
  showtimeId: string;
  expiresAt: number; // Epoch timestamp (ms) do server trả về
  seats: SelectedSeat[];
}

export interface BookingState {
  step: number;
  movieId: string | null;
  movieTitle: string;
  cinemaName: string;
  showtimeId: string | null;
  showtimeLabel: string;
  format: string;
  holdId: string | null;
  serverExpiresAt: number | null;
  selectedSeats: SelectedSeat[];
  selectedCombos: SelectedCombo[];
  paymentMethod: "VNPAY" | "VIETQR";
  isVerifyingHold: boolean;

  // Actions
  setStep: (step: number) => void;
  setShowtimeInfo: (info: {
    movieId: string;
    movieTitle: string;
    cinemaName: string;
    showtimeId: string;
    showtimeLabel: string;
    format: string;
  }) => void;
  syncHoldFromServer: (payload: HoldSyncPayload) => void;
  updateComboQuantity: (combo: Omit<SelectedCombo, "quantity">, delta: number) => void;
  setPaymentMethod: (method: "VNPAY" | "VIETQR") => void;
  verifyHoldWithServer: () => Promise<boolean>;
  prefillFromAiTool: (payload: {
    movieId: string;
    movieTitle: string;
    cinemaName: string;
    showtimeId: string;
    showtimeLabel: string;
    format: string;
    suggestedSeats: SelectedSeat[];
    suggestedCombos?: SelectedCombo[];
  }) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      step: 1,
      movieId: null,
      movieTitle: "",
      cinemaName: "",
      showtimeId: null,
      showtimeLabel: "",
      format: "2D",
      holdId: null,
      serverExpiresAt: null,
      selectedSeats: [],
      selectedCombos: [],
      paymentMethod: "VIETQR",
      isVerifyingHold: false,

      setStep: (step) => set({ step }),

      setShowtimeInfo: (info) =>
        set({
          ...info,
          step: 2,
          holdId: null,
          serverExpiresAt: null,
          selectedSeats: [],
        }),

      // Nhận nguồn sự thật từ hook useSeatHold.ts sau khi gọi POST /api/seats thành công
      syncHoldFromServer: ({ holdId, showtimeId, expiresAt, seats }) =>
        set({
          holdId,
          showtimeId,
          serverExpiresAt: expiresAt,
          selectedSeats: seats,
        }),

      updateComboQuantity: (combo, delta) =>
        set((state) => {
          const existing = state.selectedCombos.find((c) => c.id === combo.id);
          let nextCombos = [...state.selectedCombos];

          if (existing) {
            const newQty = existing.quantity + delta;
            nextCombos =
              newQty <= 0
                ? nextCombos.filter((c) => c.id !== combo.id)
                : nextCombos.map((c) => (c.id === combo.id ? { ...c, quantity: newQty } : c));
          } else if (delta > 0) {
            nextCombos.push({ ...combo, quantity: delta });
          }

          return { selectedCombos: nextCombos };
        }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      // Gọi lên Server đối soát xem holdId có còn thực sự giữ ghế trên Redis hay không
      verifyHoldWithServer: async () => {
        const { holdId, showtimeId, selectedSeats, serverExpiresAt } = get();
        if (!holdId || !showtimeId || selectedSeats.length === 0) return false;

        // Nếu client đã trôi qua mốc expiresAt được server cấp
        if (serverExpiresAt && Date.now() > serverExpiresAt) {
          get().resetBooking();
          return false;
        }

        set({ isVerifyingHold: true });
        try {
          const res = await fetch(`/api/seats?showtimeId=${encodeURIComponent(showtimeId)}`, {
            method: "GET",
            headers: {
              "x-hold-id": holdId,
            },
            cache: "no-store",
          });

          if (!res.ok) {
            const current = get();
            if (current.holdId === holdId && current.showtimeId === showtimeId) {
              get().resetBooking();
            }
            return false;
          }

          const data = (await res.json()) as { seats?: Record<string, string> };
          const seatMap = data.seats || {};

          // Kiểm tra xem tất cả các ghế đã chọn có còn trạng thái "mine" (thuộc về holdId này) không
          const allStillMine = selectedSeats.every((s) => seatMap[s.id] === "mine");
          if (!allStillMine) {
            // Chống Race Condition: Chỉ reset nếu holdId và showtimeId không bị người dùng đổi mới trong lúc mạng đang gọi
            const current = get();
            if (current.holdId === holdId && current.showtimeId === showtimeId) {
              get().resetBooking();
            }
            return false;
          }

          set({ isVerifyingHold: false });
          return true;
        } catch {
          set({ isVerifyingHold: false });
          return false;
        }
      },

      // Dành cho Groq AI Function Calling điền sẵn lựa chọn (vẫn bắt buộc qua useSeatHold & thanh toán)
      prefillFromAiTool: (payload) =>
        set({
          step: 2,
          movieId: payload.movieId,
          movieTitle: payload.movieTitle,
          cinemaName: payload.cinemaName,
          showtimeId: payload.showtimeId,
          showtimeLabel: payload.showtimeLabel,
          format: payload.format,
          selectedSeats: payload.suggestedSeats,
          selectedCombos: payload.suggestedCombos ?? [],
          holdId: null, // Sẽ được useSeatHold cấp phát khi mở modal
          serverExpiresAt: null,
        }),

      resetBooking: () =>
        set({
          step: 1,
          holdId: null,
          serverExpiresAt: null,
          selectedSeats: [],
          selectedCombos: [],
          isVerifyingHold: false,
        }),
    }),
    {
      name: "cinemax-booking-storage",
      storage: createJSONStorage(() => localStorage),
      // Khi vừa đọc từ localStorage lên sau khi khách F5, lập tức đối chiếu với Redis Server
      onRehydrateStorage: () => (state) => {
        if (state?.holdId) {
          void state.verifyHoldWithServer();
        }
      },
    }
  )
);
