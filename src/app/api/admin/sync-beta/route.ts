import { NextRequest, NextResponse } from "next/server";
import { syncBetaXuanThuyMovies, getLastSyncTime } from "@/lib/betaCrawler";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    cinema: "Beta Cinemas Xuân Thủy (Dữ liệu mô phỏng Demo)",
    lastSyncTime: getLastSyncTime(),
  });
}

export async function POST(req: NextRequest) {
  // Bảo vệ route trên môi trường Production
  const adminSecret = process.env.ADMIN_SYNC_SECRET;
  const authHeader = req.headers.get("authorization");

  if (process.env.NODE_ENV === "production") {
    // Nếu có cài ADMIN_SYNC_SECRET thì kiểm tra Bearer token, nếu không thì chặn gọi trực tiếp
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: "Thao tác chỉ khả dụng ở chế độ cục bộ hoặc yêu cầu Authorization Bearer Secret." },
        { status: 403 }
      );
    }
  }

  try {
    const result = await syncBetaXuanThuyMovies();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Sync Beta] Lỗi đồng bộ:", error);
    return NextResponse.json(
      { success: false, error: "Không thể làm mới dữ liệu mô phỏng lúc này." },
      { status: 500 }
    );
  }
}
