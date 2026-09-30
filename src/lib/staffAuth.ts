import { safeEqual } from "@/lib/adminAuth";

export interface StaffAccount {
  id: string;
  passcode: string;
  name: string;
}

export interface StaffAuthResult {
  ok: boolean;
  scannedByLabel?: string;
  reason?: string;
}

/**
 * Phân tích danh sách tài khoản nhân viên từ biến môi trường STAFF_ACCOUNTS.
 * Định dạng: "NV01:1234:Nguyễn Văn A,NV02:5678:Trần Thị B"
 */
export function getStaffAccounts(): StaffAccount[] {
  const raw = process.env.STAFF_ACCOUNTS?.trim();
  if (!raw) return [];

  const accounts: StaffAccount[] = [];
  const entries = raw.split(",");
  for (const entry of entries) {
    const parts = entry.split(":").map((p) => p.trim());
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      accounts.push({
        id: parts[0],
        passcode: parts[1],
        name: parts.slice(2).join(":"), // Giữ trọn vẹn họ tên nếu có dấu hai chấm
      });
    }
  }
  return accounts;
}

/**
 * Xác thực thông tin nhân viên soát vé.
 * 
 * - Chế độ A (Khuyến nghị): Cấu hình STAFF_ACCOUNTS -> Kiểm tra đúng cặp (staffId, passcode).
 *   Ghép staffId đúng với passcode của người khác sẽ bị TỪ CHỐI 100%.
 *   Tên người quét được server tự ghép (${account.id} - ${account.name}), client không thể mạo danh.
 * 
 * - Chế độ B (Tương thích ngược): Chưa cấu hình STAFF_ACCOUNTS -> Dùng STAFF_SCAN_SECRET chung.
 */
export function verifyStaffCredentials(input: {
  staffId?: string | null;
  passcode?: string | null;
  bearerToken?: string | null;
}): StaffAuthResult {
  const staffAccounts = getStaffAccounts();
  const staffId = input.staffId?.trim();
  const passcode = input.passcode?.trim() || input.bearerToken?.trim();

  // Chế độ A: Xác thực tài khoản nhân viên cá nhân hóa
  if (staffAccounts.length > 0) {
    if (!staffId || !passcode) {
      return {
        ok: false,
        reason: "Vui lòng nhập đầy đủ Mã nhân viên và Mật khẩu ca trực.",
      };
    }

    // Tìm đúng tài khoản theo staffId
    const account = staffAccounts.find((acc) => acc.id.toLowerCase() === staffId.toLowerCase());
    if (!account) {
      return {
        ok: false,
        reason: "Mã nhân viên không tồn tại trong hệ thống.",
      };
    }

    // So sánh passcode an toàn thời gian chống timing attack
    if (!safeEqual(account.passcode, passcode)) {
      return {
        ok: false,
        reason: "Mật khẩu ca trực không chính xác.",
      };
    }

    return {
      ok: true,
      scannedByLabel: `${account.id} - ${account.name}`,
    };
  }

  // Chế độ B: Fallback STAFF_SCAN_SECRET dùng chung
  const sharedSecret = process.env.STAFF_SCAN_SECRET?.trim();
  if (sharedSecret) {
    if (!passcode || !safeEqual(sharedSecret, passcode)) {
      return {
        ok: false,
        reason: "Mật khẩu soát vé không chính xác.",
      };
    }
    const label = staffId ? `${staffId} (Staff)` : "Staff";
    return { ok: true, scannedByLabel: label };
  }

  // Chế độ C: Môi trường Dev không cấu hình gì
  if (process.env.NODE_ENV !== "production") {
    const label = staffId ? `${staffId} (Dev Staff)` : "Dev Staff";
    return { ok: true, scannedByLabel: label };
  }

  return {
    ok: false,
    reason: "Hệ thống chưa cấu hình STAFF_ACCOUNTS hoặc STAFF_SCAN_SECRET trên production.",
  };
}
