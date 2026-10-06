import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/adminAuth";
import { getKvConfig, kvCommand } from "@/lib/kvRest";

export interface VnpayOrderParams {
  amount: number;       // Số tiền VND thực tế (sẽ được tự động nhân 100)
  txnRef: string;       // ${bookingId}.${attempt}
  orderInfo: string;    // Nội dung chuyển khoản (đã sanitize)
  ipAddr: string;       // IP khách hàng
  expireDate: Date;     // Hạn thanh toán (gắn với thời gian giữ ghế)
  returnUrl?: string;   // Ghi đè URL trả về nếu cần
}

/**
 * Định dạng thời gian theo chuẩn VNPay (yyyyMMddHHmmss) ở múi giờ Việt Nam (GMT+7).
 * Sử dụng getUTC... trên timestamp đã cộng 7 tiếng, đảm bảo hoàn toàn độc lập với múi giờ server (Vercel/Local).
 */
export function formatVnpayDate(date: Date = new Date()): string {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = vnTime.getUTCFullYear();
  const MM = pad(vnTime.getUTCMonth() + 1);
  const dd = pad(vnTime.getUTCDate());
  const HH = pad(vnTime.getUTCHours());
  const mm = pad(vnTime.getUTCMinutes());
  const ss = pad(vnTime.getUTCSeconds());

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Chuẩn hóa encodeURIComponent theo chuẩn RFC 3986 và urlencode của PHP (VNPay gateway):
 * - Đổi %20 thành +
 * - Bắt buộc escape các ký tự đặc biệt [!'()*] mà encodeURIComponent mặc định bỏ qua.
 */
export function vnpayEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Sắp xếp các tham số theo thứ tự bảng chữ cái ASCII và tạo chuỗi ký/query string.
 * Bỏ qua các khóa rỗng, null, undefined và các trường chữ ký (vnp_SecureHash, vnp_SecureHashType).
 */
export function buildVnpaySignData(params: Record<string, string | number>): {
  signData: string;
  queryString: string;
} {
  const sortedKeys = Object.keys(params).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      const encodedKey = vnpayEncode(key);
      const encodedVal = vnpayEncode(String(val));
      pairs.push(`${encodedKey}=${encodedVal}`);
    }
  }

  const signData = pairs.join("&");
  return { signData, queryString: signData };
}

/**
 * Sinh URL thanh toán chuyển hướng sang cổng VNPay.
 */
export function createVnpayPaymentUrl(order: VnpayOrderParams): string {
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const secretKey = process.env.VNPAY_HASH_SECRET?.trim();
  const vnpUrl = process.env.VNPAY_URL?.trim() || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = order.returnUrl || process.env.VNPAY_RETURN_URL?.trim();

  if (!tmnCode || !secretKey || !returnUrl) {
    throw new Error("Chưa cấu hình đầy đủ biến môi trường VNPay (VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL).");
  }

  const now = new Date();
  const createDate = formatVnpayDate(now);
  const expireDate = formatVnpayDate(order.expireDate);

  const vnpParams: Record<string, string | number> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: order.txnRef,
    vnp_OrderInfo: order.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: order.amount * 100, // VNPay quy định nhân 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: order.ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const { signData, queryString } = buildVnpaySignData(vnpParams);
  const hmac = createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return `${vnpUrl}?${queryString}&vnp_SecureHash=${signed}`;
}

/**
 * Xác minh chữ ký số nhận được từ VNPay IPN hoặc Return URL.
 * Sử dụng so sánh an toàn thời gian safeEqual (chống Timing Attack).
 */
export function verifyVnpaySignature(
  queryParams: Record<string, string>
): { isValid: boolean; data: Record<string, string> } {
  const secretKey = process.env.VNPAY_HASH_SECRET?.trim();
  if (!secretKey) return { isValid: false, data: {} };

  const cleanParams: Record<string, string> = {};
  let receivedHash = "";

  for (const [key, val] of Object.entries(queryParams)) {
    if (!val) continue;
    if (key === "vnp_SecureHash") {
      receivedHash = val;
    } else if (key !== "vnp_SecureHashType") {
      cleanParams[key] = val;
    }
  }

  const { signData } = buildVnpaySignData(cleanParams);
  const hmac = createHmac("sha512", secretKey);
  const expectedHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return {
    isValid: safeEqual(receivedHash.toLowerCase(), expectedHash.toLowerCase()),
    data: cleanParams,
  };
}

/**
 * Tách vnp_TxnRef dạng `${bookingId}.${attempt}` để lấy lại bookingId gốc.
 */
export function parseVnpayTxnRef(txnRef: string): { bookingId: string; attempt: number } {
  const lastDot = txnRef.lastIndexOf(".");
  if (lastDot === -1) {
    return { bookingId: txnRef, attempt: 1 };
  }
  const bookingId = txnRef.slice(0, lastDot);
  const attempt = Number(txnRef.slice(lastDot + 1)) || 1;
  return { bookingId, attempt };
}

// Bộ nhớ tạm cho dev khi không có Redis
const memoryAttempts = new Map<string, number>();

/**
 * Sinh số lần thanh toán tăng dần (attempt) cho bookingId.
 * Lưu trữ trong Redis (INCR) với TTL theo thời gian giữ ghế.
 */
export async function nextPaymentAttempt(bookingId: string, ttlSeconds: number): Promise<number> {
  const kvConfig = getKvConfig();
  const key = `cinemax:pay_attempt:${bookingId}`;

  if (kvConfig) {
    const raw = await kvCommand(kvConfig, ["INCR", key]);
    const count = typeof raw === "number" ? raw : Number(raw) || 1;
    await kvCommand(kvConfig, ["EXPIRE", key, String(Math.max(60, ttlSeconds))]);
    return count;
  }

  const current = (memoryAttempts.get(key) ?? 0) + 1;
  memoryAttempts.set(key, current);
  return current;
}
