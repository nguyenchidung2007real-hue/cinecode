// src/lib/adminSeatAndMovieStore.ts
// -----------------------------------------------------------------------------
// Store phía Admin của CineMax AI (in-memory, singleton an toàn với HMR của Next.js):
//   1. Sơ đồ ghế: khóa bảo trì, đổi hạng ghế, thu hồi ghế đang bị giữ treo.
//   2. Phim: thêm / sửa / xóa mềm vào thùng rác / khôi phục / xóa vĩnh viễn.
//   3. Nhật ký an ninh (audit log) tự động ghi mọi thao tác trên.
//
// Quy ước "scope" (phạm vi áp dụng) cho ghế:
//   - Ghi (block / đổi hạng): nếu có showtimeId -> áp dụng cho suất chiếu đó,
//     nếu không có thì dùng roomId -> áp dụng cho toàn bộ phòng chiếu.
//   - Đọc: gộp cả cấp phòng lẫn cấp suất chiếu (suất chiếu ưu tiên hơn phòng).
// -----------------------------------------------------------------------------

import type { Movie } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";
import { allSeatIds, seatTier } from "@/lib/seatLayout";
import { getSeatStore } from "@/lib/seatStore";

// ============================== TYPES ========================================

export type SeatTier = "standard" | "vip" | "couple";

export const SEAT_TIERS: readonly SeatTier[] = ["standard", "vip", "couple"] as const;

/** Các lý do bảo trì gợi ý để hiển thị trong dropdown của Admin UI. */
export const MAINTENANCE_REASON_PRESETS: readonly string[] = [
  "Hỏng tay vịn",
  "Bảo trì đệm ghế",
  "Ghế khách mời VIP",
  "Hỏng cơ cấu ngả lưng",
  "Vệ sinh / xử lý sự cố",
] as const;

export interface SeatScope {
  roomId?: string;
  showtimeId?: string | number;
}

export interface BlockedSeatRecord {
  seatId: string;
  scopeKey: string;
  roomId?: string;
  showtimeId?: string;
  reason: string;
  blockedAt: string; // ISO
  blockedBy: string;
}

export interface TrashedMovie {
  movie: Movie;
  deletedAt: string; // ISO
  deletedBy: string;
}

export type AuditAction =
  | "SEAT_BLOCKED"
  | "SEAT_UNBLOCKED"
  | "SEAT_TIER_CHANGED"
  | "SEAT_TIER_RESET"
  | "SEAT_FORCE_RELEASED"
  | "MOVIE_CREATED"
  | "MOVIE_UPDATED"
  | "MOVIE_TRASHED"
  | "MOVIE_RESTORED"
  | "MOVIE_PERMANENTLY_DELETED"
  | "TRASH_EMPTIED";

export type AuditTargetType = "seat" | "movie" | "trash";

export interface AuditLogItem {
  id: string;
  timestamp: string; // ISO
  actor: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export type CreateMovieInput = Partial<Omit<Movie, "id">> & {
  id?: string | number;
  title: string;
};

export type UpdateMovieInput = Partial<Omit<Movie, "id">>;

export interface BlockSeatsResult {
  blocked: BlockedSeatRecord[];
  alreadyBlocked: string[];
}

export interface UnblockSeatsResult {
  unblocked: string[];
  notBlocked: string[];
}

export interface SetSeatTierResult {
  changed: Array<{ seatId: string; from: SeatTier; to: SeatTier }>;
  unchanged: string[];
}

export interface ForceReleaseResult {
  showtimeId: string;
  holdId: string;
  seatId?: string;
  released: boolean;
  rawResult: unknown;
}

export interface AuditLogQuery {
  limit?: number;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  actor?: string;
}

export type AdminStoreErrorCode =
  | "INVALID_INPUT"
  | "INVALID_SEAT"
  | "INVALID_SCOPE"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export class AdminStoreError extends Error {
  public readonly code: AdminStoreErrorCode;

  constructor(code: AdminStoreErrorCode, message: string) {
    super(message);
    this.name = "AdminStoreError";
    this.code = code;
  }
}

// ============================== STATE ========================================

interface AdminState {
  /** scopeKey -> (seatId -> record) */
  blockedSeats: Map<string, Map<string, BlockedSeatRecord>>;
  /** scopeKey -> (seatId -> tier tùy chỉnh) */
  customSeatTiers: Map<string, Map<string, SeatTier>>;
  /** movieId (string) -> movie đang hoạt động */
  movies: Map<string, Movie>;
  /** movieId (string) -> phim trong thùng rác */
  trash: Map<string, TrashedMovie>;
  /** mới nhất ở đầu mảng */
  auditLogs: AuditLogItem[];
}

const MAX_AUDIT_LOGS = 1000;
const MAX_REASON_LENGTH = 200;

type GlobalWithAdminState = typeof globalThis & {
  __cinemaxAdminState?: AdminState;
};

function cloneMovie(movie: Movie): Movie {
  return {
    ...movie,
    genres: [...movie.genres],
    cast: [...movie.cast],
  };
}

function createInitialState(): AdminState {
  const movies = new Map<string, Movie>();
  for (const movie of MOCK_MOVIES) {
    movies.set(String(movie.id), cloneMovie(movie));
  }
  return {
    blockedSeats: new Map(),
    customSeatTiers: new Map(),
    movies,
    trash: new Map(),
    auditLogs: [],
  };
}

function state(): AdminState {
  const g = globalThis as GlobalWithAdminState;
  if (!g.__cinemaxAdminState) {
    g.__cinemaxAdminState = createInitialState();
  }
  return g.__cinemaxAdminState;
}

// ============================== HELPERS ======================================

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function normalizeActor(actor?: string): string {
  const trimmed = (actor ?? "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : "admin";
}

function normalizeReason(reason: unknown): string {
  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new AdminStoreError("INVALID_INPUT", "Lý do bảo trì là bắt buộc.");
  }
  const trimmed = reason.trim();
  if (trimmed.length > MAX_REASON_LENGTH) {
    throw new AdminStoreError(
      "INVALID_INPUT",
      `Lý do bảo trì tối đa ${MAX_REASON_LENGTH} ký tự.`
    );
  }
  return trimmed;
}

function isSeatTier(value: unknown): value is SeatTier {
  return typeof value === "string" && (SEAT_TIERS as readonly string[]).includes(value);
}

function writeScopeKey(scope: SeatScope): string {
  if (scope.showtimeId !== undefined && scope.showtimeId !== null && String(scope.showtimeId) !== "") {
    return `showtime:${String(scope.showtimeId)}`;
  }
  if (scope.roomId !== undefined && scope.roomId !== null && String(scope.roomId) !== "") {
    return `room:${String(scope.roomId)}`;
  }
  throw new AdminStoreError(
    "INVALID_SCOPE",
    "Cần cung cấp showtimeId hoặc roomId để xác định phạm vi."
  );
}

/** Danh sách scopeKey dùng khi ĐỌC, theo thứ tự ưu tiên: suất chiếu -> phòng. */
function readScopeKeys(scope: SeatScope): string[] {
  const keys: string[] = [];
  if (scope.showtimeId !== undefined && scope.showtimeId !== null && String(scope.showtimeId) !== "") {
    keys.push(`showtime:${String(scope.showtimeId)}`);
  }
  if (scope.roomId !== undefined && scope.roomId !== null && String(scope.roomId) !== "") {
    keys.push(`room:${String(scope.roomId)}`);
  }
  if (keys.length === 0) {
    throw new AdminStoreError(
      "INVALID_SCOPE",
      "Cần cung cấp showtimeId hoặc roomId để xác định phạm vi."
    );
  }
  return keys;
}

function validSeatIdSet(): Set<string> {
  return new Set(allSeatIds());
}

function normalizeSeatIds(seatIds: unknown): string[] {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new AdminStoreError("INVALID_INPUT", "Danh sách ghế không được để trống.");
  }
  const valid = validSeatIdSet();
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of seatIds) {
    if (typeof raw !== "string") {
      throw new AdminStoreError("INVALID_SEAT", "Mã ghế phải là chuỗi.");
    }
    const id = raw.trim().toUpperCase();
    if (!valid.has(id)) {
      throw new AdminStoreError("INVALID_SEAT", `Ghế "${raw}" không tồn tại trong sơ đồ.`);
    }
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

function getOrCreateInner<V>(
  outer: Map<string, Map<string, V>>,
  key: string
): Map<string, V> {
  let inner = outer.get(key);
  if (!inner) {
    inner = new Map<string, V>();
    outer.set(key, inner);
  }
  return inner;
}

// ============================== AUDIT LOG ====================================

function pushAudit(entry: Omit<AuditLogItem, "id" | "timestamp">): AuditLogItem {
  const item: AuditLogItem = {
    id: randomId("audit"),
    timestamp: nowIso(),
    ...entry,
  };
  const s = state();
  s.auditLogs.unshift(item);
  if (s.auditLogs.length > MAX_AUDIT_LOGS) {
    s.auditLogs.length = MAX_AUDIT_LOGS;
  }
  return item;
}

export function getAuditLogs(query: AuditLogQuery = {}): AuditLogItem[] {
  const limit =
    typeof query.limit === "number" && Number.isFinite(query.limit)
      ? Math.min(Math.max(Math.floor(query.limit), 1), MAX_AUDIT_LOGS)
      : 100;

  return state()
    .auditLogs.filter((log) => {
      if (query.action && log.action !== query.action) return false;
      if (query.targetType && log.targetType !== query.targetType) return false;
      if (query.targetId && log.targetId !== query.targetId) return false;
      if (query.actor && log.actor !== query.actor) return false;
      return true;
    })
    .slice(0, limit)
    .map((log) => ({ ...log, metadata: log.metadata ? { ...log.metadata } : undefined }));
}

export function clearAuditLogsForTesting(): void {
  state().auditLogs = [];
}

// ============================== SEAT: TIER ===================================

/** Hạng ghế hiệu lực: tùy chỉnh theo suất chiếu > tùy chỉnh theo phòng > mặc định. */
export function getEffectiveSeatTier(seatId: string, scope: SeatScope): SeatTier {
  const id = seatId.trim().toUpperCase();
  const s = state();
  for (const key of readScopeKeys(scope)) {
    const custom = s.customSeatTiers.get(key)?.get(id);
    if (custom) return custom;
  }
  return seatTier(id);
}

export function isSeatTierCustomized(seatId: string, scope: SeatScope): boolean {
  const id = seatId.trim().toUpperCase();
  const s = state();
  return readScopeKeys(scope).some((key) => s.customSeatTiers.get(key)?.has(id) ?? false);
}

/** Trả về toàn bộ map hạng ghế hiệu lực của sơ đồ. */
export function getSeatTierMap(scope: SeatScope): Record<string, SeatTier> {
  const result: Record<string, SeatTier> = {};
  for (const id of allSeatIds()) {
    result[id] = getEffectiveSeatTier(id, scope);
  }
  return result;
}

export function setSeatTiers(
  scope: SeatScope,
  seatIds: string[],
  tier: SeatTier,
  actor?: string
): SetSeatTierResult {
  if (!isSeatTier(tier)) {
    throw new AdminStoreError(
      "INVALID_INPUT",
      `Hạng ghế không hợp lệ. Chỉ chấp nhận: ${SEAT_TIERS.join(", ")}.`
    );
  }
  const ids = normalizeSeatIds(seatIds);
  const key = writeScopeKey(scope);
  const by = normalizeActor(actor);
  const custom = getOrCreateInner(state().customSeatTiers, key);

  const changed: SetSeatTierResult["changed"] = [];
  const unchanged: string[] = [];

  for (const id of ids) {
    const current = getEffectiveSeatTier(id, scope);
    if (current === tier) {
      unchanged.push(id);
      continue;
    }
    // Nếu hạng mới trùng với mặc định (và không có scope khác đang override)
    // thì xóa override cho gọn dữ liệu; ngược lại ghi tường minh.
    const overriddenElsewhere = readScopeKeys(scope).some(
      (k) => k !== key && (state().customSeatTiers.get(k)?.has(id) ?? false)
    );
    if (seatTier(id) === tier && !overriddenElsewhere) {
      custom.delete(id);
    } else {
      custom.set(id, tier);
    }
    changed.push({ seatId: id, from: current, to: tier });
  }

  if (changed.length > 0) {
    pushAudit({
      actor: by,
      action: "SEAT_TIER_CHANGED",
      targetType: "seat",
      targetId: key,
      details: `Đổi hạng ${changed.length} ghế sang "${tier}": ${changed
        .map((c) => `${c.seatId} (${c.from} → ${c.to})`)
        .join(", ")}`,
      metadata: { scopeKey: key, tier, changed },
    });
  }

  return { changed, unchanged };
}

export function resetSeatTiers(
  scope: SeatScope,
  seatIds: string[],
  actor?: string
): { reset: string[]; notCustomized: string[] } {
  const ids = normalizeSeatIds(seatIds);
  const key = writeScopeKey(scope);
  const by = normalizeActor(actor);
  const custom = state().customSeatTiers.get(key);

  const reset: string[] = [];
  const notCustomized: string[] = [];

  for (const id of ids) {
    if (custom && custom.delete(id)) {
      reset.push(id);
    } else {
      notCustomized.push(id);
    }
  }

  if (reset.length > 0) {
    pushAudit({
      actor: by,
      action: "SEAT_TIER_RESET",
      targetType: "seat",
      targetId: key,
      details: `Khôi phục hạng ghế mặc định cho ${reset.length} ghế: ${reset.join(", ")}`,
      metadata: { scopeKey: key, seatIds: reset },
    });
  }

  return { reset, notCustomized };
}

// ============================== SEAT: BLOCK ==================================

export function blockSeats(
  scope: SeatScope,
  seatIds: string[],
  reason: string,
  actor?: string
): BlockSeatsResult {
  const ids = normalizeSeatIds(seatIds);
  const cleanReason = normalizeReason(reason);
  const key = writeScopeKey(scope);
  const by = normalizeActor(actor);
  const bucket = getOrCreateInner(state().blockedSeats, key);

  const blocked: BlockedSeatRecord[] = [];
  const alreadyBlocked: string[] = [];

  for (const id of ids) {
    if (bucket.has(id)) {
      alreadyBlocked.push(id);
      continue;
    }
    const record: BlockedSeatRecord = {
      seatId: id,
      scopeKey: key,
      roomId: scope.roomId !== undefined ? String(scope.roomId) : undefined,
      showtimeId: scope.showtimeId !== undefined ? String(scope.showtimeId) : undefined,
      reason: cleanReason,
      blockedAt: nowIso(),
      blockedBy: by,
    };
    bucket.set(id, record);
    blocked.push({ ...record });
  }

  if (blocked.length > 0) {
    pushAudit({
      actor: by,
      action: "SEAT_BLOCKED",
      targetType: "seat",
      targetId: key,
      details: `Khóa bảo trì ${blocked.length} ghế (${blocked
        .map((b) => b.seatId)
        .join(", ")}) - Lý do: ${cleanReason}`,
      metadata: { scopeKey: key, seatIds: blocked.map((b) => b.seatId), reason: cleanReason },
    });
  }

  return { blocked, alreadyBlocked };
}

export function unblockSeats(
  scope: SeatScope,
  seatIds: string[],
  actor?: string
): UnblockSeatsResult {
  const ids = normalizeSeatIds(seatIds);
  const key = writeScopeKey(scope);
  const by = normalizeActor(actor);
  const bucket = state().blockedSeats.get(key);

  const unblocked: string[] = [];
  const notBlocked: string[] = [];
  const previousReasons: Record<string, string> = {};

  for (const id of ids) {
    const existing = bucket?.get(id);
    if (bucket && existing) {
      previousReasons[id] = existing.reason;
      bucket.delete(id);
      unblocked.push(id);
    } else {
      notBlocked.push(id);
    }
  }

  if (bucket && bucket.size === 0) {
    state().blockedSeats.delete(key);
  }

  if (unblocked.length > 0) {
    pushAudit({
      actor: by,
      action: "SEAT_UNBLOCKED",
      targetType: "seat",
      targetId: key,
      details: `Mở khóa ${unblocked.length} ghế: ${unblocked.join(", ")}`,
      metadata: { scopeKey: key, seatIds: unblocked, previousReasons },
    });
  }

  return { unblocked, notBlocked };
}

/** Danh sách ghế bị khóa hiệu lực (gộp cấp phòng + cấp suất chiếu). */
export function getBlockedSeats(scope: SeatScope): BlockedSeatRecord[] {
  const s = state();
  const merged = new Map<string, BlockedSeatRecord>();
  // Duyệt từ ưu tiên thấp (phòng) đến cao (suất chiếu) để suất chiếu ghi đè.
  const keys = [...readScopeKeys(scope)].reverse();
  for (const key of keys) {
    const bucket = s.blockedSeats.get(key);
    if (!bucket) continue;
    for (const [seatId, record] of bucket) {
      merged.set(seatId, record);
    }
  }
  return Array.from(merged.values())
    .map((r) => ({ ...r }))
    .sort((a, b) => a.seatId.localeCompare(b.seatId, "en", { numeric: true }));
}

export function getBlockedSeat(seatId: string, scope: SeatScope): BlockedSeatRecord | undefined {
  const id = seatId.trim().toUpperCase();
  const s = state();
  for (const key of readScopeKeys(scope)) {
    const record = s.blockedSeats.get(key)?.get(id);
    if (record) return { ...record };
  }
  return undefined;
}

export function isSeatBlocked(seatId: string, scope: SeatScope): boolean {
  return getBlockedSeat(seatId, scope) !== undefined;
}

// ============================== SEAT: FORCE RELEASE ==========================

/**
 * Admin cưỡng chế thu hồi lượt giữ ghế (hold) bị treo.
 * Dùng `getSeatStore().release(showtimeId, holdId)` có sẵn trong dự án.
 * `seatId` chỉ dùng để ghi log cho dễ truy vết (tùy chọn).
 */
export async function forceReleaseSeat(
  showtimeId: string | number,
  holdId: string,
  actor?: string,
  seatId?: string
): Promise<ForceReleaseResult> {
  const showtime = String(showtimeId ?? "").trim();
  const hold = String(holdId ?? "").trim();
  if (!showtime) {
    throw new AdminStoreError("INVALID_INPUT", "showtimeId là bắt buộc.");
  }
  if (!hold) {
    throw new AdminStoreError("INVALID_INPUT", "holdId là bắt buộc.");
  }

  let normalizedSeat: string | undefined;
  if (seatId !== undefined && seatId !== "") {
    normalizedSeat = normalizeSeatIds([seatId])[0];
  }

  const by = normalizeActor(actor);
  const store = getSeatStore();

  let rawResult: unknown;
  try {
    // release có thể đồng bộ hoặc bất đồng bộ tùy implementation -> luôn await.
    rawResult = await Promise.resolve(store.release(showtime, hold));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    throw new AdminStoreError("INTERNAL", `Không thể thu hồi ghế đang giữ: ${message}`);
  }

  // Nếu store trả về false/null/undefined-có-nghĩa-thất-bại thì coi như không thu hồi được.
  const released = rawResult === undefined ? true : Boolean(rawResult);

  pushAudit({
    actor: by,
    action: "SEAT_FORCE_RELEASED",
    targetType: "seat",
    targetId: `showtime:${showtime}`,
    details: `Cưỡng chế thu hồi lượt giữ ghế ${hold}${
      normalizedSeat ? ` (ghế ${normalizedSeat})` : ""
    } tại suất chiếu ${showtime}${released ? "" : " - store báo không thu hồi được"}`,
    metadata: { showtimeId: showtime, holdId: hold, seatId: normalizedSeat, released },
  });

  return { showtimeId: showtime, holdId: hold, seatId: normalizedSeat, released, rawResult };
}

/** Lấy trạng thái realtime của ghế từ seatStore (giữ nguyên định dạng gốc). */
export async function getLiveSeatStatuses(
  showtimeId: string | number,
  seatIds: string[] = allSeatIds()
): Promise<unknown> {
  const store = getSeatStore();
  return Promise.resolve(store.statuses(String(showtimeId), seatIds));
}

// ============================== MOVIES =======================================

function ensureMovieFields(input: CreateMovieInput): Omit<Movie, "id"> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    throw new AdminStoreError("INVALID_INPUT", "Tên phim (title) là bắt buộc.");
  }

  const voteAverage = input.voteAverage ?? 0;
  if (typeof voteAverage !== "number" || voteAverage < 0 || voteAverage > 10) {
    throw new AdminStoreError("INVALID_INPUT", "voteAverage phải nằm trong khoảng 0 - 10.");
  }

  const duration = input.durationMinutes ?? 0;
  if (typeof duration !== "number" || duration < 0 || !Number.isFinite(duration)) {
    throw new AdminStoreError("INVALID_INPUT", "durationMinutes phải là số không âm.");
  }

  const status = input.status ?? "upcoming";
  if (status !== "now_playing" && status !== "upcoming" && status !== "trending") {
    throw new AdminStoreError(
      "INVALID_INPUT",
      'status chỉ nhận: "now_playing", "upcoming", "trending".'
    );
  }

  return {
    title,
    originalTitle: input.originalTitle?.trim() || undefined,
    overview: input.overview?.trim() ?? "",
    posterPath: input.posterPath ?? "",
    backdropPath: input.backdropPath ?? "",
    releaseDate: input.releaseDate ?? "",
    voteAverage,
    voteCount: input.voteCount ?? 0,
    genres: Array.isArray(input.genres) ? [...input.genres] : [],
    durationMinutes: duration,
    director: input.director?.trim() ?? "",
    cast: Array.isArray(input.cast) ? [...input.cast] : [],
    trailerYoutubeId: input.trailerYoutubeId ?? "",
    ageRating: input.ageRating ?? "",
    status,
  };
}

function diffMovie(before: Movie, after: Movie): string[] {
  const changed: string[] = [];
  const keys = Object.keys(after) as Array<keyof Movie>;
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(String(key));
    }
  }
  return changed;
}

export function listMovies(filter: { status?: Movie["status"]; q?: string } = {}): Movie[] {
  const q = filter.q?.trim().toLowerCase();
  return Array.from(state().movies.values())
    .filter((m) => {
      if (filter.status && m.status !== filter.status) return false;
      if (q) {
        const haystack = `${m.title} ${m.originalTitle ?? ""} ${m.director}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .map(cloneMovie);
}

export function getMovie(id: string | number): Movie | undefined {
  const movie = state().movies.get(String(id));
  return movie ? cloneMovie(movie) : undefined;
}

export function addMovie(input: CreateMovieInput, actor?: string): Movie {
  const by = normalizeActor(actor);
  const fields = ensureMovieFields(input);
  const s = state();

  let id: string | number;
  if (input.id !== undefined && String(input.id).trim() !== "") {
    id = input.id;
    const key = String(id);
    if (s.movies.has(key) || s.trash.has(key)) {
      throw new AdminStoreError("CONFLICT", `Phim có id "${key}" đã tồn tại.`);
    }
  } else {
    do {
      id = randomId("movie");
    } while (s.movies.has(String(id)) || s.trash.has(String(id)));
  }

  const movie: Movie = { id, ...fields };
  s.movies.set(String(id), movie);

  pushAudit({
    actor: by,
    action: "MOVIE_CREATED",
    targetType: "movie",
    targetId: String(id),
    details: `Thêm phim "${movie.title}"`,
    metadata: { status: movie.status },
  });

  return cloneMovie(movie);
}

export function updateMovie(id: string | number, patch: UpdateMovieInput, actor?: string): Movie {
  const by = normalizeActor(actor);
  const key = String(id);
  const s = state();
  const existing = s.movies.get(key);
  if (!existing) {
    throw new AdminStoreError("NOT_FOUND", `Không tìm thấy phim có id "${key}".`);
  }

  // Gộp patch rồi validate lại toàn bộ để đảm bảo dữ liệu nhất quán.
  const merged = ensureMovieFields({ ...existing, ...patch, title: patch.title ?? existing.title });
  const updated: Movie = { id: existing.id, ...merged };
  const changedFields = diffMovie(existing, updated);

  s.movies.set(key, updated);

  if (changedFields.length > 0) {
    pushAudit({
      actor: by,
      action: "MOVIE_UPDATED",
      targetType: "movie",
      targetId: key,
      details: `Sửa phim "${updated.title}" - trường thay đổi: ${changedFields.join(", ")}`,
      metadata: { changedFields },
    });
  }

  return cloneMovie(updated);
}

// ------------------------------ Thùng rác ------------------------------------

export function listTrash(): TrashedMovie[] {
  return Array.from(state().trash.values())
    .map((t) => ({ ...t, movie: cloneMovie(t.movie) }))
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export function softDeleteMovie(id: string | number, actor?: string): TrashedMovie {
  const by = normalizeActor(actor);
  const key = String(id);
  const s = state();
  const existing = s.movies.get(key);
  if (!existing) {
    throw new AdminStoreError("NOT_FOUND", `Không tìm thấy phim có id "${key}".`);
  }

  const trashed: TrashedMovie = {
    movie: cloneMovie(existing),
    deletedAt: nowIso(),
    deletedBy: by,
  };
  s.movies.delete(key);
  s.trash.set(key, trashed);

  pushAudit({
    actor: by,
    action: "MOVIE_TRASHED",
    targetType: "movie",
    targetId: key,
    details: `Chuyển phim "${existing.title}" vào thùng rác`,
  });

  return { ...trashed, movie: cloneMovie(trashed.movie) };
}

export function restoreMovie(id: string | number, actor?: string): Movie {
  const by = normalizeActor(actor);
  const key = String(id);
  const s = state();
  const trashed = s.trash.get(key);
  if (!trashed) {
    throw new AdminStoreError("NOT_FOUND", `Không tìm thấy phim id "${key}" trong thùng rác.`);
  }
  if (s.movies.has(key)) {
    throw new AdminStoreError("CONFLICT", `Đã có phim khác dùng id "${key}", không thể khôi phục.`);
  }

  s.trash.delete(key);
  s.movies.set(key, cloneMovie(trashed.movie));

  pushAudit({
    actor: by,
    action: "MOVIE_RESTORED",
    targetType: "movie",
    targetId: key,
    details: `Khôi phục phim "${trashed.movie.title}" từ thùng rác`,
  });

  return cloneMovie(trashed.movie);
}

export function permanentlyDeleteMovie(id: string | number, actor?: string): TrashedMovie {
  const by = normalizeActor(actor);
  const key = String(id);
  const s = state();
  const trashed = s.trash.get(key);
  if (!trashed) {
    throw new AdminStoreError(
      "NOT_FOUND",
      `Phim id "${key}" không nằm trong thùng rác. Hãy xóa mềm trước khi xóa vĩnh viễn.`
    );
  }

  s.trash.delete(key);

  pushAudit({
    actor: by,
    action: "MOVIE_PERMANENTLY_DELETED",
    targetType: "movie",
    targetId: key,
    details: `Xóa vĩnh viễn phim "${trashed.movie.title}"`,
    metadata: { deletedAt: trashed.deletedAt, deletedBy: trashed.deletedBy },
  });

  return { ...trashed, movie: cloneMovie(trashed.movie) };
}

export function emptyTrash(actor?: string): { removed: number } {
  const by = normalizeActor(actor);
  const s = state();
  const removed = s.trash.size;
  if (removed === 0) return { removed: 0 };

  const titles = Array.from(s.trash.values()).map((t) => t.movie.title);
  s.trash.clear();

  pushAudit({
    actor: by,
    action: "TRASH_EMPTIED",
    targetType: "trash",
    targetId: "trash",
    details: `Dọn sạch thùng rác (${removed} phim): ${titles.join(", ")}`,
    metadata: { removed },
  });

  return { removed };
}

// ============================== RESET (TEST) =================================

/** Chỉ dùng cho test / dev: đưa toàn bộ state về trạng thái ban đầu. */
export function resetAdminStoreForTesting(): void {
  (globalThis as GlobalWithAdminState).__cinemaxAdminState = createInitialState();
}
