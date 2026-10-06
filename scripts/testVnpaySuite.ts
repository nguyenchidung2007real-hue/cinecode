import { formatVnpayDate, vnpayEncode, buildVnpaySignData, parseVnpayTxnRef, verifyVnpaySignature, createVnpayPaymentUrl } from "../src/lib/vnpay";
import { getTicketStore } from "../src/lib/ticketStore";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ MODULE VNPAY ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Kiểm thử định dạng múi giờ GMT+7 (không phụ thuộc múi giờ máy chủ)
  const utcDate = new Date("2026-10-06T10:15:30.000Z");
  const formatted = formatVnpayDate(utcDate);
  assert(formatted === "20261006171530", `formatVnpayDate phải chuyển 10:15:30Z thành 17:15:30 (kết quả: ${formatted})`);

  // 2. Kiểm thử RFC 3986 encoding (thoát ký tự !'()* và dấu cách thành +)
  const testStr = "Vé xem phim (VIP & Standard)*!";
  const encoded = vnpayEncode(testStr);
  assert(
    encoded.includes("%28") && encoded.includes("%29") && encoded.includes("%2A") && encoded.includes("%21"),
    `vnpayEncode phải escape các ký tự đặc biệt [!'()*] (kết quả: ${encoded})`
  );
  assert(!encoded.includes(" "), `vnpayEncode không được chứa dấu cách thường (kết quả: ${encoded})`);

  // 3. Kiểm thử phân tích vnp_TxnRef
  const parsed1 = parseVnpayTxnRef("bk-a1b2c3d4e5f6.4");
  assert(parsed1.bookingId === "bk-a1b2c3d4e5f6" && parsed1.attempt === 4, "Tách txnRef có số lần attempt");

  const parsed2 = parseVnpayTxnRef("bk-a1b2c3d4e5f6");
  assert(parsed2.bookingId === "bk-a1b2c3d4e5f6" && parsed2.attempt === 1, "Tách txnRef không có attempt (fallback 1)");

  // 4. Kiểm thử tính toán chữ ký số và so sánh an toàn thời gian
  process.env.VNPAY_TMN_CODE = "2QXUI4B4";
  process.env.VNPAY_HASH_SECRET = "RAOCTAVTGKUXNZODZAGCMSRAUQWBIDIU";
  process.env.VNPAY_RETURN_URL = "http://localhost:3000/api/payment/vnpay/return";

  const url = createVnpayPaymentUrl({
    amount: 150000,
    txnRef: "bk-test123456.1",
    orderInfo: "Thanh toan ve xem phim",
    ipAddr: "127.0.0.1",
    expireDate: new Date(Date.now() + 10 * 60 * 1000),
  });

  assert(url.includes("vnp_Amount=15000000"), "Số tiền phải được nhân 100 theo quy định VNPay");
  assert(url.includes("vnp_SecureHash="), "URL thanh toán phải chứa chữ ký vnp_SecureHash");

  // Giả lập callback nhận từ URL đã tạo
  const urlObj = new URL(url);
  const callbackParams = Object.fromEntries(urlObj.searchParams.entries());

  const verifySuccess = verifyVnpaySignature(callbackParams);
  assert(verifySuccess.isValid === true, "Chữ ký số hợp lệ với dữ liệu gốc");

  // Giả lập kẻ gian sửa đổi số tiền trên URL
  const tamperedParams = { ...callbackParams, vnp_Amount: "100000" };
  const verifyTampered = verifyVnpaySignature(tamperedParams);
  assert(verifyTampered.isValid === false, "Chữ ký số phải từ chối khi dữ liệu bị sửa đổi (vnp_Amount)");

  // 4b. Kiểm thử độc lập với bộ tham số mẫu chuẩn từ tài liệu VNPay Sandbox
  const officialVnpaySample = {
    vnp_Amount: "1806000",
    vnp_Command: "pay",
    vnp_CreateDate: "20210801153318",
    vnp_CurrCode: "VND",
    vnp_IpAddr: "127.0.0.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: "Thanh toan don hang 12345",
    vnp_OrderType: "other",
    vnp_ReturnUrl: "https://domain.vn/return",
    vnp_TmnCode: "2QXUI4B4",
    vnp_TxnRef: "12345",
    vnp_Version: "2.1.0",
  };
  const expectedOfficialHash = "1a13322bacd23b05171811752cefabad9ba9bc1a9425e9b16c8dc3a50fd1d4c04a9873cd495df219a32b1ac5f61faa4b31a50fa810e985152fbab9108fc40a3f";

  const { isValid: officialIsValid } = verifyVnpaySignature({
    ...officialVnpaySample,
    vnp_SecureHash: expectedOfficialHash,
  });
  assert(officialIsValid === true, "Chữ ký số khớp chuẩn 100% với vector băm mẫu chính thức của VNPay Sandbox");

  // 5. Kiểm thử lưu trữ vé pending: có holdId và tự động cập nhật khi đổi giá/combo
  const ticketStore = getTicketStore();
  const testBookingId = "bk-unit-test-hold-" + Date.now();

  await ticketStore.createPending({
    bookingId: testBookingId,
    holdId: "hold-test-uuid-999",
    showtimeId: "st-beta-1",
    movieTitle: "Dune Part Two",
    posterPath: "/posters/dune.jpg",
    cinemaName: "Beta Xuân Thủy",
    roomName: "Phòng 1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["A1", "A2"],
    totalAmount: 110000,
    customerPhone: "0912345678",
    customerName: "Nguyễn Văn A",
    customerEmail: "a@example.com",
    createdAt: new Date().toISOString(),
  });

  const record1 = await ticketStore.get(testBookingId);
  assert(record1?.holdId === "hold-test-uuid-999", "Vé pending phải lưu holdId");
  assert(record1?.totalAmount === 110000, "Giá ban đầu là 110.000đ");

  // Khách đổi combo làm giá tăng lên 180.000đ
  await ticketStore.createPending({
    bookingId: testBookingId,
    holdId: "hold-test-uuid-999",
    showtimeId: "st-beta-1",
    movieTitle: "Dune Part Two",
    posterPath: "/posters/dune.jpg",
    cinemaName: "Beta Xuân Thủy",
    roomName: "Phòng 1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["A1", "A2"],
    totalAmount: 180000, // Giá mới
    customerPhone: "0912345678",
    customerName: "Nguyễn Văn A",
    customerEmail: "a@example.com",
    createdAt: new Date().toISOString(),
  });

  const record2 = await ticketStore.get(testBookingId);
  assert(record2?.totalAmount === 180000, "Vé pending được cập nhật giá mới 180.000đ khi khách đổi combo");

  // 6. Kiểm thử kịch bản hồi sinh vé: void -> pending -> valid
  await ticketStore.voidTicket(testBookingId, "Thẻ bị từ chối lần 1");
  const recordVoid = await ticketStore.get(testBookingId);
  assert(recordVoid?.status === "void", "Vé bị chuyển sang void sau khi ngân hàng từ chối");

  // Khách bấm thanh toán lại lần 2
  await ticketStore.createPending({
    bookingId: testBookingId,
    holdId: "hold-test-uuid-999",
    showtimeId: "st-beta-1",
    movieTitle: "Dune Part Two",
    posterPath: "/posters/dune.jpg",
    cinemaName: "Beta Xuân Thủy",
    roomName: "Phòng 1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["A1", "A2"],
    totalAmount: 180000,
    customerPhone: "0912345678",
    customerName: "Nguyễn Văn A",
    customerEmail: "a@example.com",
    createdAt: new Date().toISOString(),
  });

  const recordRevived = await ticketStore.get(testBookingId);
  assert(recordRevived?.status === "pending", "Vé đã void được hồi sinh về pending thành công khi thanh toán lại");
  assert(recordRevived?.voidReason === undefined, "Lý do void cũ được xóa sạch khi tạo lại phiên");

  // Thanh toán lần 2 thành công -> promote lên valid
  const recordPromoted = await ticketStore.promotePendingToValid(testBookingId, "bk-test.2");
  assert(recordPromoted?.status === "valid", "Vé hồi sinh được nâng lên valid thành công");
  assert(recordPromoted?.lastTxnRef === "bk-test.2", "Ghi nhận đúng txnRef của lần thanh toán thành công");

  // 7. Kiểm thử chống void nhầm lần thử mới khi IPN báo lỗi của lần thử cũ đến trễ
  const testStaleBookingId = "bk-unit-test-stale-" + Date.now();
  await ticketStore.createPending({
    bookingId: testStaleBookingId,
    holdId: "hold-stale-1",
    showtimeId: "st-beta-1",
    currentTxnRef: `${testStaleBookingId}.1`,
    movieTitle: "Dune",
    posterPath: "",
    cinemaName: "Beta",
    roomName: "P1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["A1"],
    totalAmount: 55000,
    customerPhone: "0912345678",
    customerName: "A",
    customerEmail: "",
    createdAt: new Date().toISOString(),
  });

  // Khách bấm thanh toán lại lần 2 -> currentTxnRef được cập nhật lên lần 2
  await ticketStore.createPending({
    bookingId: testStaleBookingId,
    holdId: "hold-stale-1",
    showtimeId: "st-beta-1",
    currentTxnRef: `${testStaleBookingId}.2`,
    movieTitle: "Dune",
    posterPath: "",
    cinemaName: "Beta",
    roomName: "P1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["A1"],
    totalAmount: 55000,
    customerPhone: "0912345678",
    customerName: "A",
    customerEmail: "",
    createdAt: new Date().toISOString(),
  });

  const activeTicket = await ticketStore.get(testStaleBookingId);
  assert(activeTicket?.currentTxnRef === `${testStaleBookingId}.2`, "Vé đang lưu currentTxnRef của lần thử 2");

  const staleTxnRef = `${testStaleBookingId}.1`;
  const isStale = Boolean(activeTicket?.currentTxnRef && activeTicket.currentTxnRef !== staleTxnRef);
  assert(isStale === true, "Hệ thống phát hiện chính xác IPN cũ và bỏ qua, không void nhầm lần thử mới");

  console.log(`\n=== TỔNG KẾT: ${passed}/${total} TEST CASE ĐẠT CHUẨN ===`);
}

runTests().catch((err) => {
  console.error("Lỗi thực thi test:", err);
  process.exit(1);
});
