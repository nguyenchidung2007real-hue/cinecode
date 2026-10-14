import fs from "fs";
import path from "path";
import { getTicketStore, buildTicketToken } from "../src/lib/ticketStore";
import { POST as checkInHandler } from "../src/app/api/tickets/check-in/route";
import { NextRequest } from "next/server";

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.trim() || "";
      }
    }
  }
} catch {}

if (!process.env.STAFF_ACCOUNTS) {
  process.env.STAFF_ACCOUNTS = "NV01:1234:Nguyễn Văn A,NV02:5678:Trần Thị B";
}

async function runStaffScannerTests() {
  console.log("===============================================================================");
  console.log("   KIỂM THỬ PHÂN HỆ SOÁT VÉ QR SCANNER CHO NHÂN VIÊN (/staff/scanner)   ");
  console.log("===============================================================================\n");

  const store = getTicketStore();
  const staffId = "NV01";
  const staffPasscode = "1234";

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // Helper tạo NextRequest
  function makeRequest(body: any, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/tickets/check-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  // 1. Tạo vé hợp lệ (valid ticket)
  const validBookingId = `bk-scan-test-${Date.now()}`;
  await store.create({
    bookingId: validBookingId,
    movieTitle: "Dune: Phần Hai",
    posterPath: "https://images.unsplash.com/photo-1534447677768-be436bb09401",
    cinemaName: "Beta Cinemas Xuân Thủy",
    roomName: "Phòng Beta 01 (Dolby 7.1)",
    format: "2D Phụ Đề",
    showDate: "2026-10-15",
    showTime: "19:00",
    seats: ["E5", "E6"],
    customerName: "Nguyễn Văn Test",
    customerEmail: "test@cinemax.vn",
    customerPhone: "0987654321",
    totalAmount: 150000,
    concessions: [],
    createdAt: new Date().toISOString(),
  });

  const validToken = buildTicketToken(validBookingId);

  // Test 1: Từ chối khi sai quyền nhân viên (nhập sai mật khẩu ca trực)
  console.log("--- BÀI TEST 1: XÁC THỰC QUYỀN NHÂN VIÊN SOÁT VÉ ---");
  const unauthReq = makeRequest({ token: validToken, staffId: "NV01", passcode: "wrong-passcode" });
  const unauthRes = await checkInHandler(unauthReq);
  assert(unauthRes.status === 403, "Từ chối truy cập khi nhân viên nhập sai passcode (HTTP 403)");

  const unauthReq2 = makeRequest({ token: validToken, staffId: "NV_UNKNOWN", passcode: "1234" });
  const unauthRes2 = await checkInHandler(unauthReq2);
  assert(unauthRes2.status === 403, "Từ chối truy cập khi mã nhân viên không tồn tại (HTTP 403)");

  // Test 2: Check-in vé hợp lệ lần đầu
  console.log("\n--- BÀI TEST 2: CHECK-IN VÉ HỢP LỆ LẦN ĐẦU ---");
  const authReq = makeRequest({
    token: validToken,
    passcode: staffPasscode,
    staffId: staffId,
    scannedBy: "Cổng 01 - Screen 1",
  });
  const checkInRes = await checkInHandler(authReq);
  const checkInData = await checkInRes.json();
  assert(checkInRes.status === 200, "Check-in thành công với mã vé hợp lệ (HTTP 200)");
  assert(checkInData.outcome === "checked_in", "Outcome trả về 'checked_in'");
  assert(checkInData.ticket.status === "used", "Trạng thái vé đổi sang 'used'");
  assert(Boolean(checkInData.ticket.usedAt), "Vé lưu thời điểm quét usedAt");
  assert(checkInData.ticket.scannedBy.includes("NV01"), "Ghi nhận đúng mã nhân viên soát vé");

  // Test 3: Quét lại lần 2 (Chống gian lận quét 2 lần)
  console.log("\n--- BÀI TEST 3: PHÁT HIỆN & CHẶN VÉ QUÉT LẠI LẦN 2 (ALREADY_USED) ---");
  const replayReq = makeRequest({
    token: validToken,
    passcode: staffPasscode,
    staffId: staffId,
  });
  const replayRes = await checkInHandler(replayReq);
  const replayData = await replayRes.json();
  assert(replayRes.status === 409, "Từ chối check-in lần 2 (HTTP 409 Conflict)");
  assert(replayData.outcome === "already_used", "Outcome trả về 'already_used'");
  assert(Boolean(replayData.ticket.usedAt), "Trả về bằng chứng thời điểm vé đã được sử dụng");

  // Test 4: Chữ ký số vé bị sửa đổi (Giả mạo vé)
  console.log("\n--- BÀI TEST 4: PHÁT HIỆN VÉ GIẢ MẠO / SAI CHỮ KÝ HMAC ---");
  const tamperedToken = validToken.slice(0, -4) + "abcd";
  const fakeReq = makeRequest({
    token: tamperedToken,
    staffId: staffId,
    passcode: staffPasscode,
  });
  const fakeRes = await checkInHandler(fakeReq);
  const fakeData = await fakeRes.json();
  assert(fakeRes.status === 400, "Từ chối mã vé bị sửa đổi chữ ký (HTTP 400)");
  assert(fakeData.outcome === "invalid", "Outcome trả về 'invalid' cảnh báo vé giả mạo");

  // Test 5: Vé đang chờ thanh toán (pending)
  console.log("\n--- BÀI TEST 5: TỪ CHỐI CHECK-IN VÉ CHƯA THANH TOÁN (PENDING) ---");
  const pendingBookingId = `bk-pending-${Date.now()}`;
  await store.createPending({
    bookingId: pendingBookingId,
    holdId: "h-test-1",
    totalAmount: 110000,
  } as any);
  const pendingToken = buildTicketToken(pendingBookingId);
  const pendingReq = makeRequest({
    token: pendingToken,
    staffId: staffId,
    passcode: staffPasscode,
  });
  const pendingRes = await checkInHandler(pendingReq);
  const pendingData = await pendingRes.json();
  assert(pendingRes.status === 400, "Từ chối vé chưa thanh toán (HTTP 400)");
  assert(pendingData.outcome === "invalid_status", "Outcome trả về 'invalid_status'");

  // Test 6: Vé đã bị hủy / hoàn tiền (void)
  console.log("\n--- BÀI TEST 6: TỪ CHỐI CHECK-IN VÉ ĐÃ BỊ HỦY (VOID) ---");
  const voidBookingId = `bk-void-${Date.now()}`;
  await store.create({
    bookingId: voidBookingId,
    movieTitle: "Dune: Phần Hai",
    posterPath: "https://images.unsplash.com/photo-1534447677768-be436bb09401",
    cinemaName: "Beta Cinemas Xuân Thủy",
    roomName: "Phòng Beta 01 (Dolby 7.1)",
    format: "2D Phụ Đề",
    showDate: "2026-10-15",
    showTime: "19:00",
    seats: ["C1"],
    customerName: "Khách Hoàn Vé",
    customerEmail: "void@cinemax.vn",
    customerPhone: "0900000000",
    totalAmount: 55000,
    concessions: [],
    createdAt: new Date().toISOString(),
  });
  await store.voidTicket(voidBookingId, "Hoàn vé theo yêu cầu");
  const voidToken = buildTicketToken(voidBookingId);
  const voidReq = makeRequest({
    token: voidToken,
    staffId: staffId,
    passcode: staffPasscode,
  });
  const voidRes = await checkInHandler(voidReq);
  const voidData = await voidRes.json();
  assert(voidRes.status === 400, "Từ chối vé đã bị hủy (HTTP 400)");
  assert(voidData.outcome === "invalid_status", "Báo vé ở trạng thái invalid_status (void)");

  console.log("\n===============================================================================");
  console.log(`   TỔNG KẾT SOÁT VÉ SCANNER: ${passed}/${total} TEST CASES ĐẠT CHUẨN (100%)   `);
  console.log("===============================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runStaffScannerTests().catch((err) => {
  console.error("Lỗi thực thi test:", err);
  process.exit(1);
});
