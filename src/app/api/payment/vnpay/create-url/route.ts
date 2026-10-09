import { NextRequest, NextResponse } from "next/server";
import { getSeatStore } from "@/lib/seatStore";
import { getTicketStore } from "@/lib/ticketStore";
import { deriveBookingId, loadSellableShowtime, BookingError } from "@/lib/bookingService";
import { calculatePrice } from "@/lib/pricing";
import { createVnpayPaymentUrl, nextPaymentAttempt } from "@/lib/vnpay";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (await isRateLimited("vnpay_create", ip, 20, 60)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu tạo thanh toán, vui lòng chờ." }, { status: 429 });
    }

    const body = await request.json();
    const { showtimeId, holdId, concessions, customer } = body;

    if (!showtimeId || !holdId || !customer?.phone) {
      return NextResponse.json({ error: "Thiếu thông tin đặt vé hoặc người nhận vé." }, { status: 400 });
    }

    const seatStore = getSeatStore();
    const ticketStore = getTicketStore();

    // 1. Kiểm tra bản ghi Hold trong Redis
    const hold = await seatStore.getHold(showtimeId, holdId);
    if (!hold) {
      return NextResponse.json({ error: "Phiên giữ ghế đã hết hạn hoặc không tồn tại." }, { status: 410 });
    }

    // 2. Kiểm tra thời gian giữ ghế còn lại
    const remainingHoldMs = hold.expiresAt - Date.now();
    if (remainingHoldMs < 60_000) {
      return NextResponse.json({ error: "Thời gian giữ ghế còn lại dưới 1 phút, vui lòng chọn ghế lại." }, { status: 400 });
    }

    // 2b. Kiểm tra suất chiếu và lấy metadata chuẩn từ máy chủ (Server Authority)
    const showtime = await loadSellableShowtime(showtimeId);

    // 3. Tính tiền tại Server (Authority)
    const priceCalc = calculatePrice({ seats: hold.seats, concessions });
    if (!priceCalc.ok) {
      return NextResponse.json({ error: priceCalc.error }, { status: 400 });
    }
    const totalAmount = priceCalc.price.total;

    // 4. Sinh bookingId
    const bookingId = deriveBookingId(holdId);

    // Kiểm tra nếu vé đã từng được thanh toán thành công trước đó (Idempotency)
    const existing = await ticketStore.get(bookingId);
    if (existing && (existing.status === "valid" || existing.status === "used")) {
      return NextResponse.json({ error: "Đơn đặt vé này đã được thanh toán hoàn tất.", bookingId }, { status: 409 });
    }

    // 5. Tính số lần attempt duy nhất cho VNPay (trần tối đa 5 lần thử cho một đơn vé)
    const attempt = await nextPaymentAttempt(bookingId, Math.ceil(remainingHoldMs / 1000));
    if (attempt > 5) {
      return NextResponse.json(
        { error: "Đã vượt quá số lần thử thanh toán tối đa (5 lần). Vui lòng đặt lại vé mới.", code: "MAX_PAYMENT_ATTEMPTS" },
        { status: 429 }
      );
    }
    const txnRef = `${bookingId}.${attempt}`;

    // 6. Lưu vé pending - BẮT BUỘC lưu cả holdId, showtimeId VÀ currentTxnRef để chống void nhầm lần thử mới
    // Toàn bộ metadata phim, phòng, giờ, định dạng lấy từ showtime máy chủ
    await ticketStore.createPending({
      bookingId,
      holdId,
      showtimeId,
      currentTxnRef: txnRef,
      movieTitle: showtime.movieTitle,
      posterPath: body.posterPath || "",
      cinemaName: "Beta Cinemas Xuân Thủy",
      roomName: showtime.roomName,
      format: showtime.format,
      showDate: showtime.date,
      showTime: showtime.time,
      seats: hold.seats,
      totalAmount,
      customerPhone: customer.phone,
      customerName: customer.name || "Khách xem phim",
      customerEmail: customer.email || "",
      concessions: priceCalc.price.concessions as any,
      createdAt: new Date().toISOString(),
    });

    // 6. Tính hạn thanh toán (ExpireDate): min(thời gian giữ ghế, 15 phút)
    const expireDate = new Date(Date.now() + Math.min(remainingHoldMs, 15 * 60 * 1000));

    // 7. Chuẩn hóa OrderInfo an toàn (chỉ chứa bookingId, loại bỏ PII số điện thoại)
    const rawOrderInfo = `Thanh toan ve ${bookingId}`;
    const safeOrderInfo = rawOrderInfo.replace(/[^a-zA-Z0-9\s,\-_]/g, " ").trim();

    // 8. Sinh URL chuyển hướng VNPay (đảm bảo ip hợp lệ, không để lọt 'unknown' lên VNPay)
    const safeIp = !ip || ip === "unknown" || !/^[0-9a-fA-F:.]+$/.test(ip) ? "127.0.0.1" : ip;
    const paymentUrl = createVnpayPaymentUrl({
      amount: totalAmount,
      txnRef,
      orderInfo: safeOrderInfo,
      ipAddr: safeIp,
      expireDate,
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      bookingId,
      txnRef,
      expireAt: expireDate.toISOString(),
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[vnpay/create-url] Lỗi:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi tạo giao dịch VNPay." }, { status: 500 });
  }
}
