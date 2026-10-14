import { NextRequest, NextResponse } from "next/server";
import { verifyVnpaySignature, parseVnpayTxnRef } from "@/lib/vnpay";
import { getTicketStore } from "@/lib/ticketStore";
import { getSeatStore } from "@/lib/seatStore";
import { getShowtimeStore } from "@/lib/showtimeStore";
import { computeSoldTtlSeconds } from "@/lib/bookingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // App Router: trích xuất query parameters sạch dạng Record<string, string>
  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  if (process.env.NODE_ENV !== "production") {
    console.log("\n--- [VNPay IPN Incoming Payload] ---");
    console.log(JSON.stringify(queryParams, null, 2));
    console.log("------------------------------------\n");
  }

  // 1. Xác thực chữ ký số HMAC-SHA512
  const { isValid, data } = verifyVnpaySignature(queryParams);
  if (!isValid) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid Checksum" });
  }

  const txnRef = data.vnp_TxnRef || "";
  const { bookingId } = parseVnpayTxnRef(txnRef);

  const ticketStore = getTicketStore();
  const seatStore = getSeatStore();

  // 2. Tra cứu đơn vé trong ticketStore
  const ticket = await ticketStore.get(bookingId);
  if (!ticket) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  // 3. Kiểm tra Idempotency & Cảnh báo thu trùng tiền
  if (ticket.status === "valid") {
    if (ticket.lastTxnRef && ticket.lastTxnRef !== txnRef) {
      console.error(
        `\n[VNPay IPN ALERT] 🚨 KHẢ NĂNG THU TRÙNG TIỀN CHO ĐƠN ${bookingId}!\n` +
        `Đơn đã chốt với giao dịch ${ticket.lastTxnRef}, nhưng vừa nhận thêm thanh toán thành công với giao dịch ${txnRef}.\n` +
        `CẦN SOÁT HOÀN TIỀN THỦ CÔNG CHO KHÁCH HÀNG!\n`
      );
    }
    return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  }

  // 3b. Chặn tuyệt đối nếu vé đã bị đóng (void hoặc used)
  if (ticket.status === "used" || ticket.status === "void") {
    const vnpAmount = Number(data.vnp_Amount);
    const isSuccess = data.vnp_ResponseCode === "00" && data.vnp_TransactionStatus === "00";
    if (isSuccess) {
      console.error(
        `\n[VNPay IPN ALERT] 🚨 TIỀN VỀ CHO VÉ ĐÃ ĐÓNG (status: ${ticket.status})!\n` +
        `bookingId: ${bookingId}, txnRef: ${txnRef}, số tiền: ${vnpAmount / 100} VND.\n` +
        `Hệ thống từ chối chốt ghế vì vé không ở trạng thái pending. CẦN SOÁT HOÀN TIỀN THỦ CÔNG!\n`
      );
    }
    return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  }

  // 4. Xác định kết quả giao dịch từ VNPay trước
  const isSuccess = data.vnp_ResponseCode === "00" && data.vnp_TransactionStatus === "00";

  if (!isSuccess) {
    // BẢO VỆ CHỐNG VOID NHẦM: Nếu IPN mang txnRef của lần thử cũ (bị trễ/gọi lại),
    // mà khách đã bấm thanh toán lại lần mới (ticket.currentTxnRef khác txnRef),
    // TUYỆT ĐỐI không void vé đang chờ kết quả của lần thử mới!
    if (ticket.currentTxnRef && ticket.currentTxnRef !== txnRef) {
      console.warn(
        `[VNPay IPN] Bỏ qua thông báo lỗi của giao dịch cũ ${txnRef} (lần thử hiện tại đang chờ: ${ticket.currentTxnRef})`
      );
      return NextResponse.json({ RspCode: "00", Message: "Ignored stale failed attempt" });
    }

    // Giao dịch của lần thử hiện tại bị từ chối/hủy: dọn vé pending sang void để tránh rác
    await ticketStore.voidTicket(bookingId, `VNPay từ chối thanh toán: mã lỗi ${data.vnp_ResponseCode}`);
    return NextResponse.json({ RspCode: "00", Message: "Confirm Success (Payment declined)" });
  }

  // 5. CHỈ ĐỐI CHIẾU TIỀN KHI GIAO DỊCH THÀNH CÔNG (Server Authority)
  // Giao dịch thất bại không có dòng tiền nên không cần kiểm tra số tiền (tránh bị lệch giá khi khách đổi combo ở lần thử mới)
  const vnpAmount = Number(data.vnp_Amount);
  if (vnpAmount !== ticket.totalAmount * 100) {
    return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  }

  // 6. Pha hoàn tất: Chốt ghế (Lua script) và Nâng vé sang Valid
  try {
    if (!ticket.holdId || !ticket.showtimeId) {
      console.error(`[VNPay IPN] LỖI DỮ LIỆU: Vé ${bookingId} thiếu holdId hoặc showtimeId.`);
      return NextResponse.json({ RspCode: "99", Message: "Missing hold/showtime data" });
    }

    const hold = await seatStore.getHold(ticket.showtimeId, ticket.holdId);
    if (!hold) {
      // Đã thanh toán thành công nhưng phiên giữ ghế đã hết hạn
      console.error(`[VNPay IPN] ⚠️ ĐÃ THU TIỀN NHƯNG MẤT GHẾ: ${bookingId}. Cần kích hoạt hoàn tiền tự động.`);
      await ticketStore.voidTicket(bookingId, "Ghế đã hết hạn giữ chỗ khi thanh toán - cần hoàn tiền");
      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
    }

    const showtime = await getShowtimeStore().getById(ticket.showtimeId);
    const soldTtlSeconds = showtime ? computeSoldTtlSeconds(showtime) : 7 * 24 * 3600;

    const commitOutcome = await seatStore.commit(hold, bookingId, soldTtlSeconds);
    if (commitOutcome.outcome === "lost") {
      console.error(`[VNPay IPN] ⚠️ GHẾ BỊ TRANH CHẤP KHI COMMIT: ${bookingId}. Kích hoạt hoàn tiền.`);
      await ticketStore.voidTicket(bookingId, "Ghế bị tranh chấp - cần hoàn tiền");
      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
    }

    // Nâng vé pending sang valid, lưu lại lastTxnRef để chống thu trùng
    try {
      const validTicket = await ticketStore.promotePendingToValid(bookingId, txnRef);
      if (!validTicket) throw new Error("promotePendingToValid returned null");
      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
    } catch (promoteError) {
      console.error(
        `[VNPay IPN] 🚨 LỖI KÍCH HOẠT VÉ SAU KHI COMMIT GHẾ: ${bookingId}. Thực hiện rollback ghế và void vé:`,
        promoteError
      );
      await seatStore.rollbackCommit(hold, bookingId).catch((rollbackErr) => {
        console.error(`[VNPay IPN] 🚨 Rollback ghế thất bại cho ${bookingId}:`, rollbackErr);
      });
      await ticketStore.voidTicket(bookingId, "Lỗi nâng vé sau khi chốt ghế - Cần hoàn tiền thủ công").catch(() => {});
      return NextResponse.json({ RspCode: "99", Message: "Ticket activation failed, rolled back seats" });
    }
  } catch (err) {
    console.error(`[VNPay IPN] Lỗi hoàn tất đơn vé ${bookingId}:`, err);
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
  }
}
