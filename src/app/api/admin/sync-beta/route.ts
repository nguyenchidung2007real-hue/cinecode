import { NextResponse } from "next/server";
import { syncBetaXuanThuyMovies, getLastSyncTime } from "@/lib/betaCrawler";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    cinema: "Beta Cinemas Xuân Thủy",
    lastSyncTime: getLastSyncTime(),
  });
}

export async function POST() {
  try {
    const result = await syncBetaXuanThuyMovies();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Sync Beta] Lỗi đồng bộ:", error);
    return NextResponse.json(
      { success: false, error: "Không thể đồng bộ từ Beta Cinemas lúc này." },
      { status: 500 }
    );
  }
}
