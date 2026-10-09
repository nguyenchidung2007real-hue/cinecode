import { NextRequest, NextResponse } from "next/server";
import { verifyVnpaySignature, parseVnpayTxnRef } from "@/lib/vnpay";
import { getTicketStore } from "@/lib/ticketStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  if (process.env.NODE_ENV !== "production") {
    console.log("\n--- [VNPay Return Incoming Payload] ---");
    console.log(JSON.stringify(queryParams, null, 2));
    console.log("---------------------------------------\n");
  }

  const { isValid, data } = verifyVnpaySignature(queryParams);

  const txnRef = data.vnp_TxnRef || "";
  const { bookingId } = parseVnpayTxnRef(txnRef);

  const responseCode = data.vnp_ResponseCode;
  const isVnpaySuccess = isValid && responseCode === "00";

  // Kiểm tra trạng thái thực tế trong ticketStore (nguồn sự thật được cập nhật từ IPN)
  const ticketStore = getTicketStore();
  const ticket = bookingId ? await ticketStore.get(bookingId) : null;
  const isTicketReady = ticket?.status === "valid";

  // Xác định trạng thái trả về UI
  let displayStatus = "failed";
  if (!isValid) {
    displayStatus = "invalid_checksum";
  } else if (isTicketReady) {
    displayStatus = "success";
  } else if (isVnpaySuccess) {
    displayStatus = "pending_ipn"; // IPN đang đến, UI hiển thị đang xác thực và poll
  }

  // Chuyển hướng về trang chủ kèm cờ thông báo modal vé
  const targetUrl = new URL("/", request.url);
  targetUrl.searchParams.set("vnp_return", "true");
  targetUrl.searchParams.set("bookingId", bookingId);
  targetUrl.searchParams.set("status", displayStatus);

  return NextResponse.redirect(targetUrl);
}
