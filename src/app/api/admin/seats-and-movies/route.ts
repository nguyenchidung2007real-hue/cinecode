// src/app/api/admin/seats-and-movies/route.ts
// -----------------------------------------------------------------------------
// API Admin: sơ đồ ghế, phim, thùng rác phim, nhật ký an ninh.
// Mọi method đều kiểm tra isAdminAuthorized(request).
//
// GET    ?resource=seatmap&showtimeId=..&roomId=..   Sơ đồ 102 ghế (statuses + blockedSeats + hạng ghế)
//        ?resource=showtimes                          Danh sách suất chiếu (từ MOCK_SHOWTIMES)
//        ?resource=blocked&showtimeId=..&roomId=..    Danh sách ghế đang khóa bảo trì
//        ?resource=movies[&status=..&q=..]            Danh sách phim
//        ?resource=trash                              Thùng rác phim
//        ?resource=audit[&limit=..&action=..&targetType=..&targetId=..&actor=..]
//
// POST   action: block_seat | unblock_seat | force_release | change_tier |
//                reset_tier | create_movie | restore_movie | trash_movie |
//                delete_movie | empty_trash
// PUT    action: update_movie | change_tier | reset_tier | restore_movie
// DELETE action: trash_movie (mặc định khi có id) | delete_movie (permanent=true) |
//                empty_trash | unblock_seat
//        DELETE nhận tham số từ JSON body hoặc query string.
//
// Header tùy chọn "x-admin-user": tên Admin được ghi vào nhật ký.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { MOCK_SHOWTIMES } from "@/lib/mockData";
import { allSeatIds, seatTier } from "@/lib/seatLayout";
import {
  AdminStoreError,
  MAINTENANCE_REASON_PRESETS,
  SEAT_TIERS,
  addMovie,
  blockSeats,
  emptyTrash,
  forceReleaseSeat,
  getAuditLogs,
  getBlockedSeat,
  getBlockedSeats,
  getEffectiveSeatTier,
  getLiveSeatStatuses,
  isSeatTierCustomized,
  listMovies,
  listTrash,
  permanentlyDeleteMovie,
  resetSeatTiers,
  restoreMovie,
  setSeatTiers,
  softDeleteMovie,
  unblockSeats,
  updateMovie,
} from "@/lib/adminSeatAndMovieStore";
import type {
  AuditAction,
  AuditTargetType,
  CreateMovieInput,
  SeatScope,
  SeatTier,
  UpdateMovieInput,
} from "@/lib/adminSeatAndMovieStore";
import type { Movie } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================== TYPES ========================================

type HttpMethod = "POST" | "PUT" | "DELETE";

type AdminAction =
  | "block_seat"
  | "unblock_seat"
  | "force_release"
  | "change_tier"
  | "reset_tier"
  | "create_movie"
  | "update_movie"
  | "trash_movie"
  | "restore_movie"
  | "delete_movie"
  | "empty_trash";

const ALLOWED_ACTIONS: Record<HttpMethod, ReadonlySet<AdminAction>> = {
  POST: new Set<AdminAction>([
    "block_seat",
    "unblock_seat",
    "force_release",
    "change_tier",
    "reset_tier",
    "create_movie",
    "restore_movie",
    "trash_movie",
    "delete_movie",
    "empty_trash",
  ]),
  PUT: new Set<AdminAction>(["update_movie", "change_tier", "reset_tier", "restore_movie"]),
  DELETE: new Set<AdminAction>(["trash_movie", "delete_movie", "empty_trash", "unblock_seat"]),
};

type LiveSeatStatus = "available" | "held" | "sold";

interface NormalizedLiveSeat {
  status: LiveSeatStatus;
  holdId: string | null;
  expiresAt: string | null;
}

interface ShowtimeDto {
  id: string;
  roomId: string;
  movieId: string | null;
  movieTitle: string | null;
  startTime: string;
  date: string;
  label: string;
}

// ============================== HELPERS ======================================

const NO_STORE = { "Cache-Control": "no-store" } as const;

function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status, headers: NO_STORE });
}

function fail(status: number, code: string, message: string, extra?: Record<string, string>): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: { ...NO_STORE, ...(extra ?? {}) } }
  );
}

function statusFromStoreError(code: AdminStoreError["code"]): number {
  switch (code) {
    case "INVALID_INPUT":
    case "INVALID_SEAT":
    case "INVALID_SCOPE":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    default:
      return 500;
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AdminStoreError) {
    return fail(statusFromStoreError(error.code), error.code, error.message);
  }
  console.error("[admin/seats-and-movies] Unexpected error:", error);
  return fail(500, "INTERNAL", "Đã xảy ra lỗi không mong muốn phía máy chủ.");
}

function getActor(request: NextRequest): string {
  const header = request.headers.get("x-admin-user");
  return header && header.trim().length > 0 ? header.trim().slice(0, 80) : "admin";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function readScope(source: Record<string, unknown>): SeatScope {
  return {
    roomId: optionalString(source.roomId),
    showtimeId: optionalString(source.showtimeId),
  };
}

function readSeatIds(source: Record<string, unknown>): string[] {
  const value = source.seatIds;
  if (!Array.isArray(value) || value.length === 0) {
    throw new AdminStoreError("INVALID_INPUT", "seatIds phải là một mảng mã ghế (không rỗng).");
  }
  return value.map((v) => (typeof v === "string" ? v.trim().toUpperCase() : String(v)));
}

function readMovieId(source: Record<string, unknown>): string | number {
  const id = source.id;
  if ((typeof id === "string" && id.trim() !== "") || typeof id === "number") {
    return id;
  }
  throw new AdminStoreError("INVALID_INPUT", "id phim là bắt buộc.");
}

/** Chấp nhận "sweetbox" như bí danh của hạng "couple". */
function readTier(value: unknown): SeatTier {
  if (value === "sweetbox") return "couple";
  if (value === "standard" || value === "vip" || value === "couple") return value;
  throw new AdminStoreError(
    "INVALID_INPUT",
    `Hạng ghế không hợp lệ. Chỉ chấp nhận: ${SEAT_TIERS.join(", ")} (hoặc "sweetbox").`
  );
}

const MOVIE_STATUSES: ReadonlyArray<Movie["status"]> = ["now_playing", "upcoming", "trending"];

const AUDIT_ACTIONS: ReadonlyArray<AuditAction> = [
  "SEAT_BLOCKED",
  "SEAT_UNBLOCKED",
  "SEAT_TIER_CHANGED",
  "SEAT_TIER_RESET",
  "SEAT_FORCE_RELEASED",
  "MOVIE_CREATED",
  "MOVIE_UPDATED",
  "MOVIE_TRASHED",
  "MOVIE_RESTORED",
  "MOVIE_PERMANENTLY_DELETED",
  "TRASH_EMPTIED",
];

const AUDIT_TARGETS: ReadonlyArray<AuditTargetType> = ["seat", "movie", "trash"];

// ------------------------- Chuẩn hóa trạng thái ghế --------------------------

/** Chuyển kết quả `statuses()` (Map | object | array) về Record<seatId, raw>. */
function toStatusMap(value: unknown): Record<string, unknown> {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries()) as Record<string, unknown>;
  }
  if (Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    for (const item of value) {
      if (isRecord(item)) {
        const id = optionalString(item.seatId ?? item.id);
        if (id) result[id.toUpperCase()] = item;
      }
    }
    return result;
  }
  if (isRecord(value)) return value;
  return {};
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.trim() !== "") {
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : new Date(time).toISOString();
  }
  return null;
}

/**
 * Chuẩn hóa một phần tử trạng thái ghế về { status, holdId, expiresAt }.
 * Chấp nhận chuỗi ("held", "sold"...) hoặc object { status, holdId, expiresAt }.
 */
function normalizeLiveSeat(raw: unknown): NormalizedLiveSeat {
  let text = "";
  let holdId: string | null = null;
  let expiresAt: string | null = null;

  if (typeof raw === "string") {
    text = raw;
  } else if (isRecord(raw)) {
    text = String(raw.status ?? raw.state ?? raw.type ?? "");
    holdId = optionalString(raw.holdId ?? raw.hold_id ?? raw.heldBy) ?? null;
    expiresAt = toIsoOrNull(raw.expiresAt ?? raw.expiry ?? raw.holdUntil ?? raw.heldUntil);
  }

  const lower = text.toLowerCase();
  let status: LiveSeatStatus = "available";
  if (/sold|booked|paid|confirm|taken|purchas|occupied/.test(lower)) {
    status = "sold";
  } else if (/held|hold|lock|reserv|pending|select/.test(lower) || (holdId && lower === "")) {
    status = "held";
  }

  return { status, holdId, expiresAt };
}

async function readLiveStatuses(
  showtimeId: string | number | undefined,
  seatIds: string[]
): Promise<{ map: Record<string, NormalizedLiveSeat>; error: string | null }> {
  const map: Record<string, NormalizedLiveSeat> = {};
  if (showtimeId === undefined || showtimeId === null || showtimeId === "") return { map, error: null };
  try {
    const raw = toStatusMap(await getLiveSeatStatuses(showtimeId, seatIds));
    for (const id of seatIds) {
      map[id] = normalizeLiveSeat(raw[id]);
    }
    return { map, error: null };
  } catch (error) {
    return {
      map,
      error: error instanceof Error ? error.message : "Không đọc được trạng thái ghế realtime.",
    };
  }
}

// ------------------------- Chuẩn hóa suất chiếu -------------------------------

function flattenShowtimes(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw)) {
    return Object.values(raw).flatMap((v) => (Array.isArray(v) ? v : [v]));
  }
  return [];
}

function buildShowtimes(): ShowtimeDto[] {
  const titles = new Map<string, string>(listMovies().map((m) => [String(m.id), m.title]));
  const result: ShowtimeDto[] = [];

  for (const item of flattenShowtimes(MOCK_SHOWTIMES as unknown)) {
    if (!isRecord(item)) continue;
    const id = optionalString(item.id ?? item.showtimeId);
    if (!id) continue;

    const roomId =
      optionalString(
        item.roomId ?? item.room ?? item.screenId ?? item.screen ?? item.auditorium ?? item.hall
      ) ?? "room-1";
    const movieId = optionalString(item.movieId ?? item.movie) ?? null;
    const movieTitle = movieId ? titles.get(movieId) ?? null : null;
    const startTime =
      optionalString(
        item.startTime ?? item.startsAt ?? item.start ?? item.datetime ?? item.dateTime ?? item.time
      ) ?? "";
    const date = optionalString(item.date) ?? "";
    const when = [date, startTime].filter((p) => p !== "").join(" ");

    result.push({
      id,
      roomId,
      movieId,
      movieTitle,
      startTime,
      date,
      label: `${movieTitle ?? `Suất ${id}`}${when ? ` · ${when}` : ""}`,
    });
  }
  return result;
}

// ------------------------- Cascade mở khóa / reset hạng ----------------------

function unblockCascade(scope: SeatScope, ids: string[], actor: string) {
  const first = unblockSeats(scope, ids, actor);
  if (scope.showtimeId && scope.roomId && first.notBlocked.length > 0) {
    const second = unblockSeats({ roomId: scope.roomId }, first.notBlocked, actor);
    return {
      unblocked: [...first.unblocked, ...second.unblocked],
      notBlocked: second.notBlocked,
    };
  }
  return first;
}

function resetTierCascade(scope: SeatScope, ids: string[], actor: string) {
  const first = resetSeatTiers(scope, ids, actor);
  if (scope.showtimeId && scope.roomId && first.notCustomized.length > 0) {
    const second = resetSeatTiers({ roomId: scope.roomId }, first.notCustomized, actor);
    return {
      reset: [...first.reset, ...second.reset],
      notCustomized: second.notCustomized,
    };
  }
  return first;
}

// ------------------------- Đọc body -------------------------------------------

async function readBody(request: NextRequest, method: HttpMethod): Promise<Record<string, unknown>> {
  const text = await request.text();
  let body: Record<string, unknown> = {};

  if (text.trim() !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AdminStoreError("INVALID_INPUT", "Body request không phải JSON hợp lệ.");
    }
    if (!isRecord(parsed)) {
      throw new AdminStoreError("INVALID_INPUT", "Body request phải là một JSON object.");
    }
    body = parsed;
  }

  if (method === "DELETE") {
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (!(key in body)) body[key] = value;
    }
    if (typeof body.action !== "string" && body.id !== undefined) {
      body.action = String(body.permanent) === "true" ? "delete_movie" : "trash_movie";
    }
  }

  return body;
}

// ============================== GET ==========================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request)) {
    return fail(401, "UNAUTHORIZED", "Bạn không có quyền truy cập khu vực Admin.");
  }

  try {
    const params = request.nextUrl.searchParams;
    const resource = params.get("resource") ?? "seatmap";

    switch (resource) {
      case "seatmap": {
        const scope: SeatScope = {
          roomId: optionalString(params.get("roomId")),
          showtimeId: optionalString(params.get("showtimeId")),
        };
        if (!scope.roomId && !scope.showtimeId) {
          return fail(400, "INVALID_SCOPE", "Cần truyền showtimeId hoặc roomId.");
        }

        const seatIds = allSeatIds();
        const live = await readLiveStatuses(scope.showtimeId, seatIds);

        const seats = seatIds.map((seatId) => {
          const blocked = getBlockedSeat(seatId, scope);
          const liveSeat = live.map[seatId];
          return {
            seatId,
            row: seatId.charAt(0),
            number: Number(seatId.slice(1)),
            tier: getEffectiveSeatTier(seatId, scope),
            defaultTier: seatTier(seatId),
            tierOverridden: isSeatTierCustomized(seatId, scope),
            blocked: blocked !== undefined,
            blockReason: blocked?.reason ?? null,
            blockedAt: blocked?.blockedAt ?? null,
            blockedBy: blocked?.blockedBy ?? null,
            liveStatus: liveSeat?.status ?? "available",
            holdId: liveSeat?.holdId ?? null,
            expiresAt: liveSeat?.expiresAt ?? null,
          };
        });

        return ok({
          scope,
          seats,
          liveStatusError: live.error,
          tiers: SEAT_TIERS,
          reasonPresets: MAINTENANCE_REASON_PRESETS,
        });
      }

      case "showtimes": {
        return ok({ showtimes: buildShowtimes() });
      }

      case "blocked": {
        const scope: SeatScope = {
          roomId: optionalString(params.get("roomId")),
          showtimeId: optionalString(params.get("showtimeId")),
        };
        if (!scope.roomId && !scope.showtimeId) {
          return fail(400, "INVALID_SCOPE", "Cần truyền showtimeId hoặc roomId.");
        }
        return ok({ scope, blockedSeats: getBlockedSeats(scope) });
      }

      case "movies": {
        const statusParam = params.get("status");
        if (statusParam && !MOVIE_STATUSES.includes(statusParam as Movie["status"])) {
          return fail(
            400,
            "INVALID_INPUT",
            `status không hợp lệ. Chỉ nhận: ${MOVIE_STATUSES.join(", ")}.`
          );
        }
        const movies = listMovies({
          status: (statusParam as Movie["status"] | null) ?? undefined,
          q: params.get("q") ?? undefined,
        });
        return ok({ total: movies.length, movies });
      }

      case "trash": {
        const trash = listTrash();
        return ok({ total: trash.length, trash });
      }

      case "audit": {
        const actionParam = params.get("action");
        if (actionParam && !AUDIT_ACTIONS.includes(actionParam as AuditAction)) {
          return fail(400, "INVALID_INPUT", `action không hợp lệ: ${actionParam}`);
        }
        const targetTypeParam = params.get("targetType");
        if (targetTypeParam && !AUDIT_TARGETS.includes(targetTypeParam as AuditTargetType)) {
          return fail(400, "INVALID_INPUT", `targetType không hợp lệ: ${targetTypeParam}`);
        }
        const limitParam = params.get("limit");
        const limit = limitParam ? Number(limitParam) : undefined;
        if (limitParam && (limit === undefined || !Number.isFinite(limit))) {
          return fail(400, "INVALID_INPUT", "limit phải là số.");
        }

        const logs = getAuditLogs({
          limit,
          action: (actionParam as AuditAction | null) ?? undefined,
          targetType: (targetTypeParam as AuditTargetType | null) ?? undefined,
          targetId: params.get("targetId") ?? undefined,
          actor: params.get("actor") ?? undefined,
        });
        return ok({ total: logs.length, logs });
      }

      default:
        return fail(
          400,
          "INVALID_RESOURCE",
          'resource không hợp lệ. Chỉ nhận: "seatmap", "showtimes", "blocked", "movies", "trash", "audit".'
        );
    }
  } catch (error) {
    return handleError(error);
  }
}

// ============================== POST / PUT / DELETE ==========================

async function dispatch(request: NextRequest, method: HttpMethod): Promise<NextResponse> {
  if (!isAdminAuthorized(request)) {
    return fail(401, "UNAUTHORIZED", "Bạn không có quyền truy cập khu vực Admin.");
  }

  try {
    const body = await readBody(request, method);
    const action = typeof body.action === "string" ? body.action : "";

    if (!action) {
      return fail(400, "INVALID_INPUT", 'Thiếu trường "action".');
    }
    if (!ALLOWED_ACTIONS[method].has(action as AdminAction)) {
      return fail(
        405,
        "ACTION_NOT_ALLOWED",
        `Action "${action}" không được hỗ trợ với method ${method}.`,
        { Allow: "GET, POST, PUT, DELETE" }
      );
    }

    const actor = getActor(request);

    switch (action as AdminAction) {
      // ------------------------------ GHẾ ------------------------------------
      case "block_seat": {
        const scope = readScope(body);
        const ids = readSeatIds(body);
        const live = await readLiveStatuses(scope.showtimeId, ids);
        const sold = ids.filter((id) => live.map[id]?.status === "sold");
        if (sold.length > 0) {
          throw new AdminStoreError(
            "CONFLICT",
            `Không thể khóa bảo trì ghế đã bán: ${sold.join(", ")}.`
          );
        }
        const reason = typeof body.reason === "string" ? body.reason : "";
        return ok(blockSeats(scope, ids, reason, actor));
      }

      case "unblock_seat": {
        return ok(unblockCascade(readScope(body), readSeatIds(body), actor));
      }

      case "force_release": {
        const showtimeId = optionalString(body.showtimeId);
        const holdId = optionalString(body.holdId);
        if (!showtimeId || !holdId) {
          throw new AdminStoreError("INVALID_INPUT", "showtimeId và holdId là bắt buộc.");
        }
        return ok(await forceReleaseSeat(showtimeId, holdId, actor, optionalString(body.seatId)));
      }

      case "change_tier": {
        const tier = readTier(body.tier);
        return ok(setSeatTiers(readScope(body), readSeatIds(body), tier, actor));
      }

      case "reset_tier": {
        return ok(resetTierCascade(readScope(body), readSeatIds(body), actor));
      }

      // ------------------------------ PHIM -----------------------------------
      case "create_movie": {
        if (!isRecord(body.movie)) {
          throw new AdminStoreError("INVALID_INPUT", "Thiếu object movie.");
        }
        return ok(addMovie(body.movie as unknown as CreateMovieInput, actor), 201);
      }

      case "update_movie": {
        if (!isRecord(body.patch)) {
          throw new AdminStoreError("INVALID_INPUT", "Thiếu object patch.");
        }
        return ok(updateMovie(readMovieId(body), body.patch as UpdateMovieInput, actor));
      }

      case "trash_movie": {
        return ok(softDeleteMovie(readMovieId(body), actor));
      }

      case "restore_movie": {
        return ok(restoreMovie(readMovieId(body), actor));
      }

      case "delete_movie": {
        return ok(permanentlyDeleteMovie(readMovieId(body), actor));
      }

      case "empty_trash": {
        return ok(emptyTrash(actor));
      }

      default:
        return fail(400, "INVALID_ACTION", `action không được hỗ trợ: ${action}`);
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return dispatch(request, "POST");
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return dispatch(request, "PUT");
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return dispatch(request, "DELETE");
}
