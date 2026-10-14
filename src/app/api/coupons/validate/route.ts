import { NextRequest, NextResponse } from "next/server";
import { DbRepository } from "@/lib/dbRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const orderAmount = typeof body.orderAmount === "number" ? body.orderAmount : 0;

    if (!code) {
      return NextResponse.json({ success: false, valid: false, error: "Vui lòng nhập mã giảm giá." }, { status: 400 });
    }

    if (orderAmount <= 0) {
      return NextResponse.json({ success: false, valid: false, error: "Số tiền đơn hàng không hợp lệ." }, { status: 400 });
    }

    const result = await DbRepository.validateCoupon(code, orderAmount);

    if (!result.valid || !result.coupon) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: result.message || "Mã giảm giá không hợp lệ.",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });
  } catch (error) {
    console.error("[POST /api/coupons/validate] Lỗi kiểm tra voucher:", error);
    return NextResponse.json({ success: false, valid: false, error: "Lỗi hệ thống khi kiểm tra mã giảm giá." }, { status: 500 });
  }
}
