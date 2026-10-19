// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCinemaSettings, updateCinemaSettings } from "@/lib/cinemaSettingsStore";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 * Lấy cấu hình hệ thống & thông báo banner đang phát đến khách hàng
 */
export async function GET(): Promise<Response> {
  const settings = getCinemaSettings();
  return NextResponse.json({
    success: true,
    data: settings,
  });
}

/**
 * POST /api/settings
 * Admin cập nhật thông báo banner hoặc giá vé hiển thị trên trang khách
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = request.headers.get("x-admin-user") || "Admin Quản Trị";
    const updated = updateCinemaSettings(body, actor);

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật cài đặt và phát thông báo trực tiếp đến trang khách hàng!",
      data: updated,
    });
  } catch (error) {
    console.error("[POST /api/settings] Lỗi cập nhật cài đặt:", error);
    return NextResponse.json({ error: "Lỗi xử lý yêu cầu cài đặt." }, { status: 500 });
  }
}
