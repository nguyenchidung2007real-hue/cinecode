import type { SeatType } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type RecommendedSeatType = Exclude<SeatType, "empty">; // "standard" | "vip" | "couple"

export interface SeatRecommendation {
  seatType: RecommendedSeatType;
  recommendedRows: string[];
  recommendedSeats: string[];
  reason: string;
}

interface SeatRange {
  readonly min: number;
  readonly max: number;
}

type HallKind = "standard" | "imax" | "4dx";

interface HallProfile {
  readonly rows: readonly string[];
  readonly fallbackRows: readonly string[];
  readonly seatType: RecommendedSeatType;
}

/* -------------------------------------------------------------------------- */
/*  Cấu hình sơ đồ ghế (chỉnh tại đây nếu sơ đồ thực tế khác)                 */
/* -------------------------------------------------------------------------- */

/** Vùng "sweet spot": ghế 6 → 11 (âm thanh vòm chuẩn, góc nhìn 36–40°). */
const SWEET_SPOT: SeatRange = { min: 6, max: 11 };
/** Mở rộng khi nhóm đông hoặc vùng sweet spot đã có người đặt. */
const WIDE_SPOT: SeatRange = { min: 4, max: 13 };
const CENTER_SEAT = (SWEET_SPOT.min + SWEET_SPOT.max) / 2; // 8.5

const HALL_PROFILES: Readonly<Record<HallKind, HallProfile>> = {
  standard: { rows: ["F", "G"], fallbackRows: ["E", "H"], seatType: "standard" },
  "4dx": { rows: ["F", "G"], fallbackRows: ["E", "H"], seatType: "standard" },
  imax: { rows: ["H", "I"], fallbackRows: ["G", "J"], seatType: "vip" },
};

/** Ghế đôi Sweetbox nằm ở hàng cuối. */
const COUPLE_ROWS: readonly string[] = ["K", "L"];
/** Số hiệu ghế đôi ưu tiên từ giữa ra hai bên (id dạng "K5"). */
const COUPLE_SEAT_NUMBERS: readonly number[] = [5, 6, 4, 7, 3, 8];

const MAX_PARTY_SIZE = 8;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function toAscii(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectHallKind(format: string): HallKind {
  const text = toAscii(format);
  if (text.includes("imax")) return "imax";
  if (text.includes("4dx")) return "4dx";
  return "standard";
}

function sanitizePartySize(partySize: number): number {
  if (!Number.isFinite(partySize)) return 1;
  return Math.min(MAX_PARTY_SIZE, Math.max(1, Math.trunc(partySize)));
}

/** Tìm dãy ghế liền nhau, còn trống, gần trung tâm nhất trong một hàng. */
function findBestWindow(
  row: string,
  size: number,
  range: SeatRange,
  unavailable: ReadonlySet<string>,
): string[] | null {
  let best: { seats: string[]; distance: number } | null = null;

  for (let start = range.min; start + size - 1 <= range.max; start += 1) {
    const seats: string[] = [];
    for (let offset = 0; offset < size; offset += 1) {
      seats.push(`${row}${start + offset}`);
    }
    if (seats.some((id) => unavailable.has(id))) continue;

    const distance = Math.abs(start + (size - 1) / 2 - CENTER_SEAT);
    if (best === null || distance < best.distance) {
      best = { seats, distance };
    }
  }

  return best === null ? null : best.seats;
}

function findSeatsInRows(
  rows: readonly string[],
  size: number,
  unavailable: ReadonlySet<string>,
): { row: string; seats: string[] } | null {
  for (const range of [SWEET_SPOT, WIDE_SPOT]) {
    for (const row of rows) {
      const seats = findBestWindow(row, size, range, unavailable);
      if (seats !== null) return { row, seats };
    }
  }
  return null;
}

function buildStandardReason(kind: HallKind, row: string, seats: string[], size: number): string {
  const seatText = seats.join(", ");
  const group = size > 1 ? ` (${size} ghế liền nhau)` : "";

  if (kind === "imax") {
    return `Màn hình IMAX Laser cao khoảng 16m nên bạn nên lùi về hàng ${row}${group}: ghế ${seatText} bao quát trọn màn hình mà không phải ngước cổ, âm thanh vòm cân bằng nhất.`;
  }
  if (kind === "4dx") {
    return `Hàng ${row}${group} ở giữa phòng 4DX: ghế ${seatText} cảm nhận hiệu ứng chuyển động và âm thanh đều nhất, góc nhìn khoảng 36–40°.`;
  }
  return `Hàng ${row}${group} là "sweet spot" của phòng chiếu: ghế ${seatText} nằm giữa phòng, nghe âm thanh vòm chuẩn nhất với góc nhìn khoảng 36–40°.`;
}

/* -------------------------------------------------------------------------- */
/*  API chính                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Gợi ý ghế đẹp nhất.
 * @param format Định dạng suất chiếu, vd "2D Phụ Đề", "IMAX Laser", "4DX".
 * @param partySize Số người đi xem (1–8).
 * @param unavailableSeats Danh sách ghế đã có người đặt (tùy chọn) để tránh gợi ý trùng.
 */
export function recommendSeats(
  format: string,
  partySize: number = 1,
  unavailableSeats: readonly string[] = [],
): SeatRecommendation {
  const size = sanitizePartySize(partySize);
  const kind = detectHallKind(format);
  const profile = HALL_PROFILES[kind];
  const unavailable: ReadonlySet<string> = new Set(unavailableSeats);

  // Đi 2 người → ưu tiên ghế đôi Sweetbox ở hàng cuối.
  if (size === 2) {
    for (const row of COUPLE_ROWS) {
      for (const number of COUPLE_SEAT_NUMBERS) {
        const id = `${row}${number}`;
        if (!unavailable.has(id)) {
          return {
            seatType: "couple",
            recommendedRows: [row],
            recommendedSeats: [id],
            reason: `Ghế đôi Sweetbox hàng ${row} ở cuối phòng: riêng tư, thoải mái cho hai người và vẫn nhìn bao quát toàn bộ màn hình.`,
          };
        }
      }
    }
    // Hết ghế đôi → rơi xuống ghế thường liền nhau bên dưới.
  }

  const primary = findSeatsInRows(profile.rows, size, unavailable);
  if (primary !== null) {
    return {
      seatType: profile.seatType,
      recommendedRows: [primary.row],
      recommendedSeats: primary.seats,
      reason: buildStandardReason(kind, primary.row, primary.seats, size),
    };
  }

  const fallback = findSeatsInRows(profile.fallbackRows, size, unavailable);
  if (fallback !== null) {
    return {
      seatType: profile.seatType,
      recommendedRows: [fallback.row],
      recommendedSeats: fallback.seats,
      reason: `Các hàng ghế đẹp nhất đã kín, nên mình chọn hàng ${fallback.row} (ghế ${fallback.seats.join(", ")}) là vị trí gần sweet spot nhất còn trống.`,
    };
  }

  return {
    seatType: profile.seatType,
    recommendedRows: [...profile.rows],
    recommendedSeats: [],
    reason: `Các ghế trung tâm hàng ${profile.rows.join(", ")} đã kín chỗ cho ${size} người. Bạn hãy chọn thủ công ở sơ đồ ghế hoặc thử một suất chiếu khác nhé.`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Nhận diện số người từ câu chat                                            */
/* -------------------------------------------------------------------------- */

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  nam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
};

/** Trả về số người nếu câu chat nói rõ, ngược lại `null`. */
export function extractPartySize(message: string): number | null {
  const text = toAscii(message);

  const numeric = /(?:^|\s)(\d{1,2}) (?:nguoi|ban|ve|ghe|suat)(?:\s|$)/.exec(text);
  if (numeric?.[1]) return Number.parseInt(numeric[1], 10);

  const group = /(?:^|\s)nhom (\d{1,2})(?:\s|$)/.exec(text);
  if (group?.[1]) return Number.parseInt(group[1], 10);

  const worded = /(?:^|\s)(mot|hai|ba|bon|nam|sau|bay|tam) (?:nguoi|ban|ve|ghe)(?:\s|$)/.exec(text);
  if (worded?.[1]) {
    const value = NUMBER_WORDS[worded[1]];
    if (value !== undefined) return value;
  }

  if (/(?:^|\s)(?:mot minh|solo)(?:\s|$)/.test(text)) return 1;

  const coupleHints = ["cap doi", "hen ho", "nguoi yeu", "ban gai", "ban trai", "vo chong"];
  if (coupleHints.some((hint) => ` ${text} `.includes(` ${hint} `))) return 2;

  return null;
}
