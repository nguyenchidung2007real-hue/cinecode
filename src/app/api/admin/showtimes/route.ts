import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { getMovies } from "@/lib/movieService";
import {
  DEFAULT_CINEMA_ID,
  StoreBusyError,
  getShowtimeStore,
  normalizeRoomName,
} from "@/lib/showtimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;
const CINEMA_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,59}$/i;

function readString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.length <= maxLength ? trimmed : null;
}

function readId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readString(value, 50);
}

/**
 * POST /api/admin/showtimes
 * Header: Authorization: Bearer <ADMIN_API_SECRET>
 * Body:   { movieId, roomName, date: "YYYY-MM-DD", time: "HH:mm", format?, cinemaId? }
 *
 * - Thời lượng và tên phim được lấy từ danh mục phim ở server, KHÔNG nhận từ client
 *   (client không thể khai thời lượng ngắn để né va chạm).
 * - Kiểm tra va chạm + ghi được thực hiện nguyên tử theo từng phòng trong store.
 *
 * Trả về: 201 đã tạo | 409 xung đột (kèm gợi ý giờ trống) | 422 dữ liệu sai | 503 kho đang bận.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403, headers: NO_STORE });
  }

  const store = getShowtimeStore();
  if (!store.persistent && process.env.NODE_ENV === "production" && process.env.ALLOW_EPHEMERAL_STORE !== "true") {
    // Bộ nhớ tạm trên serverless không chia sẻ giữa các instance: ghi vào đây là mất/không nhất quán.
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình Redis (UPSTASH_REDIS_REST_URL/TOKEN hoặc KV_REST_API_URL/TOKEN) nên không thể lưu suất chiếu ở production.",
      },
      { status: 503, headers: NO_STORE },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body phải là JSON hợp lệ." }, { status: 400, headers: NO_STORE });
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "Thiếu thông tin suất chiếu." }, { status: 400, headers: NO_STORE });
  }

  const body = raw as Record<string, unknown>;
  const movieId = readId(body.movieId);
  const roomNameRaw = readString(body.roomName, 100);
  const date = readString(body.date, 10);
  const time = readString(body.time, 5);
  const format = body.format === undefined ? "2D" : readString(body.format, 30);
  const cinemaId = body.cinemaId === undefined ? DEFAULT_CINEMA_ID : readString(body.cinemaId, 60);

  if (!movieId || !roomNameRaw || !date || !time || !format || !cinemaId) {
    return NextResponse.json(
      { error: "Cần đủ movieId, roomName, date (YYYY-MM-DD), time (HH:mm); format và cinemaId phải hợp lệ nếu có." },
      { status: 400, headers: NO_STORE },
    );
  }
  if (!CINEMA_ID_PATTERN.test(cinemaId)) {
    return NextResponse.json({ error: "cinemaId không hợp lệ." }, { status: 400, headers: NO_STORE });
  }

  try {
    const movies = await getMovies("all");
    const movie = movies.find((m) => String(m.id) === movieId);
    if (!movie) {
      return NextResponse.json({ error: "Không tìm thấy phim trong danh mục." }, { status: 404, headers: NO_STORE });
    }
    if (!Number.isInteger(movie.durationMinutes) || movie.durationMinutes <= 0) {
      return NextResponse.json(
        { error: `Phim "${movie.title}" chưa có thời lượng hợp lệ trong danh mục nên chưa thể xếp suất.` },
        { status: 422, headers: NO_STORE },
      );
    }

    const outcome = await store.createChecked({
      cinemaId,
      roomName: normalizeRoomName(roomNameRaw),
      date,
      time,
      durationMinutes: movie.durationMinutes,
      movieId,
      movieTitle: movie.title,
      format,
    });

    if (outcome.outcome === "invalid") {
      return NextResponse.json(
        { error: "Dữ liệu suất chiếu không hợp lệ.", errors: outcome.result.errors },
        { status: 422, headers: NO_STORE },
      );
    }

    if (outcome.outcome === "conflict") {
      const { result } = outcome;
      return NextResponse.json(
        {
          error: "Suất chiếu bị xung đột với lịch của phòng.",
          occupied: result.occupied,
          totalOccupiedMinutes: result.totalOccupiedMinutes,
          conflicts: result.conflicts.map((c) => ({
            kind: c.kind,
            message: c.message,
            existingRange: c.existingRange,
            existing: {
              id: c.existing.id ?? null,
              movieTitle: c.existing.movieTitle ?? null,
              date: c.existing.date,
              time: c.existing.time,
            },
          })),
          suggestions: result.suggestions,
        },
        { status: 409, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      { success: true, showtime: outcome.showtime, storeMode: store.name, persistent: store.persistent },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof StoreBusyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503, headers: { ...NO_STORE, "Retry-After": "2" } },
      );
    }
    console.error("[POST /api/admin/showtimes] Lỗi tạo suất chiếu:", error);
    return NextResponse.json(
      { error: "Không tạo được suất chiếu lúc này." },
      { status: 500, headers: NO_STORE },
    );
  }
}

/**
 * DELETE /api/admin/showtimes?id=<showtimeId>
 * Header: Authorization: Bearer <ADMIN_API_SECRET>
 */
export async function DELETE(request: NextRequest): Promise<Response> {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403, headers: NO_STORE });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Thiếu id suất chiếu cần xóa." }, { status: 400, headers: NO_STORE });
  }

  try {
    const store = getShowtimeStore();
    const deleted = await store.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy suất chiếu để xóa." }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ success: true, message: `Đã xóa suất chiếu ${id}.` }, { status: 200, headers: NO_STORE });
  } catch (error) {
    if (error instanceof StoreBusyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503, headers: { ...NO_STORE, "Retry-After": "2" } },
      );
    }
    console.error("[DELETE /api/admin/showtimes] Lỗi xóa suất chiếu:", error);
    return NextResponse.json({ error: "Không xóa được suất chiếu lúc này." }, { status: 500, headers: NO_STORE });
  }
}
