import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/adminAuth";
import { syncBetaXuanThuyMovies, getLastSyncTime } from "@/lib/betaCrawler";

export const dynamic = "force-dynamic";

// GET không cần auth — chỉ trả metadata tĩnh (status + lastSyncTime), không có dữ liệu nhạy cảm
export async function GET() {
  return NextResponse.json({
    status: "ready",
    cinema: "Beta Cinemas Xuân Thủy (Dữ liệu mô phỏng Demo)",
    lastSyncTime: getLastSyncTime(),
  });
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SYNC_SECRET?.trim();

  // Production bắt buộc phải cấu hình ADMIN_SYNC_SECRET
  if (process.env.NODE_ENV === "production" && !adminSecret) {
    return NextResponse.json(
      { error: "Chưa cấu hình ADMIN_SYNC_SECRET trên máy chủ." },
      { status: 500 },
    );
  }

  // Nếu có secret (bất kể NODE_ENV): luôn kiểm tra — không để tên môi trường quyết định bật/tắt auth
  if (adminSecret) {
    const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!safeEqual(provided, adminSecret)) {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }
  } else {
    // Không có secret và không phải production: cho qua (dev), nhưng cảnh báo rõ
    console.warn(
      "[CineMax Sync] ⚠️ ADMIN_SYNC_SECRET chưa được cấu hình — endpoint sync-beta đang mở không cần auth. Đặt biến môi trường này trước khi deploy.",
    );
  }

  try {
    const result = await syncBetaXuanThuyMovies();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Sync Beta] Lỗi đồng bộ:", error);
    return NextResponse.json(
      { success: false, error: "Không thể làm mới dữ liệu mô phỏng lúc này." },
      { status: 500 },
    );
  }
}
