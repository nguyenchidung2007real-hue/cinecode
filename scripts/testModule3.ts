import assert from "node:assert/strict";
import { normalizeSeatId, seatTier, allSeatIds } from "../src/lib/seatLayout";
import { calculatePrice } from "../src/lib/pricing";
import { holdSeats, releaseHold, confirmBooking, BookingError, deriveBookingId } from "../src/lib/bookingService";
import { getSeatStore } from "../src/lib/seatStore";
import { getTicketStore } from "../src/lib/ticketStore";

process.env.ALLOW_PAST_SHOWTIMES = "true";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ MODULE 3 (SEAT HOLD & BOOKING ENGINE) ===\n");

  // 1. Kiểm tra Sơ đồ ghế (seatLayout.ts)
  console.log("1. Kiểm tra Sơ đồ ghế:");
  assert.equal(normalizeSeatId("a1"), "A1");
  assert.equal(normalizeSeatId("H12"), "H12");
  assert.equal(normalizeSeatId("k6"), "K6");
  assert.equal(normalizeSeatId("k7"), null, "K7 không tồn tại");
  assert.equal(normalizeSeatId("J1"), null, "Hàng J không có trong sơ đồ");
  assert.equal(seatTier("A1"), "standard");
  assert.equal(seatTier("E5"), "vip");
  assert.equal(seatTier("H12"), "vip");
  assert.equal(seatTier("K2"), "couple");

  const allSeats = allSeatIds();
  assert.equal(allSeats.length, 8 * 12 + 6, "Tổng số ghế phải đúng 102 ghế (8 hàng x 12 + 6 ghế đôi)");
  console.log("   -> Sơ đồ ghế: PASSED (102 ghế, phân tầng chuẩn standard/vip/couple)\n");

  // 2. Kiểm tra Bộ tính giá (pricing.ts)
  console.log("2. Kiểm tra Bộ tính giá:");
  const priceResult1 = calculatePrice({
    seats: ["A1", "E1", "K1"],
    concessions: [
      {
        id: "combo-beta-solo",
        quantity: 1,
        popcornFlavors: ["cheese"], // +10.000đ
        drinks: [{ type: "peach_tea", size: "large" }], // +5.000đ + 12.000đ
      },
    ],
  });
  assert.equal(priceResult1.ok, true);
  if (priceResult1.ok) {
    // A1 = 55.000, E1 = 75.000, K1 = 130.000 -> Vé = 260.000đ
    assert.equal(priceResult1.price.ticketsSubtotal, 260_000);
    // Combo = 59.000 + (10.000 + 5.000 + 12.000) = 86.000đ
    assert.equal(priceResult1.price.concessionsSubtotal, 86_000);
    // Tổng cộng = 346.000đ
    assert.equal(priceResult1.price.total, 346_000);
  }

  // Thử gian lận combo không tồn tại
  const badPriceResult = calculatePrice({
    seats: ["A1"],
    concessions: [{ id: "combo-fake-hack", quantity: 1 }],
  });
  assert.equal(badPriceResult.ok, false);
  console.log("   -> Tính giá: PASSED (Vé 260k + Combo 86k = 346k, chống combo giả mạo)\n");

  // 3. Kiểm tra Tranh chấp 50 request cùng giữ ghế (Concurrency Race)
  console.log("3. Kiểm tra Tranh chấp 50 request cùng giữ ghế A1, A2:");
  const showtimeId = "st-beta-1";
  type RequestResult = { success: true; holdId: string } | { success: false; code: string };
  const requests: Promise<RequestResult>[] = Array.from({ length: 50 }, () =>
    holdSeats({ showtimeId, seats: ["A1", "A2"] })
      .then((res): RequestResult => ({ success: true, holdId: res.hold.holdId }))
      .catch((err): RequestResult => ({ success: false, code: (err as BookingError).code })),
  );

  const results = await Promise.all(requests);
  const successes = results.filter((r): r is { success: true; holdId: string } => r.success);
  const conflicts = results.filter((r): r is { success: false; code: string } => !r.success && r.code === "SEAT_TAKEN");

  assert.equal(successes.length, 1, "Chỉ duy nhất 1 request được thắng ghế");
  assert.equal(conflicts.length, 49, "49 request còn lại phải bị từ chối với mã SEAT_TAKEN");
  console.log(`   -> Concurrency: PASSED (1 thắng, 49 bị chặn 409 SEAT_TAKEN)\n`);

  const winningHoldId = successes[0].holdId;

  // 4. Kiểm tra Giữ chồng ghế một phần (Partial Collision)
  console.log("4. Kiểm tra Giữ chồng ghế một phần:");
  let partialRejected = false;
  try {
    await holdSeats({ showtimeId, seats: ["A2", "A3"] }); // A2 đang bị giữ
  } catch (err) {
    if (err instanceof BookingError && err.code === "SEAT_TAKEN") {
      partialRejected = true;
      assert.deepEqual(err.extra.seats, ["A2"]);
    }
  }
  assert.equal(partialRejected, true, "Giữ ghế dính A2 phải bị từ chối");

  // Kiểm tra A3 không bị giữ sót lại sau khi từ chối nguyên tử
  const statuses = await getSeatStore().statuses(showtimeId, ["A3"]);
  assert.equal(statuses["A3"], "free", "A3 vẫn phải là free sau khi lệnh thất bại");
  console.log("   -> Partial Collision: PASSED (Từ chối trọn gói, không rò rỉ A3)\n");

  // 5. Kiểm tra Hoàn tất Đặt vé (confirmBooking) & Idempotency
  console.log("5. Kiểm tra Chốt vé & Idempotency:");
  const booking1 = await confirmBooking({
    showtimeId,
    holdId: winningHoldId,
    seats: ["A1", "A2"],
    customer: { name: "Nguyễn Văn Test", phone: "0912345678", email: "test@cinemax.vn" },
    concessions: [],
    expectedTotal: 110_000,
    posterPath: "/poster.jpg",
    charge: async () => ({ ok: true, reference: "TEST-PAY-001" }),
  });

  assert.equal(booking1.replayed, false);
  assert.equal(booking1.ticket.totalAmount, 110_000);
  assert.equal(booking1.ticket.status, "valid");
  assert.ok(booking1.qrToken.startsWith(booking1.ticket.bookingId));

  // Request lặp lại với cùng holdId -> trả đúng vé cũ (replayed = true)
  const bookingReplay = await confirmBooking({
    showtimeId,
    holdId: winningHoldId,
    seats: ["A1", "A2"],
    customer: { name: "Nguyễn Văn Test", phone: "0912345678", email: "test@cinemax.vn" },
    concessions: [],
    expectedTotal: 110_000,
    posterPath: "/poster.jpg",
    charge: async () => ({ ok: true, reference: "TEST-PAY-002" }),
  });

  assert.equal(bookingReplay.replayed, true);
  assert.equal(bookingReplay.ticket.bookingId, booking1.ticket.bookingId);
  console.log("   -> Chốt vé & Idempotency: PASSED (Vé tạo thành công, bấm lại trả vé cũ không tạo mới)\n");

  // 6. Kiểm tra Thử replay với SĐT khác -> 403 REPLAY_FORBIDDEN
  console.log("6. Kiểm tra Bảo mật Replay (Chống người khác đoán holdId):");
  let replayBlocked = false;
  try {
    await confirmBooking({
      showtimeId,
      holdId: winningHoldId,
      seats: ["A1", "A2"],
      customer: { name: "Kẻ Lạ Mặt", phone: "0999999999" }, // SĐT khác
      concessions: [],
      expectedTotal: undefined,
      posterPath: "",
      charge: async () => ({ ok: true, reference: "HACK" }),
    });
  } catch (err) {
    if (err instanceof BookingError && err.code === "REPLAY_FORBIDDEN") {
      replayBlocked = true;
    }
  }
  assert.equal(replayBlocked, true, "Phải chặn khi sai SĐT người đặt");
  console.log("   -> Chống đánh cắp holdId: PASSED (Trả về 403 REPLAY_FORBIDDEN)\n");

  // 7. Kiểm tra Nhả ghế (releaseHold)
  console.log("7. Kiểm tra Nhả ghế:");
  const testHold = await holdSeats({ showtimeId, seats: ["B1", "B2"] });
  const beforeRelease = await getSeatStore().statuses(showtimeId, ["B1", "B2"]);
  assert.equal(beforeRelease["B1"], "held");
  assert.equal(beforeRelease["B2"], "held");

  await releaseHold(showtimeId, testHold.hold.holdId);
  const afterRelease = await getSeatStore().statuses(showtimeId, ["B1", "B2"]);
  assert.equal(afterRelease["B1"], "free");
  assert.equal(afterRelease["B2"], "free");
  console.log("   -> Nhả ghế: PASSED (B1, B2 chuyển lại thành free ngay sau khi nhả)\n");

  // 8. Kiểm tra Idempotency khi giữ lại cùng holdId
  console.log("8. Kiểm tra Client HoldId Idempotency:");
  const clientHoldId = "c111222333444555666777888999000a";
  const firstHold = await holdSeats({ showtimeId, seats: ["C1", "C2"], holdId: clientHoldId });
  assert.equal(firstHold.hold.holdId, clientHoldId);

  // Gọi lại cùng holdId -> thành công, giữ nguyên holdId & createdAt
  const secondHold = await holdSeats({ showtimeId, seats: ["C1", "C2"], holdId: clientHoldId });
  assert.equal(secondHold.hold.holdId, clientHoldId);
  assert.equal(secondHold.hold.createdAt, firstHold.hold.createdAt);
  console.log("   -> Client HoldId Idempotency: PASSED (Cùng holdId gọi lại được làm mới, không bị SEAT_TAKEN)\n");

  // 9. Kiểm tra Trần 15 phút (Hard Cap MAX_HOLD_LIFETIME_MS)
  console.log("9. Kiểm tra Trần 15 phút (Hard Cap MAX_HOLD_LIFETIME_MS):");
  // Cố tình đẩy createdAt về quá khứ 15 phút
  const pastCreatedAt = Date.now() - 15 * 60 * 1000 - 1000;
  const store = getSeatStore();
  const holdKeyToTamper = `cinemax:{${showtimeId}}:hold:${clientHoldId}`;
  const existingHold = await store.getHold(showtimeId, clientHoldId);
  if (existingHold) {
    const tamperedHold = { ...existingHold, createdAt: pastCreatedAt };
    // Ghi đè vào store (memory) để test boundary
    (store as any).data?.set(holdKeyToTamper, { value: JSON.stringify(tamperedHold), expiresAt: Date.now() + 10000 });
  }

  let expiredThrown = false;
  try {
    await holdSeats({ showtimeId, seats: ["C1", "C2"], holdId: clientHoldId });
  } catch (err) {
    if (err instanceof BookingError && err.code === "HOLD_EXPIRED") {
      expiredThrown = true;
    }
  }
  assert.equal(expiredThrown, true, "Quá 15 phút phải ném mã HOLD_EXPIRED");

  // Ghế phải được giải phóng ngay lập tức sau khi hết hạn
  const afterExpiredStatuses = await store.statuses(showtimeId, ["C1", "C2"]);
  assert.equal(afterExpiredStatuses["C1"], "free");
  assert.equal(afterExpiredStatuses["C2"], "free");
  console.log("   -> 15-minute Hard Cap: PASSED (Trả về HOLD_EXPIRED và giải phóng ghế lập tức)\n");

  // 10. Kiểm tra Mã đặt vé tất định (Deterministic bookingId)
  console.log("10. Kiểm tra Mã đặt vé tất định (Deterministic bookingId):");
  const testHoldId = "a0a1a2a3a4a5a6a7b0b1b2b3b4b5b6b7";
  const expectedBk = deriveBookingId(testHoldId);
  assert.ok(expectedBk.startsWith("bk-"));
  assert.equal(expectedBk.length, 15);
  assert.equal(deriveBookingId(testHoldId), expectedBk, "Cùng holdId phải luôn sinh ra cùng bookingId");
  console.log("   -> Deterministic bookingId: PASSED\n");

  // 11. Kiểm tra Chặn thanh toán khi thời gian giữ ghế còn dưới 30s
  console.log("11. Kiểm tra Chặn thanh toán khi thời gian giữ ghế còn dưới 30s:");
  const shortHold = await holdSeats({ showtimeId, seats: ["D1", "D2"] });
  const shortHoldKey = `cinemax:{${showtimeId}}:hold:${shortHold.hold.holdId}`;
  const rawShortHold = await store.getHold(showtimeId, shortHold.hold.holdId);
  if (rawShortHold) {
    const expiringSoonHold = { ...rawShortHold, expiresAt: Date.now() + 15_000 };
    (store as any).data?.set(shortHoldKey, { value: JSON.stringify(expiringSoonHold), expiresAt: Date.now() + 15000 });
  }
  let expiringBufferBlocked = false;
  try {
    await confirmBooking({
      showtimeId,
      holdId: shortHold.hold.holdId,
      seats: ["D1", "D2"],
      customer: { name: "Test Buffer", phone: "0912345678" },
      concessions: [],
      charge: async () => ({ ok: true, reference: "PAY-BUFFER" }),
      posterPath: "",
    });
  } catch (err) {
    if (err instanceof BookingError && err.code === "HOLD_EXPIRED") {
      expiringBufferBlocked = true;
    }
  }
  assert.equal(expiringBufferBlocked, true, "Thời gian còn dưới 30s phải bị chặn HOLD_EXPIRED");
  console.log("   -> 30s Buffer Before Payment: PASSED\n");

  // 12. Kiểm tra Ticket State Machine (pending -> valid, void) & Check-in Enforcement
  console.log("12. Kiểm tra Ticket State Machine (pending -> valid, void) & Check-in Enforcement:");
  const ticketStore = getTicketStore();
  const testBkId = "bk-statemachine1";
  const pendingRes = await ticketStore.createPending({
    bookingId: testBkId,
    movieTitle: "Test Movie",
    cinemaName: "Beta Xuân Thủy",
    roomName: "Screen 1",
    format: "2D Phụ Đề",
    showDate: "2026-09-30",
    showTime: "19:00",
    seats: ["E1"],
    totalAmount: 75000,
    customerName: "Nguyễn Test",
    customerEmail: "test@cinemax.vn",
    customerPhone: "0912345678",
    createdAt: new Date().toISOString(),
    posterPath: "",
  });
  assert.equal(pendingRes.ticket.status, "pending");

  // Check-in không được phép cho vé pending
  const checkPending = await ticketStore.markUsed(testBkId, "Staff 01");
  assert.equal(checkPending.outcome, "invalid_status");

  // Promote sang valid
  const promoted = await ticketStore.promotePendingToValid(testBkId);
  assert.ok(promoted);
  assert.equal(promoted?.status, "valid");

  // Check-in thành công
  const checkValid = await ticketStore.markUsed(testBkId, "Staff 01");
  assert.equal(checkValid.outcome, "checked_in");
  assert.equal(checkValid.ticket.status, "used");

  // Check-in lần 2 báo already_used
  const checkSecond = await ticketStore.markUsed(testBkId, "Staff 02");
  assert.equal(checkSecond.outcome, "already_used");

  // Kiểm tra vé void
  const voidBkId = "bk-voidtest1";
  await ticketStore.createPending({
    bookingId: voidBkId,
    movieTitle: "Test Movie Void",
    cinemaName: "Beta Xuân Thủy",
    roomName: "Screen 1",
    format: "2D Phụ Đề",
    showDate: "2026-09-30",
    showTime: "19:00",
    seats: ["E2"],
    totalAmount: 75000,
    customerName: "Nguyễn Void",
    customerEmail: "void@cinemax.vn",
    customerPhone: "0912345678",
    createdAt: new Date().toISOString(),
    posterPath: "",
  });
  const voided = await ticketStore.voidTicket(voidBkId, "PAYMENT_FAILED");
  assert.equal(voided?.status, "void");
  assert.equal(voided?.voidReason, "PAYMENT_FAILED");

  const checkVoid = await ticketStore.markUsed(voidBkId, "Staff 01");
  assert.equal(checkVoid.outcome, "invalid_status");
  console.log("   -> Ticket State Machine & Scanner Enforcement: PASSED\n");

  console.log("=== TOÀN BỘ 12 BÀI TEST MODULE 3 ĐÃ VƯỢT QUA 100% ===");
}

runTests().catch((err) => {
  console.error("Test FAILED:", err);
  process.exit(1);
});
