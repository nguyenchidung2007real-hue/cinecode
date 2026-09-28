import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { BookingInfo, SelectedComboItem } from "@/types";
import { buildTicketToken, getTicketStore } from "@/lib/ticketStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function readTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.length <= maxLength ? trimmed : null;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không đúng định dạng JSON." }, { status: 400 });
  }

  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Thiếu thông tin đặt vé." }, { status: 400 });
  }

  const record = raw as Record<string, unknown>;

  const movieTitle = readTrimmedString(record.movieTitle, 200);
  const cinemaName = readTrimmedString(record.cinemaName, 200);
  const roomName = readTrimmedString(record.roomName, 100);
  const format = readTrimmedString(record.format, 50);
  const showDate = readTrimmedString(record.showDate, 20);
  const showTime = readTrimmedString(record.showTime, 20);
  const customerName = readTrimmedString(record.customerName, 200);
  const customerEmail = typeof record.customerEmail === "string" ? record.customerEmail.slice(0, 200).trim() : "";
  const customerPhone = readTrimmedString(record.customerPhone, 30);
  const posterPath = typeof record.posterPath === "string" ? record.posterPath.slice(0, 500) : "";

  const seats = Array.isArray(record.seats)
    ? record.seats
        .filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= 10)
        .slice(0, 20)
    : null;

  const totalAmount =
    typeof record.totalAmount === "number" && Number.isFinite(record.totalAmount) && record.totalAmount >= 0
      ? record.totalAmount
      : null;

  if (
    !movieTitle ||
    !cinemaName ||
    !roomName ||
    !format ||
    !showDate ||
    !showTime ||
    !customerName ||
    !customerPhone ||
    !seats ||
    seats.length === 0 ||
    totalAmount === null
  ) {
    return NextResponse.json({ error: "Thông tin đặt vé không hợp lệ hoặc thiếu trường bắt buộc." }, { status: 400 });
  }

  // Validate concessions nếu có
  let sanitizedConcessions: SelectedComboItem[] | undefined = undefined;
  if (Array.isArray(record.concessions) && record.concessions.length > 0) {
    sanitizedConcessions = record.concessions.slice(0, 10).map((c: any) => ({
      id: String(c.id || "").slice(0, 50),
      name: String(c.name || "").slice(0, 100),
      quantity: Math.max(1, Math.min(20, Number(c.quantity) || 1)),
      basePrice: Number(c.basePrice) || 0,
      popcornFlavors: Array.isArray(c.popcornFlavors) ? c.popcornFlavors.slice(0, 4) : [],
      drinks: Array.isArray(c.drinks) ? c.drinks.slice(0, 4) : [],
      extraPrice: Number(c.extraPrice) || 0,
      totalPrice: Number(c.totalPrice) || 0,
    }));
  }

  try {
    const store = getTicketStore();
    let bookingId = "";
    let createResult: any = null;

    // Sinh ID duy nhất bằng cryptographically secure randomBytes, có vòng lặp chống trùng
    for (let attempt = 0; attempt < 3; attempt++) {
      const hex = randomBytes(6).toString("hex").toUpperCase();
      bookingId = `TICKET-${Date.now().toString().slice(-6)}-${hex}`;

      const candidateRecord: BookingInfo = {
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
        concessions: sanitizedConcessions,
        status: "valid",
        createdAt: new Date().toISOString(),
      };

      createResult = await store.create(candidateRecord);
      if (createResult.outcome === "created") {
        break;
      }
    }

    if (!createResult || createResult.outcome !== "created") {
      throw new Error("Không thể tạo ID vé duy nhất sau nhiều lần thử.");
    }

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

    const finalTicket: BookingInfo = {
      ...createResult.ticket,
      qrToken,
      qrCodeUrl,
    };

    return NextResponse.json({
      success: true,
      message: "Đặt vé thành công!",
      data: finalTicket,
      qrToken,
      storeMode: store.name,
    });
  } catch (error) {
    console.error("[api/booking] Lỗi hệ thống khi tạo vé:", error);
    // Bắt buộc trả về HTTP 500 nếu kho lưu trữ thất bại, KHÔNG nuốt lỗi và KHÔNG cấp vé giả
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lưu vé, giao dịch chưa hoàn tất. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
