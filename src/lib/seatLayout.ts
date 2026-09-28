/**
 * CineMax AI - Sơ đồ ghế phía server.
 *
 * Khớp 100% với sơ đồ ghế client BookingModal.tsx:
 * - Hàng thường: A, B, C, D (ghế 1..12) -> standard
 * - Hàng VIP: E, F, G, H (ghế 1..12) -> vip
 * - Hàng đôi Sweetbox: K (ghế 1..6) -> couple
 *
 * Server là nguồn sự thật: ghế không nằm trong sơ đồ này sẽ bị từ chối.
 */

export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "K"] as const;
export const SEATS_PER_ROW = 12;
export const COUPLE_SEATS_COUNT = 6;

const VIP_ROWS: ReadonlySet<string> = new Set(["E", "F", "G", "H"]);
const COUPLE_ROWS: ReadonlySet<string> = new Set(["K"]);
const SEAT_PATTERN = /^([A-H])([1-9]|1[0-2])$|^K([1-6])$/;

export type SeatTier = "standard" | "vip" | "couple";

/** Chuẩn hoá "a5 " -> "A5", "k2" -> "K2"; trả null nếu không thuộc sơ đồ ghế. */
export function normalizeSeatId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const seat = raw.trim().toUpperCase();
  return SEAT_PATTERN.test(seat) ? seat : null;
}

export function seatTier(seatId: string): SeatTier {
  const row = seatId.charAt(0);
  if (COUPLE_ROWS.has(row)) return "couple";
  if (VIP_ROWS.has(row)) return "vip";
  return "standard";
}

export function allSeatIds(): string[] {
  const seats: string[] = [];
  for (const row of SEAT_ROWS) {
    const count = row === "K" ? COUPLE_SEATS_COUNT : SEATS_PER_ROW;
    for (let n = 1; n <= count; n++) seats.push(`${row}${n}`);
  }
  return seats;
}
