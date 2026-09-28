/**
 * CineMax AI - Showtime Collision Detection Engine (Nhiệm vụ 3)
 *
 * Module thuần TypeScript, không phụ thuộc React/Next/Node, dùng được ở cả server lẫn client.
 *
 * Quy ước (theo yêu cầu vận hành rạp):
 *   Thời gian chiếm dụng phòng = thời lượng phim + 10 phút trailer/quảng cáo + 15 phút dọn phòng
 *   Khoảng chiếm dụng là nửa mở [start, start + thời lượng + 25): suất sau được bắt đầu
 *   đúng vào phút kết thúc của suất trước (không cần thêm đệm nào nữa).
 *
 * Xung đột được xét trong CÙNG phòng (cùng cinemaId nếu có) và tính trên trục thời gian tuyệt đối,
 * nên suất chiếu khuya kéo sang ngày hôm sau vẫn xung đột với suất sáng sớm ngày kế tiếp.
 */

/* -------------------------------------------------------------------------- */
/*  Hằng số & Types                                                           */
/* -------------------------------------------------------------------------- */

export const TRAILER_MINUTES = 10;
export const CLEANING_MINUTES = 15;
export const BUFFER_MINUTES = TRAILER_MINUTES + CLEANING_MINUTES;

const SLOT_STEP_MINUTES = 5;
const MAX_DURATION_MINUTES = 600;
const DEFAULT_OPEN_MINUTE = 8 * 60; // 08:00
const DEFAULT_LATEST_START_MINUTE = 23 * 60 + 30; // 23:30
const DEFAULT_SUGGESTION_LIMIT = 3;

export interface ShowtimeLike {
  /** Dùng để loại chính nó khi sửa một suất đã có. */
  id?: string;
  cinemaId?: string;
  roomName: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24 giờ) */
  time: string;
  durationMinutes: number;
  /** Chỉ để hiển thị trong thông báo xung đột. */
  movieTitle?: string;
}

export interface CollisionOptions {
  /** Phút trong ngày rạp bắt đầu nhận suất (mặc định 08:00 = 480). */
  openMinute?: number;
  /** Phút trong ngày muộn nhất được phép BẮT ĐẦU một suất (mặc định 23:30 = 1410). */
  latestStartMinute?: number;
  /** Số gợi ý tối đa (mặc định 3). */
  suggestionLimit?: number;
  /** Bỏ qua suất có id này (dùng khi chỉnh sửa). */
  excludeId?: string;
}

export type ConflictKind = "overlap" | "buffer";

export interface ShowtimeConflict {
  kind: ConflictKind;
  existing: ShowtimeLike;
  /** Khoảng chiếm dụng của suất đã có, để hiển thị. */
  existingRange: TimeRange;
  message: string;
}

export interface TimeRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface SuggestedSlot {
  date: string;
  time: string;
  range: TimeRange;
  /** Lệch bao nhiêu phút so với giờ người dùng chọn (dương = muộn hơn). */
  offsetMinutes: number;
}

export interface CollisionResult {
  /** Dữ liệu nhập hợp lệ VÀ không xung đột → được phép lưu. */
  ok: boolean;
  /** Dữ liệu đầu vào hợp lệ (đúng định dạng). */
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ShowtimeConflict[];
  occupied: TimeRange | null;
  totalOccupiedMinutes: number | null;
  suggestions: SuggestedSlot[];
}

/* -------------------------------------------------------------------------- */
/*  Xử lý thời gian tuyệt đối (phút kể từ epoch, UTC → không dính múi giờ/DST) */
/* -------------------------------------------------------------------------- */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toAbsoluteMinute(date: string, time: string): number | null {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const dayStartMs = Date.UTC(year, month - 1, day);

  // Bắt ngày không tồn tại như 2026-02-31.
  const check = new Date(dayStartMs);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }

  return dayStartMs / 60_000 + Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
}

function fromAbsoluteMinute(minute: number): { date: string; time: string } {
  const iso = new Date(minute * 60_000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function roundUpToStep(minute: number): number {
  return Math.ceil(minute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

function roundDownToStep(minute: number): number {
  return Math.floor(minute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

/* -------------------------------------------------------------------------- */
/*  Khoảng chiếm dụng                                                         */
/* -------------------------------------------------------------------------- */

interface Interval {
  source: ShowtimeLike;
  start: number;
  /** Hết phim (chưa tính trailer + dọn phòng). */
  coreEnd: number;
  /** Hết chiếm dụng phòng (đã cộng 25 phút). Khoảng là [start, end). */
  end: number;
}

function isValidDuration(duration: number): boolean {
  return Number.isInteger(duration) && duration > 0 && duration <= MAX_DURATION_MINUTES;
}

function buildInterval(showtime: ShowtimeLike): Interval | null {
  const start = toAbsoluteMinute(showtime.date, showtime.time);
  if (start === null || !isValidDuration(showtime.durationMinutes)) return null;

  const coreEnd = start + showtime.durationMinutes;
  return { source: showtime, start, coreEnd, end: coreEnd + BUFFER_MINUTES };
}

function toRange(start: number, end: number): TimeRange {
  const from = fromAbsoluteMinute(start);
  const to = fromAbsoluteMinute(end);
  return { startDate: from.date, startTime: from.time, endDate: to.date, endTime: to.time };
}

/** Tổng thời gian chiếm dụng phòng của một phim: thời lượng + 10 + 15 phút. */
export function computeOccupiedMinutes(durationMinutes: number): number {
  return durationMinutes + BUFFER_MINUTES;
}

function roomKey(showtime: ShowtimeLike): string {
  return `${showtime.cinemaId ?? ""}|${showtime.roomName.trim().toLowerCase()}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function describeRange(range: TimeRange): string {
  const sameDay = range.startDate === range.endDate;
  return sameDay
    ? `${range.startTime}–${range.endTime}`
    : `${range.startTime}–${range.endTime} (ngày ${range.endDate})`;
}

/* -------------------------------------------------------------------------- */
/*  Kiểm tra dữ liệu vào                                                      */
/* -------------------------------------------------------------------------- */

function validateCandidate(candidate: ShowtimeLike): string[] {
  const errors: string[] = [];

  if (candidate.roomName.trim() === "") errors.push("Chưa chọn phòng chiếu.");
  if (toAbsoluteMinute(candidate.date, "00:00") === null) {
    errors.push("Ngày chiếu không hợp lệ (cần dạng YYYY-MM-DD, ngày có thật).");
  }
  if (!TIME_PATTERN.test(candidate.time)) errors.push("Giờ chiếu không hợp lệ (cần dạng HH:mm, 00:00–23:59).");
  if (!isValidDuration(candidate.durationMinutes)) {
    errors.push(`Thời lượng phim phải là số nguyên phút từ 1 đến ${MAX_DURATION_MINUTES}.`);
  }
  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Gợi ý khung giờ trống gần nhất                                            */
/* -------------------------------------------------------------------------- */

function suggestSlots(
  candidate: Interval,
  roomIntervals: readonly Interval[],
  options: Required<Pick<CollisionOptions, "openMinute" | "latestStartMinute" | "suggestionLimit">>,
): SuggestedSlot[] {
  const dayStart = toAbsoluteMinute(candidate.source.date, "00:00");
  if (dayStart === null) return [];

  const length = candidate.end - candidate.start;
  const dayOpen = dayStart + options.openMinute;
  const dayLatest = dayStart + options.latestStartMinute;
  const requestedStart = candidate.start;

  // Vị trí đáng thử: giờ mở cửa, ngay sau khi mỗi suất khác kết thúc,
  // và sát ngay trước mỗi suất khác (lùi đúng độ dài suất mới).
  const positions = new Set<number>([roundUpToStep(dayOpen)]);
  for (const interval of roomIntervals) {
    positions.add(roundUpToStep(interval.end));
    positions.add(roundDownToStep(interval.start - length));
  }

  const feasible: number[] = [];
  for (const position of positions) {
    if (position < dayOpen || position > dayLatest || position === requestedStart) continue;
    const collides = roomIntervals.some((interval) => overlaps(position, position + length, interval.start, interval.end));
    if (!collides) feasible.push(position);
  }

  feasible.sort((a, b) => Math.abs(a - requestedStart) - Math.abs(b - requestedStart) || a - b);

  return feasible.slice(0, options.suggestionLimit).map((position) => {
    const { date, time } = fromAbsoluteMinute(position);
    return { date, time, range: toRange(position, position + length), offsetMinutes: position - requestedStart };
  });
}

/* -------------------------------------------------------------------------- */
/*  API chính                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Kiểm tra một suất chiếu MỚI (hoặc đang chỉnh sửa) có đụng lịch suất khác trong cùng phòng không.
 * `existing` có thể chứa suất của mọi phòng/rạp; hàm tự lọc đúng phòng.
 */
export function checkShowtimeCollision(
  candidate: ShowtimeLike,
  existing: readonly ShowtimeLike[],
  options: CollisionOptions = {},
): CollisionResult {
  const errors = validateCandidate(candidate);
  const candidateInterval = errors.length === 0 ? buildInterval(candidate) : null;

  if (candidateInterval === null) {
    return {
      ok: false,
      valid: false,
      errors: errors.length > 0 ? errors : ["Dữ liệu suất chiếu không hợp lệ."],
      warnings: [],
      conflicts: [],
      occupied: null,
      totalOccupiedMinutes: null,
      suggestions: [],
    };
  }

  const excludeId = options.excludeId ?? candidate.id;
  const targetRoom = roomKey(candidate);
  const warnings: string[] = [];
  const roomIntervals: Interval[] = [];

  for (const showtime of existing) {
    if (roomKey(showtime) !== targetRoom) continue;
    if (excludeId !== undefined && showtime.id === excludeId) continue;

    const interval = buildInterval(showtime);
    if (interval === null) {
      warnings.push(`Bỏ qua một suất có dữ liệu lỗi trong ${showtime.roomName} (ngày ${showtime.date}, giờ ${showtime.time}).`);
      continue;
    }
    roomIntervals.push(interval);
  }

  const conflicts: ShowtimeConflict[] = [];
  for (const interval of roomIntervals) {
    if (!overlaps(candidateInterval.start, candidateInterval.end, interval.start, interval.end)) continue;

    const coresOverlap = overlaps(candidateInterval.start, candidateInterval.coreEnd, interval.start, interval.coreEnd);
    const existingRange = toRange(interval.start, interval.end);
    const title = interval.source.movieTitle ? ` "${interval.source.movieTitle}"` : "";
    const rangeText = describeRange(existingRange);

    conflicts.push({
      kind: coresOverlap ? "overlap" : "buffer",
      existing: interval.source,
      existingRange,
      message: coresOverlap
        ? `Trùng giờ chiếu${title} (${rangeText}) tại ${candidate.roomName}.`
        : `Chưa đủ ${TRAILER_MINUTES} phút quảng cáo + ${CLEANING_MINUTES} phút dọn phòng so với suất${title} (${rangeText}) tại ${candidate.roomName}.`,
    });
  }

  conflicts.sort((a, b) => a.existingRange.startDate.localeCompare(b.existingRange.startDate) || a.existingRange.startTime.localeCompare(b.existingRange.startTime));

  const suggestions =
    conflicts.length === 0
      ? []
      : suggestSlots(candidateInterval, roomIntervals, {
          openMinute: options.openMinute ?? DEFAULT_OPEN_MINUTE,
          latestStartMinute: options.latestStartMinute ?? DEFAULT_LATEST_START_MINUTE,
          suggestionLimit: options.suggestionLimit ?? DEFAULT_SUGGESTION_LIMIT,
        });

  return {
    ok: conflicts.length === 0,
    valid: true,
    errors: [],
    warnings,
    conflicts,
    occupied: toRange(candidateInterval.start, candidateInterval.end),
    totalOccupiedMinutes: candidateInterval.end - candidateInterval.start,
    suggestions,
  };
}
