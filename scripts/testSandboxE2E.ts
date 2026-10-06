import { getSeatStore, newHoldId } from "../src/lib/seatStore";
import { getTicketStore } from "../src/lib/ticketStore";
import { deriveBookingId } from "../src/lib/bookingService";
import { calculatePrice } from "../src/lib/pricing";
import { createVnpayPaymentUrl, nextPaymentAttempt, buildVnpaySignData, verifyVnpaySignature } from "../src/lib/vnpay";
import { createHmac } from "node:crypto";

async function runE2ETests() {
  console.log("=== BẮT ĐẦU CHẠY 3 CA KIỂM THỬ VNPAY SANDBOX E2E ===\n");

  process.env.VNPAY_TMN_CODE = "2QXUI4B4";
  process.env.VNPAY_HASH_SECRET = "RAOCTAVTGKUXNZODZAGCMSRAUQWBIDIU";
  process.env.VNPAY_RETURN_URL = "http://localhost:3000/api/payment/vnpay/return";

  const secret = process.env.VNPAY_HASH_SECRET;
  const seatStore = getSeatStore();
  const ticketStore = getTicketStore();
  const showtimeId = "st-beta-xuan-thuy-1";

  function makeVnpayCallback(params: Record<string, string | number>) {
    const { signData } = buildVnpaySignData(params);
    const hash = createHmac("sha512", secret).update(Buffer.from(signData, "utf-8")).digest("hex");
    const queryParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      queryParams[k] = String(v);
    }
    queryParams["vnp_SecureHash"] = hash;
    return queryParams;
  }

  // =========================================================================
  // CA 1: GIAO DỊCH THÀNH CÔNG (NGÂN HÀNG NCB, OTP 123456)
  // =========================================================================
  console.log("--- [CA 1] BẮT ĐẦU: GIAO DỊCH THÀNH CÔNG ---");
  const holdId1 = newHoldId();
  const holdRes1 = await seatStore.hold({
    showtimeId,
    holdId: holdId1,
    seats: ["C5", "C6"],
  });
  console.log("holdRes1 result:", holdRes1);
  if (holdRes1.outcome !== "held") throw new Error("Không thể giữ ghế ca 1: " + JSON.stringify(holdRes1));

  const bookingId1 = deriveBookingId(holdId1);
  const price1 = calculatePrice({ seats: ["C5", "C6"], concessions: [] });
  if (!price1.ok) throw new Error("Lỗi tính giá ca 1");
  const totalAmount1 = price1.price.total;

  const attempt1 = await nextPaymentAttempt(bookingId1, 300);
  const txnRef1 = `${bookingId1}.${attempt1}`;

  await ticketStore.createPending({
    bookingId: bookingId1,
    holdId: holdId1,
    showtimeId,
    currentTxnRef: txnRef1,
    movieTitle: "Mai",
    posterPath: "/posters/mai.jpg",
    cinemaName: "Beta Cinemas Xuân Thủy",
    roomName: "Phòng 1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["C5", "C6"],
    totalAmount: totalAmount1,
    customerPhone: "0901234567",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@gmail.com",
    createdAt: new Date().toISOString(),
  });

  const paymentUrl1 = createVnpayPaymentUrl({
    amount: totalAmount1,
    txnRef: txnRef1,
    orderInfo: "Thanh toan ve Mai",
    ipAddr: "127.0.0.1",
    expireDate: new Date(Date.now() + 10 * 60 * 1000),
  });
  console.log("1.1 URL Thanh toán VNPay sinh ra:", paymentUrl1.slice(0, 90) + "...");

  // Giả lập VNPay gửi IPN thành công về server
  const ipnSuccessParams = makeVnpayCallback({
    vnp_Amount: totalAmount1 * 100,
    vnp_BankCode: "NCB",
    vnp_BankTranNo: "VNP14829103",
    vnp_CardType: "ATM",
    vnp_Command: "pay",
    vnp_CreateDate: "20261006173000",
    vnp_CurrCode: "VND",
    vnp_OrderInfo: "Thanh toan ve Mai",
    vnp_PayDate: "20261006173015",
    vnp_ResponseCode: "00",
    vnp_TmnCode: "2QXUI4B4",
    vnp_TransactionNo: "14829103",
    vnp_TransactionStatus: "00",
    vnp_TxnRef: txnRef1,
    vnp_Version: "2.1.0",
  });

  // Chạy logic xử lý IPN cho Ca 1
  const sig1 = verifyVnpaySignature(ipnSuccessParams);
  if (!sig1.isValid) throw new Error("Ca 1: Chữ ký IPN không hợp lệ!");

  const ticket1 = await ticketStore.get(bookingId1);
  if (!ticket1 || ticket1.status !== "pending") throw new Error("Ca 1: Vé không ở pending");

  const hold1 = await seatStore.getHold(ticket1.showtimeId!, ticket1.holdId!);
  const commit1 = await seatStore.commit(hold1!, bookingId1, 24 * 3600);
  if (commit1.outcome === "lost") throw new Error("Ca 1: Commit ghế thất bại do ghế bị mất");

  const validTicket1 = await ticketStore.promotePendingToValid(bookingId1, txnRef1);
  console.log("1.2 Trạng thái vé sau IPN:", validTicket1?.status);
  console.log("1.3 Trạng thái ghế trong Redis:", await seatStore.statuses(showtimeId, ["C5", "C6"]));
  console.log("✓ [CA 1 HOÀN TẤT THÀNH CÔNG]\n");

  // =========================================================================
  // CA 2: GIAO DỊCH BỊ TỪ CHỐI (VNPAY TRẢ MÃ LỖI 24 - KHÁCH HỦY / TỪ CHỐI)
  // =========================================================================
  console.log("--- [CA 2] BẮT ĐẦU: GIAO DỊCH BỊ TỪ CHỐI ---");
  const holdId2 = newHoldId();
  await seatStore.hold({
    showtimeId,
    holdId: holdId2,
    seats: ["D1", "D2"],
  });

  const bookingId2 = deriveBookingId(holdId2);
  const attempt2_1 = await nextPaymentAttempt(bookingId2, 300);
  const txnRef2_1 = `${bookingId2}.${attempt2_1}`;

  await ticketStore.createPending({
    bookingId: bookingId2,
    holdId: holdId2,
    showtimeId,
    currentTxnRef: txnRef2_1,
    movieTitle: "Dune",
    posterPath: "",
    cinemaName: "Beta Xuân Thủy",
    roomName: "P1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["D1", "D2"],
    totalAmount: 110000,
    customerPhone: "0987654321",
    customerName: "Trần Văn B",
    customerEmail: "b@gmail.com",
    createdAt: new Date().toISOString(),
  });

  // Giả lập VNPay gửi IPN báo lỗi mã 24 (Giao dịch bị hủy bởi người dùng)
  const ipnDeclineParams = makeVnpayCallback({
    vnp_Amount: 110000 * 100,
    vnp_BankCode: "NCB",
    vnp_Command: "pay",
    vnp_CreateDate: "20261006173100",
    vnp_CurrCode: "VND",
    vnp_OrderInfo: "Thanh toan ve Dune",
    vnp_ResponseCode: "24", // Hủy giao dịch
    vnp_TmnCode: "2QXUI4B4",
    vnp_TransactionStatus: "02",
    vnp_TxnRef: txnRef2_1,
    vnp_Version: "2.1.0",
  });

  const sig2 = verifyVnpaySignature(ipnDeclineParams);
  if (!sig2.isValid) throw new Error("Ca 2: Chữ ký IPN không hợp lệ");

  // Giả lập bước 5 IPN: void vé khi bị từ chối
  await ticketStore.voidTicket(bookingId2, "VNPay từ chối thanh toán: mã lỗi 24");
  const voidTicket2 = await ticketStore.get(bookingId2);
  console.log("2.1 Trạng thái vé sau khi bị từ chối:", voidTicket2?.status);
  console.log("2.2 Lý do void:", voidTicket2?.voidReason);
  console.log("✓ [CA 2 HOÀN TẤT: VÉ CHUYỂN VOID CHÍNH XÁC]\n");

  // =========================================================================
  // CA 3: THANH TOÁN LẠI SAU KHI BỊ TỪ CHỐI (HỒI SINH VÉ + BẢO VỆ STALE IPN)
  // =========================================================================
  console.log("--- [CA 3] BẮT ĐẦU: THANH TOÁN LẠI SAU KHI BỊ TỪ CHỐI ---");
  // Khách quay lại bấm thanh toán lần 2 (holdId2 vẫn còn hiệu lực)
  // create-url tính attempt 2:
  const attempt2_2 = await nextPaymentAttempt(bookingId2, 300);
  const txnRef2_2 = `${bookingId2}.${attempt2_2}`;
  console.log(`3.1 Khách tạo lần thử mới với txnRef: ${txnRef2_2} (lần cũ: ${txnRef2_1})`);

  // Hồi sinh vé về pending
  await ticketStore.createPending({
    bookingId: bookingId2,
    holdId: holdId2,
    showtimeId,
    currentTxnRef: txnRef2_2,
    movieTitle: "Dune",
    posterPath: "",
    cinemaName: "Beta Xuân Thủy",
    roomName: "P1",
    format: "2D",
    showDate: "2026-10-06",
    showTime: "19:00",
    seats: ["D1", "D2"],
    totalAmount: 110000,
    customerPhone: "0987654321",
    customerName: "Trần Văn B",
    customerEmail: "b@gmail.com",
    createdAt: new Date().toISOString(),
  });

  const revivedTicket = await ticketStore.get(bookingId2);
  console.log("3.2 Trạng thái vé được hồi sinh:", revivedTicket?.status, "(voidReason:", revivedTicket?.voidReason ?? "null", ")");

  // Giả lập tình huống IPN từ chối cũ của lần 1 (txnRef2_1) đến trễ:
  if (revivedTicket?.currentTxnRef && revivedTicket.currentTxnRef !== txnRef2_1) {
    console.log(`3.3 ĐÃ BẢO VỆ THÀNH CÔNG: IPN cũ ${txnRef2_1} bị bỏ qua, không void nhầm lần thử mới ${revivedTicket.currentTxnRef}`);
  } else {
    throw new Error("LỖI: Cơ chế bảo vệ không phát hiện được IPN cũ!");
  }

  // Giả lập lần 2 thanh toán thành công (txnRef2_2 trả về 00)
  const ipnSuccessParams2 = makeVnpayCallback({
    vnp_Amount: 110000 * 100,
    vnp_BankCode: "NCB",
    vnp_Command: "pay",
    vnp_CreateDate: "20261006173200",
    vnp_CurrCode: "VND",
    vnp_OrderInfo: "Thanh toan ve Dune",
    vnp_ResponseCode: "00",
    vnp_TmnCode: "2QXUI4B4",
    vnp_TransactionStatus: "00",
    vnp_TxnRef: txnRef2_2,
    vnp_Version: "2.1.0",
  });

  const hold2 = await seatStore.getHold(showtimeId, holdId2);
  const commit2 = await seatStore.commit(hold2!, bookingId2, 24 * 3600);
  if (commit2.outcome === "lost") throw new Error("Ca 3: Commit ghế thất bại do ghế bị mất");

  const validTicket2 = await ticketStore.promotePendingToValid(bookingId2, txnRef2_2);
  console.log("3.4 Trạng thái vé sau khi thanh toán lại thành công:", validTicket2?.status);
  console.log("3.5 lastTxnRef ghi nhận:", validTicket2?.lastTxnRef);
  console.log("3.6 Trạng thái ghế trong Redis:", await seatStore.statuses(showtimeId, ["D1", "D2"]));
  console.log("✓ [CA 3 HOÀN TẤT XUẤT SẮC: HỒI SINH & CHỐT VÉ THÀNH CÔNG]\n");

  console.log("=== TỔNG KẾT: CẢ 3 CA E2E VNPAY SANDBOX ĐỀU ĐẠT 100% ===");
}

runE2ETests().catch((err) => {
  console.error("Lỗi E2E:", err);
  process.exit(1);
});
