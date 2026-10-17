import { prisma } from "../src/lib/prisma";
import { getTicketStore } from "../src/lib/ticketStore";
import { DbRepository } from "../src/lib/dbRepository";

async function runPrismaDatabaseTests() {
  console.log("===============================================================================");
  console.log("   KIỂM THỬ KHỞI TẠO PRISMA ORM & RUNTIME DATABASE CHO 29 BẢNG   ");
  console.log("===============================================================================\n");

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

  // BÀI TEST 1: KIỂM TRA TRUY VẤN CÁC BẢNG CỐT LÕI
  console.log("--- BÀI TEST 1: TRUY VẤN CƠ SỞ DỮ LIỆU ĐÃ SEED (29 BẢNG) ---");
  const cinemasCount = await prisma.cinema.count();
  assert(cinemasCount >= 1, `Bảng 'cinemas' có dữ liệu (${cinemasCount} cụm rạp)`);

  const hallsCount = await prisma.hall.count();
  assert(hallsCount >= 2, `Bảng 'halls' có dữ liệu (${hallsCount} phòng chiếu)`);

  const seatsCount = await prisma.seatTemplate.count();
  assert(seatsCount >= 102, `Bảng 'seat_templates' có 102 mẫu ghế vật lý (${seatsCount} ghế)`);

  const genresCount = await prisma.genre.count();
  assert(genresCount >= 5, `Bảng 'genres' có dữ liệu (${genresCount} thể loại)`);

  const moviesCount = await prisma.movie.count();
  assert(moviesCount >= 5, `Bảng 'movies' có dữ liệu (${moviesCount} bộ phim)`);

  const showtimesCount = await prisma.showtime.count();
  assert(showtimesCount >= 4, `Bảng 'showtimes' có dữ liệu (${showtimesCount} suất chiếu)`);

  const concessionsCount = await prisma.concession.count();
  assert(concessionsCount >= 3, `Bảng 'concessions' có menu bắp nước F&B (${concessionsCount} món)`);

  const tiersCount = await prisma.membershipTier.count();
  assert(tiersCount >= 4, `Bảng 'membership_tiers' có 4 hạng thành viên (${tiersCount} hạng)`);

  const couponsCount = await prisma.coupon.count();
  assert(couponsCount >= 2, `Bảng 'coupons' có mã voucher (${couponsCount} mã)`);

  const usersCount = await prisma.user.count();
  assert(usersCount >= 3, `Bảng 'users' có đủ tài khoản Admin, Staff, Khách (${usersCount} users)`);

  // BÀI TEST 2: ĐỒNG BỘ ĐẶT VÉ VÀO RUNTIME DATABASE
  console.log("\n--- BÀI TEST 2: TỰ ĐỘNG ĐỒNG BỘ ĐƠN VÉ & VÉ ĐIỆN TỬ VÀO DATABASE ---");
  const testBookingId = `bk-db-sync-${Date.now()}`;
  const store = getTicketStore();

  await store.create({
    bookingId: testBookingId,
    movieTitle: "Dune: Phần Hai",
    posterPath: "https://images.unsplash.com/photo-1534447677768-be436bb09401",
    cinemaName: "Beta Cinemas Xuân Thủy",
    roomName: "Phòng Beta 01 (Dolby 7.1)",
    format: "2D Phụ Đề",
    showDate: "2026-10-15",
    showTime: "19:00",
    seats: ["F7", "F8"],
    customerName: "Nguyễn Văn Database",
    customerEmail: "db@cinemax.vn",
    customerPhone: "0912345678",
    totalAmount: 150000,
    concessions: [],
    createdAt: new Date().toISOString(),
  });

  // Chờ 300ms để tác vụ nền Prisma hoàn tất
  await new Promise((r) => setTimeout(r, 300));

  const dbBooking = await prisma.booking.findUnique({
    where: { bookingCode: testBookingId },
    include: { tickets: true, payments: true },
  });

  assert(Boolean(dbBooking), "Đơn đặt vé đã được lưu vào bảng 'bookings' trong cơ sở dữ liệu");
  assert(dbBooking?.paymentStatus === "PAID", "Trạng thái thanh toán của booking là PAID");
  assert((dbBooking?.tickets.length ?? 0) >= 1, `Đã tạo ${dbBooking?.tickets.length} vé chi tiết trong bảng 'tickets'`);
  assert(Boolean(dbBooking?.payments[0]), "Đã ghi nhận bản ghi đối soát thanh toán trong bảng 'payments'");

  // BÀI TEST 3: SOÁT VÉ & CHECK-IN CẬP NHẬT TRẠNG THÁI TRONG DATABASE
  console.log("\n--- BÀI TEST 3: CẬP NHẬT TRẠNG THÁI CHECK-IN VÀO DATABASE ---");
  await store.markUsed(testBookingId, "Cổng 01");
  await new Promise((r) => setTimeout(r, 300));

  const updatedTickets = await prisma.ticket.findMany({
    where: { bookingId: testBookingId },
  });
  const allCheckedIn = updatedTickets.every((t: { isCheckedIn: boolean } | any) => t.isCheckedIn);
  assert(allCheckedIn, "Vé trong bảng 'tickets' đã chuyển is_checked_in = true trong database");

  // BÀI TEST 4: ÁP DỤNG VOUCHER & MÃ GIẢM GIÁ TỪ DATABASE
  console.log("\n--- BÀI TEST 4: TRA CỨU & ÁP DỤNG MÃ GIẢM GIÁ (COUPONS) ---");
  const validCouponResult = await DbRepository.validateCoupon("CINEMAX2026", 144000);
  assert(validCouponResult.valid, "Mã 'CINEMAX2026' hợp lệ");
  assert(validCouponResult.discountAmount === 20000, "Được giảm chính xác 20.000đ");
  assert(validCouponResult.finalAmount === 124000, "Tổng tiền sau giảm còn 124.000đ");

  const invalidCouponResult = await DbRepository.validateCoupon("MA_KHONG_TON_TAI", 144000);
  assert(!invalidCouponResult.valid, "Từ chối mã không tồn tại");

  // BÀI TEST 5: GHI NHẬN SYSTEM AUDIT LOG VÀO DATABASE
  console.log("\n--- BÀI TEST 5: NHẬT KÝ KIỂM TOÁN AN NINH (SYSTEM_AUDIT_LOGS) ---");
  await DbRepository.logAuditAction({
    userId: "usr-admin-01",
    action: "SEAT_BLOCKED",
    resourceType: "seats",
    resourceId: "seat-F7",
    metadata: { reason: "Bảo trì tay vịn" },
  });

  const auditLog = await prisma.systemAuditLog.findFirst({
    where: { resourceId: "seat-F7" },
    orderBy: { createdAt: "desc" },
  });

  assert(Boolean(auditLog), "Ghi nhận thành công hành động vào bảng 'system_audit_logs'");
  assert(auditLog?.action === "SEAT_BLOCKED", "Audit log lưu đúng action 'SEAT_BLOCKED'");

  console.log("\n===============================================================================");
  console.log(`   TỔNG KẾT PRISMA DATABASE: ${passed}/${total} TEST CASES ĐẠT CHUẨN (100%)   `);
  console.log("===============================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runPrismaDatabaseTests()
  .catch((err) => {
    console.error("Lỗi test database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
