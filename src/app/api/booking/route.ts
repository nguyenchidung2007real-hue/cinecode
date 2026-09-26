import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { BookingInfo } from "@/types";
import { buildTicketToken, getTicketStore } from "@/lib/ticketStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      movieTitle,
      posterPath,
      cinemaName,
      roomName,
      format,
      showDate,
      showTime,
      seats,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
    } = body;

    if (!seats || seats.length === 0 || !movieTitle) {
      return NextResponse.json({ error: "Thông tin đặt vé không hợp lệ" }, { status: 400 });
    }

    // Sinh mã vé duy nhất: TICKET-XXXXXX-XXXXX (chỉ dùng chữ, số, dấu gạch nối)
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingId = `TICKET-${Date.now().toString().slice(-6)}-${randomHex}`;

    // Tạo mã token ký số HMAC: bookingId.signature
    const qrToken = buildTicketToken(bookingId);

    // Dữ liệu mã hóa vào mã QR chính là qrToken bảo mật
    const qrCodeUrl = await QRCode.toDataURL(qrToken, {
      width: 280,
      margin: 2,
      color: {
        dark: "#0b0c10",
        light: "#ffffff",
      },
    });

    const bookingRecord: BookingInfo = {
      bookingId,
      movieTitle,
      posterPath,
      cinemaName,
      roomName,
      format,
      showDate,
      showTime,
      seats,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      qrToken,
      qrCodeUrl,
      status: "valid",
      createdAt: new Date().toISOString(),
    };

    // Đăng ký vé vào kho dữ liệu trung tâm (ticketStore)
    try {
      const store = getTicketStore();
      await store.create(bookingRecord);
    } catch (storeErr) {
      console.error("[api/booking] Lỗi đăng ký vé vào ticketStore:", storeErr);
    }

    return NextResponse.json({
      success: true,
      message: "Đặt vé thành công!",
      data: bookingRecord,
      qrToken,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý đặt vé:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo vé" }, { status: 500 });
  }
}
