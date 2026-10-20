"use client";

// src/components/admin/AdminSeatsMoviesAuditTab.tsx
// -----------------------------------------------------------------------------
// Tab Admin gồm 3 sub-tab:
//   1. Quản lý sơ đồ ghế & bảo trì phòng chiếu
//   2. Quản lý phim & thùng rác
//   3. Nhật ký an ninh (Audit logs)
// Gọi API: /api/admin/seats-and-movies (GET / POST / PUT / DELETE).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Armchair,
  ChevronLeft,
  ChevronRight,
  Crown,
  Film,
  Heart,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  Timer,
  Trash2,
  Unlock,
  Wrench,
  X,
} from "lucide-react";
import type { Movie } from "@/types";
import type { AuditAction, AuditLogItem, TrashedMovie } from "@/lib/adminSeatAndMovieStore";

// ============================== CONSTANTS ====================================

const API_URL = "/api/admin/seats-and-movies";

const REASON_PRESETS: readonly string[] = [
  "Hỏng tay vịn",
  "Bảo trì đệm ghế",
  "Ghế khách mời VIP",
  "Hỏng cơ cấu ngả lưng",
  "Vệ sinh / xử lý sự cố",
];
const CUSTOM_REASON = "__custom__";

const MOVIE_PAGE_SIZE = 8;
const AUDIT_PAGE_SIZE = 15;

type SeatTier = "standard" | "vip" | "couple";
type LiveStatus = "available" | "held" | "sold";
type DisplayStatus = LiveStatus | "blocked";
type MovieStatus = Movie["status"];
type SubTab = "seats" | "movies" | "audit";

const TIER_LABEL: Record<SeatTier, string> = {
  standard: "Standard",
  vip: "VIP",
  couple: "Sweetbox",
};

const MOVIE_STATUS_LABEL: Record<MovieStatus, string> = {
  now_playing: "Đang chiếu",
  upcoming: "Sắp chiếu",
  trending: "Thịnh hành",
};

const ACTION_LABEL: Record<AuditAction, string> = {
  SEAT_BLOCKED: "Khóa ghế",
  SEAT_UNBLOCKED: "Mở khóa ghế",
  SEAT_TIER_CHANGED: "Đổi hạng ghế",
  SEAT_TIER_RESET: "Khôi phục hạng ghế",
  SEAT_FORCE_RELEASED: "Giải phóng ghế",
  MOVIE_CREATED: "Thêm phim",
  MOVIE_UPDATED: "Sửa phim",
  MOVIE_TRASHED: "Vào thùng rác",
  MOVIE_RESTORED: "Khôi phục phim",
  MOVIE_PERMANENTLY_DELETED: "Xóa vĩnh viễn",
  TRASH_EMPTIED: "Dọn thùng rác",
};

const AUDIT_ACTION_OPTIONS = Object.keys(ACTION_LABEL) as AuditAction[];

// Style dùng chung
const CARD = "rounded-xl border border-white/10 bg-[#14151B]";
const INPUT =
  "w-full rounded-lg border border-white/10 bg-[#0B0C10] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-rose-500 focus:outline-none disabled:opacity-50";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

// ============================== API TYPES ====================================

interface SeatDto {
  seatId: string;
  row: string;
  number: number;
  tier: SeatTier;
  defaultTier: SeatTier;
  tierOverridden: boolean;
  blocked: boolean;
  blockReason: string | null;
  blockedAt: string | null;
  blockedBy: string | null;
  liveStatus: LiveStatus;
  holdId: string | null;
  expiresAt: string | null;
}

interface SeatMapData {
  seats: SeatDto[];
  liveStatusError: string | null;
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

interface ApiSuccess<T> {
  ok: true;
  data: T;
}
interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function callApi<T>(
  method: HttpMethod,
  headers: Record<string, string>,
  options: { query?: Record<string, string | undefined>; body?: unknown } = {}
): Promise<T> {
  const url = new URL(API_URL, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    credentials: "same-origin",
  });

  let json: ApiSuccess<T> | ApiFailure | null = null;
  try {
    json = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    json = null;
  }

  if (!json) throw new Error(`Máy chủ trả về dữ liệu không hợp lệ (HTTP ${response.status}).`);
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { hour12: false });
}

// ============================== SHARED UI ====================================

interface PanelContext {
  headers: Record<string, string>;
  notify: (type: "success" | "error", message: string) => void;
}

interface ToastState {
  id: number;
  type: "success" | "error";
  message: string;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
}

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-white/60">
      <span>Tổng: {total}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={BTN_GHOST}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          className={BTN_GHOST}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</span>
      {children}
    </label>
  );
}

// ============================== TAB 1: SƠ ĐỒ GHẾ =============================

function seatDisplayStatus(seat: SeatDto): DisplayStatus {
  return seat.blocked ? "blocked" : seat.liveStatus;
}

function seatClassName(seat: SeatDto, selected: boolean): string {
  const status = seatDisplayStatus(seat);
  const base =
    "relative flex h-9 items-center justify-center rounded-md border text-[11px] font-semibold transition focus:outline-none";
  const width = seat.row === "K" || seat.tier === "couple" ? "w-[4.5rem]" : "w-9";

  let color: string;
  switch (status) {
    case "blocked":
      color = "border-violet-400/60 bg-violet-950 text-violet-200";
      break;
    case "sold":
      color = "border-rose-500/60 bg-rose-600 text-white";
      break;
    case "held":
      color = "border-amber-300/70 bg-amber-400 text-black";
      break;
    default:
      color = "border-white/10 bg-white/10 text-white/70 hover:bg-white/20";
  }

  // Viền nhấn nhẹ theo hạng ghế khi ghế còn trống
  let tierAccent = "";
  if (status === "available") {
    if (seat.tier === "vip") tierAccent = "!border-amber-400/70";
    if (seat.tier === "couple") tierAccent = "!border-pink-400/70";
  }

  const ring = selected ? "ring-2 ring-white ring-offset-2 ring-offset-[#14151B]" : "";
  return `${base} ${width} ${color} ${tierAccent} ${ring}`;
}

function SeatsPanel({ ctx }: { ctx: PanelContext }) {
  const { headers, notify } = ctx;

  const [showtimes, setShowtimes] = useState<ShowtimeDto[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [showtimeId, setShowtimeId] = useState("");
  const [draftRoom, setDraftRoom] = useState("");
  const [draftShowtime, setDraftShowtime] = useState("");

  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [liveStatusError, setLiveStatusError] = useState<string | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<number>(() => Date.now());

  const [applyToRoom, setApplyToRoom] = useState(false);
  const [reasonPreset, setReasonPreset] = useState<string>(REASON_PRESETS[0]);
  const [reasonCustom, setReasonCustom] = useState("");
  const [tierTarget, setTierTarget] = useState<SeatTier>("vip");
  const [manualHoldId, setManualHoldId] = useState("");
  const [busy, setBusy] = useState(false);

  // ---- Tải danh sách suất chiếu ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await callApi<{ showtimes: ShowtimeDto[] }>("GET", headers, {
          query: { resource: "showtimes" },
        });
        if (cancelled) return;
        setShowtimes(data.showtimes);
        if (data.showtimes.length > 0) {
          setRoomId(data.showtimes[0].roomId);
          setShowtimeId(data.showtimes[0].id);
        }
      } catch (error) {
        if (!cancelled) notify("error", errorMessage(error));
      } finally {
        if (!cancelled) setLoadingShowtimes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [headers, notify]);

  const rooms = useMemo(() => Array.from(new Set(showtimes.map((s) => s.roomId))), [showtimes]);
  const roomShowtimes = useMemo(
    () => showtimes.filter((s) => s.roomId === roomId),
    [showtimes, roomId]
  );

  // ---- Tải sơ đồ ghế ----
  const loadSeats = useCallback(
    async (silent = false) => {
      if (!showtimeId && !roomId) return;
      if (!silent) setLoadingSeats(true);
      try {
        const data = await callApi<SeatMapData>("GET", headers, {
          query: { resource: "seatmap", showtimeId, roomId },
        });
        setSeats(data.seats);
        setLiveStatusError(data.liveStatusError);
      } catch (error) {
        if (!silent) notify("error", errorMessage(error));
      } finally {
        if (!silent) setLoadingSeats(false);
      }
    },
    [headers, notify, roomId, showtimeId]
  );

  useEffect(() => {
    setSelected(new Set());
    void loadSeats();
    const timer = setInterval(() => void loadSeats(true), 15000);
    return () => clearInterval(timer);
  }, [loadSeats]);

  // Đồng hồ đếm ngược cho ghế đang giữ
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ---- Dữ liệu dẫn xuất ----
  const rows = useMemo(() => {
    const map = new Map<string, SeatDto[]>();
    for (const seat of seats) {
      const list = map.get(seat.row) ?? [];
      list.push(seat);
      map.set(seat.row, list);
    }
    return Array.from(map.entries()).map(([row, list]) => ({
      row,
      seats: [...list].sort((a, b) => a.number - b.number),
    }));
  }, [seats]);

  const stats = useMemo(() => {
    const result = { total: seats.length, available: 0, sold: 0, held: 0, blocked: 0 };
    for (const seat of seats) {
      result[seatDisplayStatus(seat)] += 1;
    }
    return result;
  }, [seats]);

  const selectedSeats = useMemo(() => seats.filter((s) => selected.has(s.seatId)), [seats, selected]);
  const blockable = selectedSeats.filter((s) => !s.blocked && s.liveStatus !== "sold");
  const unblockable = selectedSeats.filter((s) => s.blocked);
  const releasable = selectedSeats.filter((s) => !s.blocked && s.liveStatus === "held");

  const remainingSeconds = (seat: SeatDto): number | null => {
    if (!seat.expiresAt) return null;
    const diff = Math.ceil((Date.parse(seat.expiresAt) - now) / 1000);
    return Number.isNaN(diff) ? null : Math.max(0, diff);
  };

  // ---- Chọn ghế ----
  const toggleSeat = (seatId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  };

  const toggleRow = (rowSeats: SeatDto[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rowSeats.every((s) => next.has(s.seatId));
      for (const seat of rowSeats) {
        if (allSelected) next.delete(seat.seatId);
        else next.add(seat.seatId);
      }
      return next;
    });
  };

  // ---- Thao tác Admin ----
  const writeScope = (): Record<string, string> | null => {
    if (applyToRoom) {
      if (!roomId) {
        notify("error", "Chưa chọn phòng chiếu.");
        return null;
      }
      return { roomId };
    }
    if (!showtimeId) {
      notify("error", "Chưa chọn suất chiếu.");
      return null;
    }
    return roomId ? { showtimeId, roomId } : { showtimeId };
  };

  const runAction = async (task: () => Promise<string>) => {
    setBusy(true);
    try {
      const message = await task();
      notify("success", message);
      setSelected(new Set());
      await loadSeats(true);
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = () => {
    const scope = writeScope();
    if (!scope) return;
    const reason = (reasonPreset === CUSTOM_REASON ? reasonCustom : reasonPreset).trim();
    if (!reason) {
      notify("error", "Vui lòng nhập lý do bảo trì.");
      return;
    }
    if (blockable.length === 0) {
      notify("error", "Không có ghế hợp lệ để khóa (ghế đã bán hoặc đã khóa).");
      return;
    }
    void runAction(async () => {
      const result = await callApi<{ blocked: unknown[]; alreadyBlocked: string[] }>("POST", headers, {
        body: {
          action: "block_seat",
          ...scope,
          seatIds: blockable.map((s) => s.seatId),
          reason,
        },
      });
      return `Đã khóa bảo trì ${result.blocked.length} ghế.`;
    });
  };

  const handleUnblock = () => {
    const scope = writeScope();
    if (!scope) return;
    if (unblockable.length === 0) {
      notify("error", "Không có ghế nào đang bị khóa trong lựa chọn.");
      return;
    }
    void runAction(async () => {
      const result = await callApi<{ unblocked: string[]; notBlocked: string[] }>("POST", headers, {
        body: {
          action: "unblock_seat",
          ...scope,
          seatIds: unblockable.map((s) => s.seatId),
        },
      });
      return `Đã mở khóa ${result.unblocked.length} ghế.`;
    });
  };

  const handleForceRelease = () => {
    if (!showtimeId) {
      notify("error", "Cần chọn suất chiếu cụ thể để giải phóng ghế.");
      return;
    }
    if (releasable.length === 0) {
      notify("error", "Không có ghế đang giữ trong lựa chọn.");
      return;
    }

    // Gom ghế theo holdId; ghế thiếu holdId dùng holdId nhập tay (nếu có)
    const manual = manualHoldId.trim();
    const groups = new Map<string, string>(); // holdId -> seatId đại diện
    const missing: string[] = [];
    for (const seat of releasable) {
      const hold = seat.holdId ?? (manual || null);
      if (!hold) missing.push(seat.seatId);
      else if (!groups.has(hold)) groups.set(hold, seat.seatId);
    }
    if (missing.length > 0) {
      notify("error", `Không biết holdId của ghế ${missing.join(", ")}. Hãy nhập holdId thủ công.`);
      return;
    }

    void runAction(async () => {
      await Promise.all(
        Array.from(groups.entries()).map(([holdId, seatId]) =>
          callApi("POST", headers, {
            body: { action: "force_release", showtimeId, holdId, seatId },
          })
        )
      );
      return `Đã giải phóng ${groups.size} lượt giữ ghế.`;
    });
  };

  const handleChangeTier = () => {
    const scope = writeScope();
    if (!scope) return;
    if (selectedSeats.length === 0) return;
    void runAction(async () => {
      const result = await callApi<{ changed: unknown[]; unchanged: string[] }>("PUT", headers, {
        body: {
          action: "change_tier",
          ...scope,
          seatIds: selectedSeats.map((s) => s.seatId),
          tier: tierTarget,
        },
      });
      return `Đã đổi hạng ${result.changed.length} ghế sang ${TIER_LABEL[tierTarget]}.`;
    });
  };

  const handleResetTier = () => {
    const scope = writeScope();
    if (!scope) return;
    const customized = selectedSeats.filter((s) => s.tierOverridden);
    if (customized.length === 0) {
      notify("error", "Các ghế đã chọn đang dùng hạng mặc định.");
      return;
    }
    void runAction(async () => {
      const result = await callApi<{ reset: string[]; notCustomized: string[] }>("PUT", headers, {
        body: {
          action: "reset_tier",
          ...scope,
          seatIds: customized.map((s) => s.seatId),
        },
      });
      return `Đã khôi phục hạng mặc định cho ${result.reset.length} ghế.`;
    });
  };

  // ---- Render ----
  const hasScope = Boolean(showtimeId || roomId);

  return (
    <div className="space-y-5">
      {/* Bộ chọn phòng / suất chiếu */}
      <div className={`${CARD} p-4`}>
        {loadingShowtimes ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Spinner /> Đang tải danh sách suất chiếu...
          </div>
        ) : showtimes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <Field label="Phòng chiếu">
              <select
                className={INPUT}
                value={roomId}
                onChange={(e) => {
                  const nextRoom = e.target.value;
                  setRoomId(nextRoom);
                  const first = showtimes.find((s) => s.roomId === nextRoom);
                  setShowtimeId(first ? first.id : "");
                }}
              >
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Suất chiếu">
              <select
                className={INPUT}
                value={showtimeId}
                onChange={(e) => setShowtimeId(e.target.value)}
              >
                {roomShowtimes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className={BTN_GHOST}
                onClick={() => void loadSeats()}
                disabled={loadingSeats}
              >
                <RefreshCw className={`h-4 w-4 ${loadingSeats ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Mã phòng chiếu (roomId)">
              <input
                className={INPUT}
                value={draftRoom}
                onChange={(e) => setDraftRoom(e.target.value)}
                placeholder="VD: room-1"
              />
            </Field>
            <Field label="Mã suất chiếu (showtimeId)">
              <input
                className={INPUT}
                value={draftShowtime}
                onChange={(e) => setDraftShowtime(e.target.value)}
                placeholder="VD: st-001"
              />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => {
                  setRoomId(draftRoom.trim());
                  setShowtimeId(draftShowtime.trim());
                }}
              >
                Tải sơ đồ
              </button>
            </div>
            <p className="text-xs text-white/40 md:col-span-3">
              Không đọc được danh sách suất chiếu từ MOCK_SHOWTIMES, hãy nhập mã thủ công.
            </p>
          </div>
        )}
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Tổng số ghế", value: stats.total, tone: "text-white" },
          { label: "Ghế trống", value: stats.available, tone: "text-emerald-300" },
          { label: "Ghế đã bán", value: stats.sold, tone: "text-rose-400" },
          { label: "Ghế đang giữ", value: stats.held, tone: "text-amber-300" },
          { label: "Ghế bảo trì", value: stats.blocked, tone: "text-violet-300" },
        ].map((item) => (
          <div key={item.label} className={`${CARD} px-4 py-3`}>
            <div className="text-xs text-white/50">{item.label}</div>
            <div className={`mt-1 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {liveStatusError && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          Không đọc được trạng thái ghế realtime: {liveStatusError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* Ma trận ghế */}
        <div className={`${CARD} p-5`}>
          {/* Chú thích */}
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
            <Legend swatch="border-white/10 bg-white/10" label="Trống" />
            <Legend swatch="border-amber-300/70 bg-amber-400" label="Đang giữ (300s)" />
            <Legend swatch="border-rose-500/60 bg-rose-600" label="Đã bán" />
            <Legend swatch="border-violet-400/60 bg-violet-950" label="Khóa bảo trì" icon />
            <Legend swatch="border-amber-400/70 bg-transparent" label="Viền vàng: VIP" />
            <Legend swatch="border-pink-400/70 bg-transparent" label="Viền hồng: Sweetbox" />
          </div>

          {!hasScope ? (
            <p className="py-10 text-center text-sm text-white/50">
              Hãy chọn phòng và suất chiếu để xem sơ đồ ghế.
            </p>
          ) : loadingSeats && seats.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/60">
              <Spinner /> Đang tải sơ đồ ghế...
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="mx-auto w-fit min-w-[28rem]">
                <div className="mb-6 text-center">
                  <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                  <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.3em] text-white/40">
                    Màn hình
                  </span>
                </div>

                <div className="space-y-2">
                  {rows.map(({ row, seats: rowSeats }) => (
                    <div key={row} className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRow(rowSeats)}
                        className="w-6 text-center text-xs font-semibold text-white/50 hover:text-white"
                        title={`Chọn / bỏ chọn cả hàng ${row}`}
                      >
                        {row}
                      </button>
                      <div className="flex items-center gap-1.5">
                        {rowSeats.map((seat) => {
                          const status = seatDisplayStatus(seat);
                          const remaining = remainingSeconds(seat);
                          const gap = rowSeats.length > 6 && seat.number === 6 ? "mr-4" : "";
                          const title = [
                            `Ghế ${seat.seatId} - ${TIER_LABEL[seat.tier]}`,
                            status === "blocked" ? `Bảo trì: ${seat.blockReason ?? ""}` : "",
                            status === "held" && seat.holdId ? `Hold: ${seat.holdId}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          return (
                            <button
                              key={seat.seatId}
                              type="button"
                              title={title}
                              aria-pressed={selected.has(seat.seatId)}
                              aria-label={title}
                              onClick={() => toggleSeat(seat.seatId)}
                              className={`${seatClassName(seat, selected.has(seat.seatId))} ${gap}`}
                            >
                              {status === "blocked" ? (
                                <Wrench className="h-4 w-4" />
                              ) : status === "held" ? (
                                <span>{remaining !== null ? `${remaining}s` : seat.number}</span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  {seat.tier === "couple" && <Heart className="h-3 w-3" />}
                                  {seat.tier === "vip" && <Crown className="h-3 w-3" />}
                                  {seat.number}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bảng điều khiển */}
        <div className={`${CARD} h-fit space-y-4 p-5`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Armchair className="h-4 w-4 text-rose-400" />
              Bảng điều khiển ghế
            </h3>
            {selected.size > 0 && (
              <button
                type="button"
                className="text-xs text-white/50 hover:text-white"
                onClick={() => setSelected(new Set())}
              >
                Bỏ chọn
              </button>
            )}
          </div>

          {selectedSeats.length === 0 ? (
            <p className="text-sm text-white/50">
              Click vào một hoặc nhiều ghế (hoặc nhãn hàng) để thao tác.
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-white/10 bg-[#0B0C10] p-3 text-sm">
                <div className="mb-1 text-white/50">Đã chọn {selectedSeats.length} ghế</div>
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatId}
                      className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80"
                    >
                      {s.seatId}
                    </span>
                  ))}
                </div>
                {selectedSeats.some((s) => s.blocked && s.blockReason) && (
                  <ul className="mt-2 space-y-0.5 text-xs text-violet-300">
                    {selectedSeats
                      .filter((s) => s.blocked)
                      .map((s) => (
                        <li key={s.seatId}>
                          {s.seatId}: {s.blockReason}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={applyToRoom}
                  onChange={(e) => setApplyToRoom(e.target.checked)}
                  className="h-4 w-4 accent-rose-600"
                />
                Áp dụng cho cả phòng (mọi suất chiếu)
              </label>

              {/* Khóa / mở khóa */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <Field label="Lý do bảo trì">
                  <select
                    className={INPUT}
                    value={reasonPreset}
                    onChange={(e) => setReasonPreset(e.target.value)}
                  >
                    {REASON_PRESETS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value={CUSTOM_REASON}>Lý do khác...</option>
                  </select>
                </Field>
                {reasonPreset === CUSTOM_REASON && (
                  <input
                    className={INPUT}
                    value={reasonCustom}
                    onChange={(e) => setReasonCustom(e.target.value)}
                    maxLength={200}
                    placeholder="Nhập lý do bảo trì..."
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    disabled={busy || blockable.length === 0}
                    onClick={handleBlock}
                  >
                    <Lock className="h-4 w-4" />
                    Khóa ({blockable.length})
                  </button>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={busy || unblockable.length === 0}
                    onClick={handleUnblock}
                  >
                    <Unlock className="h-4 w-4" />
                    Mở khóa ({unblockable.length})
                  </button>
                </div>
              </div>

              {/* Force release */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <Field label="Giải phóng ghế đang giữ">
                  <input
                    className={INPUT}
                    value={manualHoldId}
                    onChange={(e) => setManualHoldId(e.target.value)}
                    placeholder="holdId thủ công (nếu hệ thống không trả về)"
                  />
                </Field>
                <button
                  type="button"
                  className={`${BTN_GHOST} w-full`}
                  disabled={busy || releasable.length === 0}
                  onClick={handleForceRelease}
                >
                  <Timer className="h-4 w-4" />
                  Force Release ({releasable.length})
                </button>
              </div>

              {/* Đổi hạng ghế */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <Field label="Đổi hạng ghế">
                  <select
                    className={INPUT}
                    value={tierTarget}
                    onChange={(e) => setTierTarget(e.target.value as SeatTier)}
                  >
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                    <option value="couple">Sweetbox (ghế đôi)</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={handleChangeTier}>
                    <Crown className="h-4 w-4" />
                    Áp dụng
                  </button>
                  <button type="button" className={BTN_GHOST} disabled={busy} onClick={handleResetTier}>
                    <RotateCcw className="h-4 w-4" />
                    Mặc định
                  </button>
                </div>
              </div>

              {busy && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Spinner /> Đang xử lý...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label, icon = false }: { swatch: string; label: string; icon?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`flex h-4 w-4 items-center justify-center rounded border ${swatch}`}>
        {icon && <Wrench className="h-2.5 w-2.5 text-violet-200" />}
      </span>
      {label}
    </span>
  );
}

// ============================== TAB 2: PHIM ==================================

interface MovieFormState {
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: string;
  voteCount: string;
  durationMinutes: string;
  director: string;
  genres: string;
  cast: string;
  trailerYoutubeId: string;
  ageRating: string;
  status: MovieStatus;
}

function movieToForm(movie?: Movie): MovieFormState {
  return {
    title: movie?.title ?? "",
    originalTitle: movie?.originalTitle ?? "",
    overview: movie?.overview ?? "",
    posterPath: movie?.posterPath ?? "",
    backdropPath: movie?.backdropPath ?? "",
    releaseDate: movie?.releaseDate ?? "",
    voteAverage: String(movie?.voteAverage ?? 0),
    voteCount: String(movie?.voteCount ?? 0),
    durationMinutes: String(movie?.durationMinutes ?? 0),
    director: movie?.director ?? "",
    genres: movie?.genres.join(", ") ?? "",
    cast: movie?.cast.join(", ") ?? "",
    trailerYoutubeId: movie?.trailerYoutubeId ?? "",
    ageRating: movie?.ageRating ?? "",
    status: movie?.status ?? "upcoming",
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function MovieFormModal({
  movie,
  saving,
  onClose,
  onSubmit,
}: {
  movie?: Movie;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Movie, "id">) => void;
}) {
  const [form, setForm] = useState<MovieFormState>(() => movieToForm(movie));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MovieFormState>(key: K, value: MovieFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Tên phim là bắt buộc.");
      return;
    }
    const voteAverage = Number(form.voteAverage || 0);
    const voteCount = Number(form.voteCount || 0);
    const durationMinutes = Number(form.durationMinutes || 0);
    if (!Number.isFinite(voteAverage) || voteAverage < 0 || voteAverage > 10) {
      setError("Điểm đánh giá phải nằm trong khoảng 0 - 10.");
      return;
    }
    if (!Number.isFinite(voteCount) || voteCount < 0) {
      setError("Số lượt đánh giá không hợp lệ.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
      setError("Thời lượng không hợp lệ.");
      return;
    }
    setError(null);
    onSubmit({
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim(),
      overview: form.overview.trim(),
      posterPath: form.posterPath.trim(),
      backdropPath: form.backdropPath.trim(),
      releaseDate: form.releaseDate,
      voteAverage,
      voteCount,
      genres: splitList(form.genres),
      durationMinutes,
      director: form.director.trim(),
      cast: splitList(form.cast),
      trailerYoutubeId: form.trailerYoutubeId.trim(),
      ageRating: form.ageRating.trim(),
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-[#14151B] p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {movie ? `Sửa phim: ${movie.title}` : "Thêm phim mới"}
          </h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên phim *">
            <input className={INPUT} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Tên gốc">
            <input
              className={INPUT}
              value={form.originalTitle}
              onChange={(e) => set("originalTitle", e.target.value)}
            />
          </Field>
          <Field label="Đạo diễn">
            <input className={INPUT} value={form.director} onChange={(e) => set("director", e.target.value)} />
          </Field>
          <Field label="Trạng thái">
            <select
              className={INPUT}
              value={form.status}
              onChange={(e) => set("status", e.target.value as MovieStatus)}
            >
              {(Object.keys(MOVIE_STATUS_LABEL) as MovieStatus[]).map((s) => (
                <option key={s} value={s}>
                  {MOVIE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày khởi chiếu">
            <input
              type="date"
              className={INPUT}
              value={form.releaseDate}
              onChange={(e) => set("releaseDate", e.target.value)}
            />
          </Field>
          <Field label="Thời lượng (phút)">
            <input
              type="number"
              min={0}
              className={INPUT}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
            />
          </Field>
          <Field label="Điểm đánh giá (0-10)">
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              className={INPUT}
              value={form.voteAverage}
              onChange={(e) => set("voteAverage", e.target.value)}
            />
          </Field>
          <Field label="Số lượt đánh giá">
            <input
              type="number"
              min={0}
              className={INPUT}
              value={form.voteCount}
              onChange={(e) => set("voteCount", e.target.value)}
            />
          </Field>
          <Field label="Phân loại độ tuổi">
            <input
              className={INPUT}
              value={form.ageRating}
              onChange={(e) => set("ageRating", e.target.value)}
              placeholder="VD: T13, T16, C18"
            />
          </Field>
          <Field label="YouTube trailer ID">
            <input
              className={INPUT}
              value={form.trailerYoutubeId}
              onChange={(e) => set("trailerYoutubeId", e.target.value)}
            />
          </Field>
          <Field label="Poster (URL / path)">
            <input
              className={INPUT}
              value={form.posterPath}
              onChange={(e) => set("posterPath", e.target.value)}
            />
          </Field>
          <Field label="Backdrop (URL / path)">
            <input
              className={INPUT}
              value={form.backdropPath}
              onChange={(e) => set("backdropPath", e.target.value)}
            />
          </Field>
          <Field label="Thể loại (cách nhau bằng dấu phẩy)">
            <input className={INPUT} value={form.genres} onChange={(e) => set("genres", e.target.value)} />
          </Field>
          <Field label="Diễn viên (cách nhau bằng dấu phẩy)">
            <input className={INPUT} value={form.cast} onChange={(e) => set("cast", e.target.value)} />
          </Field>
        </div>

        <Field label="Nội dung phim">
          <textarea
            rows={4}
            className={INPUT}
            value={form.overview}
            onChange={(e) => set("overview", e.target.value)}
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving && <Spinner />}
            {movie ? "Lưu thay đổi" : "Thêm phim"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PosterThumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="flex h-14 w-10 items-center justify-center rounded bg-white/5 text-white/30">
        <Film className="h-4 w-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="h-14 w-10 rounded object-cover"
    />
  );
}

function MoviesPanel({ ctx }: { ctx: PanelContext }) {
  const { headers, notify } = ctx;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [trash, setTrash] = useState<TrashedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "trash">("active");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MovieStatus>("all");
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<{ mode: "create" | "edit"; movie?: Movie } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movieData, trashData] = await Promise.all([
        callApi<{ movies: Movie[] }>("GET", headers, { query: { resource: "movies" } }),
        callApi<{ trash: TrashedMovie[] }>("GET", headers, { query: { resource: "trash" } }),
      ]);
      setMovies(movieData.movies);
      setTrash(trashData.trash);
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [headers, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, view]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredMovies = useMemo(
    () =>
      movies.filter((m) => {
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        if (!normalizedQuery) return true;
        return `${m.title} ${m.originalTitle ?? ""} ${m.director}`.toLowerCase().includes(normalizedQuery);
      }),
    [movies, statusFilter, normalizedQuery]
  );

  const filteredTrash = useMemo(
    () =>
      trash.filter((t) => {
        if (!normalizedQuery) return true;
        return `${t.movie.title} ${t.movie.originalTitle ?? ""}`.toLowerCase().includes(normalizedQuery);
      }),
    [trash, normalizedQuery]
  );

  const total = view === "active" ? filteredMovies.length : filteredTrash.length;
  const totalPages = Math.max(1, Math.ceil(total / MOVIE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * MOVIE_PAGE_SIZE;
  const pagedMovies = filteredMovies.slice(start, start + MOVIE_PAGE_SIZE);
  const pagedTrash = filteredTrash.slice(start, start + MOVIE_PAGE_SIZE);

  // ---- Thao tác ----
  const submitForm = async (payload: Omit<Movie, "id">) => {
    if (!formState) return;
    setSaving(true);
    try {
      if (formState.mode === "create") {
        await callApi("POST", headers, { body: { action: "create_movie", movie: payload } });
        notify("success", `Đã thêm phim "${payload.title}".`);
      } else if (formState.movie) {
        await callApi("PUT", headers, {
          body: { action: "update_movie", id: formState.movie.id, patch: payload },
        });
        notify("success", `Đã cập nhật phim "${payload.title}".`);
      }
      setFormState(null);
      await load();
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const runMovieAction = async (id: string | number, task: () => Promise<string>) => {
    setBusyId(String(id));
    try {
      notify("success", await task());
      await load();
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const trashMovie = (movie: Movie) => {
    if (!window.confirm(`Chuyển phim "${movie.title}" vào thùng rác?`)) return;
    void runMovieAction(movie.id, async () => {
      await callApi("DELETE", headers, { query: { action: "trash_movie", id: String(movie.id) } });
      return `Đã chuyển "${movie.title}" vào thùng rác.`;
    });
  };

  const restore = (movie: Movie) =>
    void runMovieAction(movie.id, async () => {
      await callApi("PUT", headers, { body: { action: "restore_movie", id: movie.id } });
      return `Đã khôi phục "${movie.title}".`;
    });

  const deletePermanently = (movie: Movie) => {
    if (!window.confirm(`XÓA VĨNH VIỄN "${movie.title}"? Hành động này không thể hoàn tác.`)) return;
    void runMovieAction(movie.id, async () => {
      await callApi("DELETE", headers, {
        query: { action: "delete_movie", id: String(movie.id), permanent: "true" },
      });
      return `Đã xóa vĩnh viễn "${movie.title}".`;
    });
  };

  const emptyTrash = () => {
    if (trash.length === 0) return;
    if (!window.confirm(`Dọn sạch thùng rác (${trash.length} phim)? Không thể hoàn tác.`)) return;
    void runMovieAction("trash", async () => {
      const result = await callApi<{ removed: number }>("DELETE", headers, {
        query: { action: "empty_trash" },
      });
      return `Đã dọn thùng rác (${result.removed} phim).`;
    });
  };

  return (
    <div className="space-y-4">
      <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
        <div className="inline-flex rounded-lg border border-white/10 bg-[#0B0C10] p-1">
          <button
            type="button"
            onClick={() => setView("active")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "active" ? "bg-rose-600 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Danh sách phim ({movies.length})
          </button>
          <button
            type="button"
            onClick={() => setView("trash")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "trash" ? "bg-rose-600 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Thùng rác ({trash.length})
          </button>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${INPUT} pl-9`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên phim, đạo diễn..."
          />
        </div>

        {view === "active" && (
          <select
            className={`${INPUT} w-auto`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | MovieStatus)}
          >
            <option value="all">Tất cả trạng thái</option>
            {(Object.keys(MOVIE_STATUS_LABEL) as MovieStatus[]).map((s) => (
              <option key={s} value={s}>
                {MOVIE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}

        <button type="button" className={BTN_GHOST} onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {view === "active" ? (
          <button type="button" className={BTN_PRIMARY} onClick={() => setFormState({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            Thêm phim
          </button>
        ) : (
          <button
            type="button"
            className={BTN_GHOST}
            onClick={emptyTrash}
            disabled={trash.length === 0 || busyId === "trash"}
          >
            <Trash2 className="h-4 w-4" />
            Dọn thùng rác
          </button>
        )}
      </div>

      <div className={`${CARD} overflow-x-auto`}>
        {loading && movies.length === 0 && trash.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/60">
            <Spinner /> Đang tải danh sách phim...
          </div>
        ) : total === 0 ? (
          <p className="py-12 text-center text-sm text-white/50">
            {view === "active" ? "Không có phim nào phù hợp." : "Thùng rác đang trống."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Phim</th>
                <th className="px-4 py-3">Thể loại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời lượng</th>
                <th className="px-4 py-3">Điểm</th>
                {view === "trash" && <th className="px-4 py-3">Xóa lúc</th>}
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {view === "active"
                ? pagedMovies.map((movie) => (
                    <MovieRow key={String(movie.id)} movie={movie}>
                      <button
                        type="button"
                        className={BTN_GHOST}
                        onClick={() => setFormState({ mode: "edit", movie })}
                        disabled={busyId === String(movie.id)}
                        title="Sửa phim"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={BTN_GHOST}
                        onClick={() => trashMovie(movie)}
                        disabled={busyId === String(movie.id)}
                        title="Chuyển vào thùng rác"
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </button>
                    </MovieRow>
                  ))
                : pagedTrash.map((item) => (
                    <MovieRow
                      key={String(item.movie.id)}
                      movie={item.movie}
                      extra={
                        <td className="px-4 py-3 text-white/50">
                          <div>{formatDateTime(item.deletedAt)}</div>
                          <div className="text-xs">bởi {item.deletedBy}</div>
                        </td>
                      }
                    >
                      <button
                        type="button"
                        className={BTN_GHOST}
                        onClick={() => restore(item.movie)}
                        disabled={busyId === String(item.movie.id)}
                        title="Khôi phục"
                      >
                        <RotateCcw className="h-4 w-4 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        className={BTN_GHOST}
                        onClick={() => deletePermanently(item.movie)}
                        disabled={busyId === String(item.movie.id)}
                        title="Xóa vĩnh viễn"
                      >
                        <X className="h-4 w-4 text-rose-400" />
                      </button>
                    </MovieRow>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={currentPage} totalPages={totalPages} total={total} onChange={setPage} />

      {formState && (
        <MovieFormModal
          movie={formState.movie}
          saving={saving}
          onClose={() => setFormState(null)}
          onSubmit={(payload) => void submitForm(payload)}
        />
      )}
    </div>
  );
}

function MovieRow({
  movie,
  extra,
  children,
}: {
  movie: Movie;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <PosterThumb src={movie.posterPath} alt={movie.title} />
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{movie.title}</div>
            <div className="truncate text-xs text-white/40">
              {movie.director || "—"} · {movie.ageRating || "—"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-white/70">{movie.genres.join(", ") || "—"}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
          {MOVIE_STATUS_LABEL[movie.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-white/70">{movie.durationMinutes} phút</td>
      <td className="px-4 py-3 text-white/70">{movie.voteAverage.toFixed(1)}</td>
      {extra}
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">{children}</div>
      </td>
    </tr>
  );
}

// ============================== TAB 3: AUDIT =================================

function auditBadgeClass(action: AuditAction): string {
  if (action.startsWith("SEAT_")) return "bg-violet-500/15 text-violet-300";
  if (action === "MOVIE_PERMANENTLY_DELETED" || action === "TRASH_EMPTIED") {
    return "bg-rose-500/15 text-rose-300";
  }
  return "bg-sky-500/15 text-sky-300";
}

function AuditPanel({ ctx }: { ctx: PanelContext }) {
  const { headers, notify } = ctx;

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callApi<{ logs: AuditLogItem[] }>("GET", headers, {
        query: {
          resource: "audit",
          limit: "500",
          action: actionFilter === "all" ? undefined : actionFilter,
        },
      });
      setLogs(data.logs);
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, headers, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, actionFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      `${log.actor} ${log.details} ${log.targetId} ${ACTION_LABEL[log.action]}`.toLowerCase().includes(q)
    );
  }, [logs, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * AUDIT_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + AUDIT_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${INPUT} pl-9`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo người thao tác, nội dung, mã đối tượng..."
          />
        </div>
        <select
          className={`${INPUT} w-auto`}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as "all" | AuditAction)}
        >
          <option value="all">Tất cả hành động</option>
          {AUDIT_ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <button type="button" className={BTN_GHOST} onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <div className={`${CARD} overflow-x-auto`}>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/60">
            <Spinner /> Đang tải nhật ký...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/50">Chưa có nhật ký nào phù hợp.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người thao tác</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageItems.map((log) => (
                <tr key={log.id} className="align-top hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-white/80">{log.actor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${auditBadgeClass(
                        log.action
                      )}`}
                    >
                      {ACTION_LABEL[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">
                    {log.targetType}:{log.targetId}
                  </td>
                  <td className="px-4 py-3 text-white/70">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} onChange={setPage} />
    </div>
  );
}

// ============================== MAIN COMPONENT ===============================

export interface AdminSeatsMoviesAuditTabProps {
  /** Header xác thực bổ sung (nếu isAdminAuthorized cần, VD: { "x-admin-token": "..." }). */
  authHeaders?: Record<string, string>;
  /** Tên Admin, gửi qua header x-admin-user để ghi vào nhật ký. */
  adminUser?: string;
  /** Ẩn tab Quản lý phim khi nhúng vào mục Sơ đồ ghế (đảm bảo mục ghế chỉ quản lý ghế). */
  hideMoviesTab?: boolean;
}

const SUB_TABS: ReadonlyArray<{ id: SubTab; label: string; icon: ReactNode }> = [
  { id: "seats", label: "Quản Lý Sơ Đồ Ghế & Bảo Trì Phòng Chiếu", icon: <Armchair className="h-4 w-4" /> },
  { id: "movies", label: "Quản Lý Phim & Thùng Rác", icon: <Film className="h-4 w-4" /> },
  { id: "audit", label: "Nhật Ký An Ninh (Audit Logs)", icon: <ScrollText className="h-4 w-4" /> },
];

export function AdminSeatsMoviesAuditTab({
  authHeaders,
  adminUser,
  hideMoviesTab = true,
}: AdminSeatsMoviesAuditTabProps) {
  const [tab, setTab] = useState<SubTab>("seats");
  const [toast, setToast] = useState<ToastState | null>(null);

  const authKey = JSON.stringify(authHeaders ?? {});
  const headers = useMemo<Record<string, string>>(() => {
    const base = JSON.parse(authKey) as Record<string, string>;
    return adminUser ? { ...base, "x-admin-user": adminUser } : base;
  }, [authKey, adminUser]);

  const notify = useCallback((type: "success" | "error", message: string) => {
    setToast({ id: Date.now(), type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const ctx = useMemo<PanelContext>(() => ({ headers, notify }), [headers, notify]);

  // Khi ở chế độ quản lý ghế, loại bỏ hoàn toàn tab Quản lý phim & thùng rác
  const subTabs = useMemo(() => {
    if (hideMoviesTab) {
      return [
        { id: "seats" as SubTab, label: "Quản Lý Sơ Đồ Ghế & Bảo Trì Phòng Chiếu", icon: <Armchair className="h-4 w-4" /> },
        { id: "audit" as SubTab, label: "Nhật Ký Thao Tác Ghế (Audit Logs)", icon: <ScrollText className="h-4 w-4" /> },
      ];
    }
    return SUB_TABS;
  }, [hideMoviesTab]);

  return (
    <div className="min-h-screen bg-[#0B0C10] p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Armchair className="w-5 h-5 text-rose-500" />
            <span>{hideMoviesTab ? "Quản Trị Sơ Đồ Ghế & Bảo Trì Phòng Chiếu" : "Quản trị Ghế, Phim & An ninh"}</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {hideMoviesTab
              ? "Quản lý trạng thái ghế thời gian thực, khóa bảo trì phòng chiếu và theo dõi nhật ký can thiệp kỹ thuật."
              : "Quản lý sơ đồ ghế phòng chiếu, danh mục phim và theo dõi nhật ký thao tác của Admin."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {subTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/40"
                  : "border border-white/10 bg-[#14151B] text-white/60 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {tab === "seats" && <SeatsPanel ctx={ctx} />}
        {!hideMoviesTab && tab === "movies" && <MoviesPanel ctx={ctx} />}
        {tab === "audit" && <AuditPanel ctx={ctx} />}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-xl ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-200"
              : "border-rose-500/40 bg-rose-950 text-rose-200"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default AdminSeatsMoviesAuditTab;
