import assert from "node:assert/strict";

// Module 1: Sơ đồ ghế, phân tầng & Bộ tính giá F&B
import { normalizeSeatId, seatTier, allSeatIds } from "../src/lib/seatLayout";
import { calculatePrice, CONCESSION_CATALOG } from "../src/lib/pricing";

// Module 2: Showtime Collision Engine
import {
  checkShowtimeCollision,
  computeOccupiedMinutes,
  BUFFER_MINUTES,
  TRAILER_MINUTES,
  CLEANING_MINUTES,
  type ShowtimeLike,
} from "../src/lib/showtimeCollision";

// Module 3: Seat Hold, Booking Service & Concurrency
import {
  holdSeats,
  releaseHold,
  confirmBooking,
  BookingError,
  deriveBookingId,
} from "../src/lib/bookingService";
import { getSeatStore } from "../src/lib/seatStore";

// Module 4: Orphan Seat Rule & Seat Recommender
import { checkOrphanSeats } from "../src/lib/orphanSeatRule";
import { recommendSeats, extractPartySize } from "../src/lib/seatRecommender";
import type { Seat } from "../src/types";

// Module 5: Ticket Security, HMAC QR & Check-In Anti-Fraud
import {
  getTicketStore,
  buildTicketToken,
  verifyTicketToken,
} from "../src/lib/ticketStore";
import { safeEqual } from "../src/lib/adminAuth";

// Module 6: Mood Detection & AI Cinema Engine
import {
  detectMoodAndMovie,
  normalizeVietnamese,
  containsPhrase,
} from "../src/lib/moodDetector";
import { MOCK_MOVIES } from "../src/lib/mockData";

process.env.ALLOW_PAST_SHOWTIMES = "true";

async function runAllTests() {
  console.log("================================================================================");
  console.log("   CINEMAX AI - BỘ KIỂM THỬ TOÀN DIỆN TẤT CẢ CÁC MODULE (ALL MODULES TEST SUITE)  ");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            passedTests++;
            console.log(`  ✓ [PASSED] ${name}`);
          })
          .catch((err) => {
            console.error(`  ✗ [FAILED] ${name}`);
            console.error(err);
            throw err;
          });
      }
      passedTests++;
      console.log(`  ✓ [PASSED] ${name}`);
    } catch (err) {
      console.error(`  ✗ [FAILED] ${name}`);
      console.error(err);
      throw err;
    }
  }

  /* ========================================================================== */
  /* MODULE 1: F&B UPSELL CUSTOMIZATION & DYNAMIC PRICING ENGINE                */
  /* ========================================================================== */
  console.log("--- MODULE 1: F&B UPSELL CUSTOMIZATION & PRICING ENGINE ---");

  runTest("1.1. Sơ đồ 102 ghế chuẩn Beta Cinemas và phân tầng chính xác", () => {
    assert.equal(normalizeSeatId("a1"), "A1");
    assert.equal(normalizeSeatId("H12"), "H12");
    assert.equal(normalizeSeatId("k6"), "K6");
    assert.equal(normalizeSeatId("k7"), null);
    assert.equal(normalizeSeatId("J1"), null);
    assert.equal(seatTier("A1"), "standard");
    assert.equal(seatTier("E5"), "vip");
    assert.equal(seatTier("H12"), "vip");
    assert.equal(seatTier("K2"), "couple");
    const allSeats = allSeatIds();
    assert.equal(allSeats.length, 8 * 12 + 6); // 102 ghế
  });

  runTest("1.2. Giá vé ghế theo tầng (Standard 55k, VIP 75k, Couple 130k)", () => {
    const res = calculatePrice({
      seats: ["A1", "E1", "K1"],
      concessions: [],
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.price.ticketLines[0].price, 55_000);
      assert.equal(res.price.ticketLines[1].price, 75_000);
      assert.equal(res.price.ticketLines[2].price, 130_000);
      assert.equal(res.price.ticketsSubtotal, 260_000);
      assert.equal(res.price.total, 260_000);
    }
  });

  runTest("1.3. Combo Beta Solo tùy biến vị bắp phô mai (+10k) & trà đào upsize lớn (+17k)", () => {
    const res = calculatePrice({
      seats: ["B1"], // 55.000đ
      concessions: [
        {
          id: "combo-beta-solo", // Base 59.000đ
          quantity: 1,
          popcornFlavors: ["cheese"], // +10.000đ
          drinks: [{ type: "peach_tea", size: "large" }], // +5.000đ (đào) + 12.000đ (large) = +17.000đ
        },
      ],
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      // Combo: 59k + 10k + 17k = 86.000đ
      assert.equal(res.price.concessionsSubtotal, 86_000);
      // Tổng: 55k (vé) + 86k (combo) = 141.000đ
      assert.equal(res.price.total, 141_000);
    }
  });

  runTest("1.4. Combo Couple 2 ngăn: Bắp caramel (+10k) + Bắp ngọt (0đ) & 2 nước ngọt tiêu chuẩn (0đ)", () => {
    const res = calculatePrice({
      seats: ["K1"], // 130.000đ
      concessions: [
        {
          id: "combo-beta-couple", // Base 89.000đ
          quantity: 1,
          popcornFlavors: ["caramel", "sweet"], // +10.000đ
          drinks: [
            { type: "pepsi", size: "regular" },
            { type: "7up", size: "regular" },
          ], // +0đ
        },
      ],
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.price.concessionsSubtotal, 99_000);
      assert.equal(res.price.total, 229_000);
    }
  });

  runTest("1.5. Chống gian lận: Từ chối combo không có trong Catalog", () => {
    const res = calculatePrice({
      seats: ["A1"],
      concessions: [{ id: "combo-hack-price", quantity: 1 }],
    });
    assert.equal(res.ok, false);
  });

  runTest("1.6. Chống gian lận: Từ chối số lượng vị bắp vượt quá số ngăn cho phép", () => {
    const res = calculatePrice({
      seats: ["A1"],
      concessions: [
        {
          id: "combo-beta-solo", // Solo chỉ có 1 ngăn bắp
          quantity: 1,
          popcornFlavors: ["cheese", "caramel"], // gửi 2 vị -> gian lận
          drinks: [{ type: "pepsi", size: "regular" }],
        },
      ],
    });
    assert.equal(res.ok, false);
  });

  console.log("");

  /* ========================================================================== */
  /* MODULE 2: SHOWTIME COLLISION DETECTION & ROOM SCHEDULING ENGINE            */
  /* ========================================================================== */
  console.log("--- MODULE 2: SHOWTIME COLLISION ENGINE ---");

  runTest("2.1. Công thức thời gian chiếm dụng phòng (thời lượng + 10p trailer + 15p dọn)", () => {
    assert.equal(BUFFER_MINUTES, 25);
    assert.equal(TRAILER_MINUTES, 10);
    assert.equal(CLEANING_MINUTES, 15);
    // Phim 120 phút -> chiếm 145 phút
    assert.equal(computeOccupiedMinutes(120), 145);
  });

  runTest("2.2. Phát hiện xung đột đè giờ chiếu trực tiếp trong cùng phòng (Overlap)", () => {
    const existing: ShowtimeLike[] = [
      {
        id: "st-1",
        cinemaId: "beta-xuan-thuy",
        roomName: "Phòng Beta 01",
        date: "2026-10-01",
        time: "18:00",
        durationMinutes: 120, // Chiếm 18:00 -> 20:25
        movieTitle: "Dune 2",
      },
    ];

    const candidate: ShowtimeLike = {
      cinemaId: "beta-xuan-thuy",
      roomName: "Phòng Beta 01",
      date: "2026-10-01",
      time: "19:00", // Bắt đầu khi phim trước đang chiếu
      durationMinutes: 90,
      movieTitle: "Kung Fu Panda 4",
    };

    const result = checkShowtimeCollision(candidate, existing);
    assert.equal(result.ok, false);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].kind, "overlap");
  });

  runTest("2.3. Phát hiện vi phạm thời gian dọn dẹp vệ sinh phòng (Buffer Conflict)", () => {
    const existing: ShowtimeLike[] = [
      {
        id: "st-1",
        cinemaId: "beta-xuan-thuy",
        roomName: "Phòng Beta 01",
        date: "2026-10-01",
        time: "18:00",
        durationMinutes: 120, // Hết phim 20:00, hết dọn phòng 20:25
      },
    ];

    const candidate: ShowtimeLike = {
      cinemaId: "beta-xuan-thuy",
      roomName: "Phòng Beta 01",
      date: "2026-10-01",
      time: "20:10", // Phim trước đã hết nhưng chưa đủ 15p dọn phòng
      durationMinutes: 90,
    };

    const result = checkShowtimeCollision(candidate, existing);
    assert.equal(result.ok, false);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].kind, "buffer");
  });

  runTest("2.4. Cho phép xếp suất chiếu kế tiếp ngay khi hết buffer dọn dẹp (20:25)", () => {
    const existing: ShowtimeLike[] = [
      {
        id: "st-1",
        cinemaId: "beta-xuan-thuy",
        roomName: "Phòng Beta 01",
        date: "2026-10-01",
        time: "18:00",
        durationMinutes: 120, // Chiếm [18:00, 20:25)
      },
    ];

    const candidate: ShowtimeLike = {
      cinemaId: "beta-xuan-thuy",
      roomName: "Phòng Beta 01",
      date: "2026-10-01",
      time: "20:25", // Đúng phút kết thúc buffer
      durationMinutes: 90,
    };

    const result = checkShowtimeCollision(candidate, existing);
    assert.equal(result.ok, true);
    assert.equal(result.conflicts.length, 0);
  });

  runTest("2.5. Hai suất chiếu cùng giờ nhưng KHÁC phòng chiếu -> Hợp lệ hoàn toàn", () => {
    const existing: ShowtimeLike[] = [
      {
        id: "st-1",
        cinemaId: "beta-xuan-thuy",
        roomName: "Phòng Beta 01",
        date: "2026-10-01",
        time: "18:00",
        durationMinutes: 120,
      },
    ];

    const candidate: ShowtimeLike = {
      cinemaId: "beta-xuan-thuy",
      roomName: "Phòng Beta 02", // Khác phòng
      date: "2026-10-01",
      time: "18:00",
      durationMinutes: 120,
    };

    const result = checkShowtimeCollision(candidate, existing);
    assert.equal(result.ok, true);
  });

  runTest("2.6. Tự động tìm và gợi ý khung giờ trống gần nhất khi có xung đột", () => {
    const existing: ShowtimeLike[] = [
      {
        id: "st-1",
        cinemaId: "beta-xuan-thuy",
        roomName: "Phòng Beta 01",
        date: "2026-10-01",
        time: "18:00",
        durationMinutes: 120, // 18:00 -> 20:25
      },
    ];

    const candidate: ShowtimeLike = {
      cinemaId: "beta-xuan-thuy",
      roomName: "Phòng Beta 01",
      date: "2026-10-01",
      time: "18:30", // Đụng lịch
      durationMinutes: 60,
    };

    const result = checkShowtimeCollision(candidate, existing);
    assert.equal(result.ok, false);
    assert.ok(result.suggestions.length > 0, "Phải có gợi ý giờ trống");
    const suggestedTimes = result.suggestions.map((s) => s.time);
    assert.ok(suggestedTimes.includes("20:25"), "Phải có gợi ý 20:25 sau khi suất trước kết thúc");
    assert.ok(suggestedTimes.includes("16:35"), "Phải có gợi ý 16:35 trước khi suất trước bắt đầu");
  });

  console.log("");

  /* ========================================================================== */
  /* MODULE 3: CONCURRENCY CONTROL & SEAT HOLD ENGINE                          */
  /* ========================================================================== */
  console.log("--- MODULE 3: SEAT HOLD & CONCURRENCY ENGINE ---");

  const showtimeId = "st-beta-1";

  await runTest("3.1. Tranh chấp 50 request song song giữ ghế B1, B2 (Chống Overbooking)", async () => {
    type ReqResult = { success: true; holdId: string } | { success: false; code: string };
    const requests: Promise<ReqResult>[] = Array.from({ length: 50 }, () =>
      holdSeats({ showtimeId, seats: ["B1", "B2"] })
        .then((res): ReqResult => ({ success: true, holdId: res.hold.holdId }))
        .catch((err): ReqResult => ({ success: false, code: (err as BookingError).code })),
    );

    const results = await Promise.all(requests);
    const successes = results.filter((r): r is { success: true; holdId: string } => r.success);
    const conflicts = results.filter((r): r is { success: false; code: string } => !r.success && r.code === "SEAT_TAKEN");

    assert.equal(successes.length, 1, "Chỉ duy nhất 1 request thắng");
    assert.equal(conflicts.length, 49, "49 request bị chặn");
  });

  await runTest("3.2. Giữ chồng ghế một phần (Partial Collision) bị từ chối trọn gói nguyên tử", async () => {
    let rejected = false;
    try {
      await holdSeats({ showtimeId, seats: ["B2", "B3"] }); // B2 đang bị giữ
    } catch (err) {
      if (err instanceof BookingError && err.code === "SEAT_TAKEN") {
        rejected = true;
      }
    }
    assert.equal(rejected, true);
    // B3 phải còn free, không bị giữ rò rỉ
    const statuses = await getSeatStore().statuses(showtimeId, ["B3"]);
    assert.equal(statuses["B3"], "free");
  });

  await runTest("3.3. Mã đặt vé tất định (Deterministic bookingId) sinh từ SHA-256 của holdId", async () => {
    const holdRes = await holdSeats({ showtimeId, seats: ["C1", "C2"] });
    const computedBookingId = deriveBookingId(holdRes.hold.holdId);
    assert.ok(computedBookingId.startsWith("bk-"));
    assert.equal(computedBookingId.length, 15); // "bk-" + 12 ký tự hex

    // Gọi lại cùng holdId luôn sinh ra đúng bookingId đó
    const secondCallId = deriveBookingId(holdRes.hold.holdId);
    assert.equal(computedBookingId, secondCallId);
  });

  await runTest("3.4. Chặn thanh toán khi thời gian giữ ghế còn dưới 30s (HOLD_EXPIRED)", async () => {
    const store = getSeatStore();
    const holdRes = await holdSeats({ showtimeId, seats: ["D1", "D2"] });
    const shortHoldKey = `cinemax:{${showtimeId}}:hold:${holdRes.hold.holdId}`;
    const rawShortHold = await store.getHold(showtimeId, holdRes.hold.holdId);
    if (rawShortHold) {
      const expiringSoonHold = { ...rawShortHold, expiresAt: Date.now() + 15_000 };
      (store as any).data?.set(shortHoldKey, { value: JSON.stringify(expiringSoonHold), expiresAt: Date.now() + 15000 });
    }

    let blocked = false;
    try {
      await confirmBooking({
        showtimeId,
        holdId: holdRes.hold.holdId,
        seats: ["D1", "D2"],
        customer: { name: "Test Buffer", phone: "0900000000" },
        concessions: [],
        expectedTotal: 110_000,
        charge: async () => ({ ok: true, reference: "PAY-BUF" }),
        posterPath: "/poster.jpg",
      });
    } catch (err) {
      if (err instanceof BookingError && err.code === "HOLD_EXPIRED") {
        blocked = true;
      }
    }
    assert.equal(blocked, true, "Phải từ chối thanh toán khi hold < 30s");
  });

  await runTest("3.5. Nhả ghế chủ động (releaseHold) lập tức đưa ghế về trạng thái 'free'", async () => {
    const holdRes = await holdSeats({ showtimeId, seats: ["E1", "E2"] });
    const beforeRelease = await getSeatStore().statuses(showtimeId, ["E1", "E2"]);
    assert.equal(beforeRelease["E1"], "held");

    await releaseHold(showtimeId, holdRes.hold.holdId);
    const afterRelease = await getSeatStore().statuses(showtimeId, ["E1", "E2"]);
    assert.equal(afterRelease["E1"], "free");
    assert.equal(afterRelease["E2"], "free");
  });

  await runTest("3.6. Chốt vé & Idempotent Replay với cùng SĐT (trả vé cũ, replayed = true)", async () => {
    const holdRes = await holdSeats({ showtimeId, seats: ["F1", "F2"] });
    const booking1 = await confirmBooking({
      showtimeId,
      holdId: holdRes.hold.holdId,
      seats: ["F1", "F2"],
      customer: { name: "Khách VIP", phone: "0988776655", email: "vip@cinemax.vn" },
      concessions: [],
      expectedTotal: 150_000,
      charge: async () => ({ ok: true, reference: "PAY-VIP-01" }),
      posterPath: "/poster.jpg",
    });

    assert.equal(booking1.replayed, false);
    assert.equal(booking1.ticket.status, "valid");

    // Replay với cùng SĐT
    const replayRes = await confirmBooking({
      showtimeId,
      holdId: holdRes.hold.holdId,
      seats: ["F1", "F2"],
      customer: { name: "Khách VIP", phone: "0988776655" },
      concessions: [],
      charge: async () => ({ ok: true, reference: "PAY-VIP-02" }),
      posterPath: "/poster.jpg",
    });

    assert.equal(replayRes.replayed, true);
    assert.equal(replayRes.ticket.bookingId, booking1.ticket.bookingId);
  });

  await runTest("3.7. Chống đánh cắp holdId: Replay với SĐT khác bị từ chối 403 REPLAY_FORBIDDEN", async () => {
    const holdRes = await holdSeats({ showtimeId, seats: ["G1", "G2"] });
    await confirmBooking({
      showtimeId,
      holdId: holdRes.hold.holdId,
      seats: ["G1", "G2"],
      customer: { name: "Chủ Vé Thật", phone: "0911223344" },
      concessions: [],
      charge: async () => ({ ok: true, reference: "PAY-REAL" }),
      posterPath: "",
    });

    let stolenBlocked = false;
    try {
      await confirmBooking({
        showtimeId,
        holdId: holdRes.hold.holdId,
        seats: ["G1", "G2"],
        customer: { name: "Kẻ Đánh Cắp", phone: "0999888777" }, // Khác SĐT
        concessions: [],
        charge: async () => ({ ok: true, reference: "PAY-HACK" }),
        posterPath: "",
      });
    } catch (err) {
      if (err instanceof BookingError && err.code === "REPLAY_FORBIDDEN") {
        stolenBlocked = true;
      }
    }
    assert.equal(stolenBlocked, true);
  });

  await runTest("3.8. Client HoldId Idempotency: Cùng holdId gọi lại được làm mới, không bị SEAT_TAKEN", async () => {
    const customHoldId = "11223344556677889900aabbccddeeff";
    const res1 = await holdSeats({ showtimeId, seats: ["H1", "H2"], holdId: customHoldId });
    assert.equal(res1.hold.holdId, customHoldId);

    // Gọi lại với cùng holdId và cùng ghế
    const res2 = await holdSeats({ showtimeId, seats: ["H1", "H2"], holdId: customHoldId });
    assert.equal(res2.hold.holdId, customHoldId);
  });

  await runTest("3.9. Trần cứng 15 phút (MAX_HOLD_LIFETIME_MS): Tự động ném HOLD_EXPIRED và giải phóng ghế", async () => {
    const customHoldId = "ffaabb00112233445566778899aabbcc";
    await holdSeats({ showtimeId, seats: ["H3", "H4"], holdId: customHoldId });

    // Giả lập lùi createdAt về 16 phút trước
    const store = getSeatStore();
    const holdKey = `cinemax:{${showtimeId}}:hold:${customHoldId}`;
    const raw = await store.getHold(showtimeId, customHoldId);
    if (raw) {
      const tampered = { ...raw, createdAt: Date.now() - 16 * 60 * 1000 };
      (store as any).data?.set(holdKey, { value: JSON.stringify(tampered), expiresAt: Date.now() + 10000 });
    }

    let expired = false;
    try {
      await holdSeats({ showtimeId, seats: ["H3", "H4"], holdId: customHoldId });
    } catch (err) {
      if (err instanceof BookingError && err.code === "HOLD_EXPIRED") {
        expired = true;
      }
    }
    assert.equal(expired, true);

    const statuses = await store.statuses(showtimeId, ["H3", "H4"]);
    assert.equal(statuses["H3"], "free");
    assert.equal(statuses["H4"], "free");
  });

  console.log("");

  /* ========================================================================== */
  /* MODULE 4: ORPHAN SEAT RULE & SMART SEAT RECOMMENDER ENGINE                 */
  /* ========================================================================== */
  console.log("--- MODULE 4: ORPHAN SEAT RULE & SEAT RECOMMENDER ---");

  // Mock hàng ghế A: 12 ghế
  const mockRowA: Seat[] = Array.from({ length: 12 }, (_, i) => ({
    id: `A${i + 1}`,
    row: "A",
    number: i + 1,
    type: "standard",
    status: "available",
    price: 55_000,
  }));

  runTest("4.1. Phát hiện ghế mồ côi đơn độc ở đầu hàng ghế (chọn A2 bỏ trống A1)", () => {
    const selected = new Set(["A2"]);
    const check = checkOrphanSeats(mockRowA, selected);
    assert.equal(check.isValid, false);
    assert.deepEqual(check.orphanSeatIds, ["A1"]);
  });

  runTest("4.2. Phát hiện ghế mồ côi đơn độc ở cuối hàng ghế (chọn A11 bỏ trống A12)", () => {
    const selected = new Set(["A11"]);
    const check = checkOrphanSeats(mockRowA, selected);
    assert.equal(check.isValid, false);
    assert.deepEqual(check.orphanSeatIds, ["A12"]);
  });

  runTest("4.3. Phát hiện ghế mồ côi đơn độc bị kẹp giữa (chọn A4 và A6 bỏ trống A5)", () => {
    const selected = new Set(["A4", "A6"]);
    const check = checkOrphanSeats(mockRowA, selected);
    assert.equal(check.isValid, false);
    assert.deepEqual(check.orphanSeatIds, ["A5"]);
  });

  runTest("4.4. Cho phép chừa trống từ 2 ghế trở lên cho khách sau (chọn A4 và A7 chừa A5-A6)", () => {
    const selected = new Set(["A4", "A7"]);
    const check = checkOrphanSeats(mockRowA, selected);
    assert.equal(check.isValid, true);
    assert.equal(check.orphanSeatIds.length, 0);
  });

  runTest("4.5. Miễn trừ thông minh: Không phạt người dùng nếu ghế mồ côi đã có sẵn từ trước", () => {
    // Hàng có A1 đã được khách trước đặt ("booked")
    const preOccupiedRow: Seat[] = mockRowA.map((s) =>
      s.id === "A1" || s.id === "A3" ? { ...s, status: "booked" } : s,
    );
    // A2 đã bị mồ côi từ trước giữa A1 và A3. Giờ khách mới vào chọn A8, A9
    const selected = new Set(["A8", "A9"]);
    const check = checkOrphanSeats(preOccupiedRow, selected);
    assert.equal(check.isValid, true);
  });

  runTest("4.6. AI Seat Recommender: Gợi ý sweet spot trung tâm hàng E, F cho 1 người", () => {
    const rec = recommendSeats("2D Phụ Đề", 1, []);
    assert.equal(rec.seatType, "vip");
    assert.ok(["E", "F"].includes(rec.recommendedRows[0]));
    // Ghế phải nằm trong dải trung tâm 4..9
    assert.ok(rec.recommendedSeats.length === 1);
  });

  runTest("4.7. AI Seat Recommender: Ưu tiên ghế đôi Sweetbox hàng K ở cuối phòng cho 2 người", () => {
    const rec = recommendSeats("2D Phụ Đề", 2, []);
    assert.equal(rec.seatType, "couple");
    assert.equal(rec.recommendedRows[0], "K");
    // Ưu tiên K3 hoặc K4
    assert.ok(["K3", "K4"].includes(rec.recommendedSeats[0]));
  });

  console.log("");

  /* ========================================================================== */
  /* MODULE 5: TICKET SECURITY, STATE MACHINE, HMAC QR & ANTI-FRAUD SCANNER     */
  /* ========================================================================== */
  console.log("--- MODULE 5: TICKET SECURITY, HMAC & ANTI-FRAUD SCANNER ---");

  runTest("5.1. Ký số HMAC-SHA256 mã QR và xác thực tính toàn vẹn (Anti-tampering)", () => {
    const testId = "bk-secure-123456";
    const token = buildTicketToken(testId);
    assert.ok(token.startsWith(`${testId}.`));

    // Xác thực token nguyên bản -> hợp lệ
    const verified = verifyTicketToken(token);
    assert.equal(verified.valid, true);
    assert.equal(verified.bookingId, testId);

    // Kẻ gian sửa đổi chữ ký hoặc ID -> bị từ chối
    const tampered = token.slice(0, -3) + "fff";
    const fakeVerify = verifyTicketToken(tampered);
    assert.equal(fakeVerify.valid, false);
  });

  runTest("5.2. So sánh chuỗi an toàn thời gian (timingSafeEqual) chống timing attacks", () => {
    assert.equal(safeEqual("admin-secret-key-123", "admin-secret-key-123"), true);
    assert.equal(safeEqual("admin-secret-key-123", "admin-secret-key-456"), false);
    assert.equal(safeEqual("short", "very-long-string-attack"), false);
  });

  await runTest("5.3. Ticket State Machine: pending -> valid -> used", async () => {
    const ticketStore = getTicketStore();
    const testBookingId = "bk-state-machine-test";

    // 1. Tạo pending
    const created = await ticketStore.createPending({
      bookingId: testBookingId,
      customerName: "Test State",
      customerEmail: "test@cinemax.vn",
      customerPhone: "0911111111",
      seats: ["A1"],
      showDate: "2026-10-01",
      showTime: "19:00",
      format: "2D Phụ Đề",
      posterPath: "/poster.jpg",
      totalAmount: 55_000,
      movieTitle: "Test Movie",
      cinemaName: "Beta Xuân Thủy",
      roomName: "Phòng Beta 01",
      qrToken: buildTicketToken(testBookingId),
      createdAt: new Date().toISOString(),
    });
    assert.equal(created.ticket.status, "pending");

    // 2. Thử soát vé khi còn pending -> Bị từ chối
    const checkInPending = await ticketStore.markUsed(testBookingId);
    assert.equal(checkInPending.outcome, "invalid_status");

    // 3. Promote lên valid
    const promoted = await ticketStore.promotePendingToValid(testBookingId);
    assert.ok(promoted);
    assert.equal(promoted.status, "valid");

    // 4. Soát vé lần 1 -> Thành công (checked_in)
    const checkInValid = await ticketStore.markUsed(testBookingId, "STAFF-HITC-01");
    assert.equal(checkInValid.outcome, "checked_in");

    // 5. Soát vé lần 2 -> Bị chặn gian lận (already_used)
    const checkInDuplicate = await ticketStore.markUsed(testBookingId, "STAFF-HITC-02");
    assert.equal(checkInDuplicate.outcome, "already_used");
  });

  await runTest("5.4. Vô hiệu hóa vé (voidTicket) khi hoàn tiền hoặc hủy suất", async () => {
    const ticketStore = getTicketStore();
    const testVoidId = "bk-void-test";

    await ticketStore.create({
      bookingId: testVoidId,
      customerName: "Void Customer",
      customerEmail: "void@cinemax.vn",
      customerPhone: "0922222222",
      seats: ["A2"],
      showDate: "2026-10-01",
      showTime: "19:00",
      format: "2D Phụ Đề",
      posterPath: "/poster.jpg",
      totalAmount: 55_000,
      movieTitle: "Test Movie",
      cinemaName: "Beta Xuân Thủy",
      roomName: "Phòng Beta 01",
      qrToken: buildTicketToken(testVoidId),
      createdAt: new Date().toISOString(),
    });

    const voided = await ticketStore.voidTicket(testVoidId, "Khách yêu cầu hoàn vé");
    assert.ok(voided);
    assert.equal(voided.status, "void");

    // Máy quét kiểm tra vé void -> Bị từ chối
    const checkInVoid = await ticketStore.markUsed(testVoidId);
    assert.equal(checkInVoid.outcome, "invalid_status");
  });

  console.log("");

  /* ========================================================================== */
  /* MODULE 6: MOOD DETECTION, SEMANTIC RAG & AI CINEMA ASSISTANT               */
  /* ========================================================================== */
  console.log("--- MODULE 6: MOOD DETECTION & AI CINEMA ASSISTANT ---");

  runTest("6.1. Chuẩn hóa tiếng Việt bỏ dấu & lọc ký tự đặc biệt", () => {
    assert.equal(normalizeVietnamese("Tôi Rất Áp Lực & Mệt Mỏi!"), "toi rat ap luc met moi");
    assert.equal(normalizeVietnamese("Đang buồn chia tay người yêu :("), "dang buon chia tay nguoi yeu");
  });

  runTest("6.2. Phát hiện tâm trạng 'stressed' và gợi ý phim chữa lành/hài hước", () => {
    const res = detectMoodAndMovie("Tuần này deadline nhiều quá tôi đang stress và áp lực mệt mỏi", MOCK_MOVIES);
    assert.equal(res.mood, "stressed");
    assert.ok(res.confidence >= 0.6);
    assert.ok(res.matchedKeywords.length > 0);
  });

  runTest("6.3. Phát hiện tâm trạng 'sad' (buồn/thất tình) và gợi ý phim cảm động", () => {
    const res = detectMoodAndMovie("Hôm nay tôi vừa chia tay người yêu, buồn và cô đơn quá muốn khóc", MOCK_MOVIES);
    assert.equal(res.mood, "sad");
    assert.ok(res.confidence >= 0.7);
  });

  runTest("6.4. Phát hiện tâm trạng 'romantic' (hẹn hò) kèm gợi ý số lượng 2 người và suất tối", () => {
    const res = detectMoodAndMovie("Tối nay tôi muốn đi hẹn hò lãng mạn cùng bạn gái", MOCK_MOVIES);
    assert.equal(res.mood, "romantic");
    assert.equal(res.preferredPartySize, 2);
    assert.equal(res.preferredTimeSlot, "evening");
  });

  runTest("6.5. Bóc tách số lượng người xem từ câu chat tự nhiên (extractPartySize)", () => {
    assert.equal(extractPartySize("Tôi muốn đặt 2 vé xem phim"), 2);
    assert.equal(extractPartySize("Mình đi một mình thôi"), 1);
    assert.equal(extractPartySize("Đặt cho nhóm 4 người nhé"), 4);
    assert.equal(extractPartySize("Đi xem cùng người yêu"), 2);
  });

  console.log("");
  console.log("================================================================================");
  console.log(`   KẾT QUẢ: TOÀN BỘ ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!`);
  console.log("================================================================================");
}

runAllTests().catch((err) => {
  console.error("Test execution encountered an error:", err);
  process.exit(1);
});
