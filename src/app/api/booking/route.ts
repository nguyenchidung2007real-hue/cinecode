import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { BookingInfo } from "@/types";

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

    // Sinh mã vé duy nhất: CINE-YYYYMMDD-RANDOM
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingId = `TICKET-${Date.now().toString().slice(-6)}-${randomHex}`;

    // Dữ liệu mã hóa vào mã QR
    const qrPayload = JSON.stringify({
      code: bookingId,
      film: movieTitle,
      cinema: cinemaName,
      date: `${showDate} ${showTime}`,
      seats: seats.join(", "),
      total: totalAmount,
      name: customerName,
    });

    // Tạo Data URL QR Code
    const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
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
      qrCodeUrl,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Đặt vé thành công!",
      data: bookingRecord,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý đặt vé:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo vé" }, { status: 500 });
  }
}
