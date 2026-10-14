import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { MOCK_SHOWTIMES } from "@/lib/mockData";
import { allSeatIds, seatTier } from "@/lib/seatLayout";
import * as store from "@/lib/adminSeatAndMovieStore";
import type { AuditAction, AuditTargetType, SeatScope, SeatTier } from "@/lib/adminSeatAndMovieStore";
import type { Movie } from "@/types";
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
type Method = "POST" | "PUT" | "DELETE";
type Rec = Record<string, unknown>;
type LiveStatus = "available" | "held" | "sold";
interface Live { status: LiveStatus; holdId: string | null; expiresAt: string | null }
 
const ALLOWED: Record<Method, string[]> = {
  POST: ["block_seat", "unblock_seat", "force_release", "change_tier", "reset_tier",
    "create_movie", "restore_movie", "trash_movie", "delete_movie", "empty_trash"],
  PUT: ["update_movie", "change_tier", "reset_tier", "restore_movie"],
  DELETE: ["trash_movie", "delete_movie", "empty_trash", "unblock_seat"],
};
 
// ------------------------------ Helpers --------------------------------------
 
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const ok = (data: unknown, status = 200) => json({ ok: true, data }, status);
const fail = (status: number, code: string, message: string) =>
  json({ ok: false, error: { code, message } }, status);
 
const STORE_STATUS: Record<string, number> = {
  INVALID_INPUT: 400, INVALID_SEAT: 400, INVALID_SCOPE: 400, NOT_FOUND: 404, CONFLICT: 409,
};
 
function handleError(error: unknown) {
  if (error instanceof store.AdminStoreError) {
    return fail(STORE_STATUS[error.code] ?? 500, error.code, error.message);
  }
  console.error("[admin/seats-and-movies]", error);
  return fail(500, "INTERNAL", "Đã xảy ra lỗi không mong muốn phía máy chủ.");
}
 
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
 
function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}
 
const badInput = (msg: string) => new store.AdminStoreError("INVALID_INPUT", msg);
 
const scopeOf = (src: { get?: (k: string) => string | null } | Rec): SeatScope => {
  const read = (k: string) => str("get" in src && typeof src.get === "function" ? src.get(k) : (src as Rec)[k]);
  return { roomId: read("roomId"), showtimeId: read("showtimeId") };
};
 
function seatIdsOf(body: Rec): string[] {
  if (!Array.isArray(body.seatIds) || body.seatIds.length === 0) throw badInput("seatIds phải là mảng không rỗng.");
  return body.seatIds.map((v) => String(v).trim().toUpperCase());
}
 
function movieIdOf(body: Rec): string | number {
  const id = body.id;
  if ((typeof id === "string" && id.trim()) || typeof id === "number") return id;
  throw badInput("id phim là bắt buộc.");
}
 
function tierOf(v: unknown): SeatTier {
  if (v === "sweetbox") return "couple";
  if (v === "standard" || v === "vip" || v === "couple") return v;
  throw badInput('Hạng ghế chỉ nhận: "standard", "vip", "couple" (hoặc "sweetbox").');
}
 
// ------------------------- Trạng thái ghế realtime ---------------------------
 
function toStatusMap(v: unknown): Rec {
  if (v instanceof Map) return Object.fromEntries(v.entries());
  if (Array.isArray(v)) {
    return Object.fromEntries(
      v.filter(isRec).map((i) => [String(str(i.seatId ?? i.id) ?? "").toUpperCase(), i])
    );
  }
  return isRec(v) ? v : {};
}
 
function toIso(v: unknown): string | null {
  const t = typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
 
function normalizeLive(raw: unknown): Live {
  const o = isRec(raw) ? raw : {};
  const text = String(typeof raw === "string" ? raw : o.status ?? o.state ?? o.type ?? "").toLowerCase();
  const holdId = str(o.holdId ?? o.hold_id ?? o.heldBy) ?? null;
  const status: LiveStatus = /sold|booked|paid|confirm|taken|purchas|occupied/.test(text)
    ? "sold"
    : /held|hold|lock|reserv|pending|select/.test(text) || (holdId && !text)
      ? "held"
      : "available";
  return { status, holdId, expiresAt: toIso(o.expiresAt ?? o.expiry ?? o.holdUntil ?? o.heldUntil) };
}
 
async function liveStatuses(showtimeId: string | undefined, ids: string[]) {
  const map: Record<string, Live> = {};
  if (!showtimeId) return { map, error: null as string | null };
  try {
    const raw = toStatusMap(await store.getLiveSeatStatuses(showtimeId, ids));
    for (const id of ids) map[id] = normalizeLive(raw[id]);
    return { map, error: null };
  } catch (e) {
    return { map, error: e instanceof Error ? e.message : "Không đọc được trạng thái ghế." };
  }
}
 
// ------------------------------ Suất chiếu -----------------------------------
 
function buildShowtimes() {
  const titles = new Map(store.listMovies().map((m) => [String(m.id), m.title]));
  const raw: unknown = MOCK_SHOWTIMES;
  const items: unknown[] = Array.isArray(raw)
    ? raw
    : isRec(raw) ? Object.values(raw).flatMap((v) => (Array.isArray(v) ? v : [v])) : [];
 
  return items.filter(isRec).flatMap((s) => {
    const id = str(s.id ?? s.showtimeId);
    if (!id) return [];
    const movieId = str(s.movieId ?? s.movie) ?? null;
    const movieTitle = movieId ? titles.get(movieId) ?? null : null;
    const startTime = str(s.startTime ?? s.startsAt ?? s.start ?? s.datetime ?? s.dateTime ?? s.time) ?? "";
    const date = str(s.date) ?? "";
    const when = [date, startTime].filter(Boolean).join(" ");
    return [{
      id,
      roomId: str(s.roomId ?? s.room ?? s.screenId ?? s.screen ?? s.auditorium ?? s.hall) ?? "room-1",
      movieId, movieTitle, startTime, date,
      label: `${movieTitle ?? `Suất ${id}`}${when ? ` · ${when}` : ""}`,
    }];
  });
}
 
/** Thử scope suất chiếu trước, phần còn lại thử tiếp scope phòng. */
function cascade<T extends { [k: string]: string[] }>(
  fn: (scope: SeatScope, ids: string[]) => T,
  leftKey: keyof T & string,
  scope: SeatScope,
  ids: string[]
): T {
  const first = fn(scope, ids);
  if (!scope.showtimeId || !scope.roomId || first[leftKey].length === 0) return first;
  const second = fn({ roomId: scope.roomId }, first[leftKey]);
  const merged: Record<string, string[]> = {};
  for (const k of Object.keys(first)) merged[k] = k === leftKey ? second[k] : [...first[k], ...second[k]];
  return merged as T;
}
 
// ------------------------------- GET -----------------------------------------
 
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail(401, "UNAUTHORIZED", "Bạn không có quyền truy cập khu vực Admin.");
 
  try {
    const p = request.nextUrl.searchParams;
    const resource = p.get("resource") ?? "seatmap";
 
    if (resource === "showtimes") return ok({ showtimes: buildShowtimes() });
    if (resource === "movies") {
      const movies = store.listMovies({ status: (p.get("status") as Movie["status"]) || undefined, q: p.get("q") ?? undefined });
      return ok({ total: movies.length, movies });
    }
    if (resource === "trash") {
      const trash = store.listTrash();
      return ok({ total: trash.length, trash });
    }
    if (resource === "audit") {
      const limit = p.get("limit") ? Number(p.get("limit")) : undefined;
      const logs = store.getAuditLogs({
        limit: Number.isFinite(limit) ? limit : undefined,
        action: (p.get("action") as AuditAction) || undefined,
        targetType: (p.get("targetType") as AuditTargetType) || undefined,
        targetId: p.get("targetId") ?? undefined,
        actor: p.get("actor") ?? undefined,
      });
      return ok({ total: logs.length, logs });
    }
 
    if (resource === "seatmap" || resource === "blocked") {
      const scope = scopeOf(p);
      if (!scope.roomId && !scope.showtimeId) return fail(400, "INVALID_SCOPE", "Cần truyền showtimeId hoặc roomId.");
      if (resource === "blocked") return ok({ scope, blockedSeats: store.getBlockedSeats(scope) });
 
      const ids = allSeatIds();
      const live = await liveStatuses(scope.showtimeId, ids);
      const seats = ids.map((seatId) => {
        const b = store.getBlockedSeat(seatId, scope);
        const l = live.map[seatId];
        return {
          seatId,
          row: seatId.charAt(0),
          number: Number(seatId.slice(1)),
          tier: store.getEffectiveSeatTier(seatId, scope),
          defaultTier: seatTier(seatId),
          tierOverridden: store.isSeatTierCustomized(seatId, scope),
          blocked: !!b,
          blockReason: b?.reason ?? null,
          blockedAt: b?.blockedAt ?? null,
          blockedBy: b?.blockedBy ?? null,
          liveStatus: l?.status ?? "available",
          holdId: l?.holdId ?? null,
          expiresAt: l?.expiresAt ?? null,
        };
      });
      return ok({ scope, seats, liveStatusError: live.error });
    }
 
    return fail(400, "INVALID_RESOURCE", "resource không hợp lệ.");
  } catch (e) {
    return handleError(e);
  }
}
 
// ------------------------- POST / PUT / DELETE -------------------------------
 
async function readBody(request: NextRequest, method: Method): Promise<Rec> {
  const text = await request.text();
  let body: Rec = {};
  if (text.trim()) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isRec(parsed)) throw new Error();
      body = parsed;
    } catch {
      throw badInput("Body phải là JSON object hợp lệ.");
    }
  }
  if (method === "DELETE") {
    request.nextUrl.searchParams.forEach((v, k) => { if (!(k in body)) body[k] = v; });
    if (typeof body.action !== "string" && body.id !== undefined) {
      body.action = String(body.permanent) === "true" ? "delete_movie" : "trash_movie";
    }
  }
  return body;
}
 
async function dispatch(request: NextRequest, method: Method) {
  if (!isAdminAuthorized(request)) return fail(401, "UNAUTHORIZED", "Bạn không có quyền truy cập khu vực Admin.");
 
  try {
    const body = await readBody(request, method);
    const action = typeof body.action === "string" ? body.action : "";
    if (!action) return fail(400, "INVALID_INPUT", 'Thiếu trường "action".');
    if (!ALLOWED[method].includes(action)) {
      return fail(405, "ACTION_NOT_ALLOWED", `Action "${action}" không hỗ trợ với method ${method}.`);
    }
 
    const actor = request.headers.get("x-admin-user")?.trim().slice(0, 80) || "admin";
 
    switch (action) {
      case "block_seat": {
        const scope = scopeOf(body);
        const ids = seatIdsOf(body);
        const live = await liveStatuses(scope.showtimeId, ids);
        const sold = ids.filter((id) => live.map[id]?.status === "sold");
        if (sold.length) throw new store.AdminStoreError("CONFLICT", `Không thể khóa ghế đã bán: ${sold.join(", ")}.`);
        return ok(store.blockSeats(scope, ids, typeof body.reason === "string" ? body.reason : "", actor));
      }
      case "unblock_seat":
        return ok(cascade((s, i) => store.unblockSeats(s, i, actor), "notBlocked", scopeOf(body), seatIdsOf(body)));
      case "force_release": {
        const showtimeId = str(body.showtimeId);
        const holdId = str(body.holdId);
        if (!showtimeId || !holdId) throw badInput("showtimeId và holdId là bắt buộc.");
        return ok(await store.forceReleaseSeat(showtimeId, holdId, actor, str(body.seatId)));
      }
      case "change_tier":
        return ok(store.setSeatTiers(scopeOf(body), seatIdsOf(body), tierOf(body.tier), actor));
      case "reset_tier":
        return ok(cascade((s, i) => store.resetSeatTiers(s, i, actor), "notCustomized", scopeOf(body), seatIdsOf(body)));
 
      case "create_movie":
        if (!isRec(body.movie)) throw badInput("Thiếu object movie.");
        return ok(store.addMovie(body.movie as unknown as store.CreateMovieInput, actor), 201);
      case "update_movie":
        if (!isRec(body.patch)) throw badInput("Thiếu object patch.");
        return ok(store.updateMovie(movieIdOf(body), body.patch as store.UpdateMovieInput, actor));
      case "trash_movie":
        return ok(store.softDeleteMovie(movieIdOf(body), actor));
      case "restore_movie":
        return ok(store.restoreMovie(movieIdOf(body), actor));
      case "delete_movie":
        return ok(store.permanentlyDeleteMovie(movieIdOf(body), actor));
      case "empty_trash":
        return ok(store.emptyTrash(actor));
      default:
        return fail(400, "INVALID_ACTION", `action không hợp lệ: ${action}`);
    }
  } catch (e) {
    return handleError(e);
  }
}
 
export const POST = (request: NextRequest) => dispatch(request, "POST");
export const PUT = (request: NextRequest) => dispatch(request, "PUT");
export const DELETE = (request: NextRequest) => dispatch(request, "DELETE");
