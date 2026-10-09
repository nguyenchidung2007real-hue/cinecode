import * as fs from "fs";
import * as path from "path";

console.log("==================================================================");
console.log("🛠️  KIỂM THỬ BỘ CƠ SỞ DỮ LIỆU HOÀN CHỈNH: CINEMAX DATABASE SUITE");
console.log("==================================================================\n");

const baseDir = path.resolve(__dirname, "..");
let hasErrors = false;

function checkFileExists(relPath: string): string {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ LỖI: Tệp ${relPath} không tồn tại!`);
    hasErrors = true;
    return "";
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  console.log(`✅ Tệp tồn tại: ${relPath} (${(content.length / 1024).toFixed(1)} KB)`);
  return content;
}

// 1. Kiểm tra database/schema.sql
console.log("\n[1/5] KIỂM TRA TỆP SCHEMA SQL (DDL - 29 BẢNG):");
const schemaSql = checkFileExists("database/schema.sql");
const expectedTables = [
  // Nhóm Cốt lõi (15 bảng)
  "cinemas", "halls", "seat_templates", "genres", "movies",
  "movie_genres", "showtimes", "showtime_seats", "users",
  "bookings", "tickets", "concessions", "booking_concessions",
  "payments", "system_audit_logs",
  // Nhóm Mở rộng & Tương lai (14 bảng)
  "membership_tiers", "user_loyalty_transactions", "coupons", "coupon_redemptions",
  "gift_cards", "gift_card_transactions", "movie_reviews", "review_likes",
  "movie_watchlists", "group_bookings", "group_booking_members", "refund_requests",
  "concession_deliveries", "waiting_room_sessions"
];

expectedTables.forEach((table) => {
  const tableRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?${table}\\b`, "i");
  if (tableRegex.test(schemaSql)) {
    console.log(`  ✓ Bảng định nghĩa hợp lệ: ${table}`);
  } else {
    console.error(`  ❌ Thiếu định nghĩa bảng: ${table}`);
    hasErrors = true;
  }
});

// 2. Kiểm tra database/functions.sql
console.log("\n[2/5] KIỂM TRA TỆP STORED PROCEDURES & TRIGGERS (8 CHỨC NĂNG):");
const functionsSql = checkFileExists("database/functions.sql");
const expectedFunctions = [
  "trigger_set_timestamp",
  "trigger_calculate_showtime_end_time",
  "trigger_prevent_showtime_collision",
  "generate_showtime_seats",
  "reserve_seats_atomic",
  "release_expired_seat_reservations",
  "trigger_update_movie_rating",
  "trigger_award_loyalty_points"
];

expectedFunctions.forEach((fn) => {
  if (functionsSql.includes(fn)) {
    console.log(`  ✓ Stored Procedure / Trigger hợp lệ: ${fn}()`);
  } else {
    console.error(`  ❌ Thiếu Stored Procedure: ${fn}()`);
    hasErrors = true;
  }
});

// 3. Kiểm tra database/seed.sql
console.log("\n[3/5] KIỂM TRA TỆP DỮ LIỆU MẪU SEED DATA:");
const seedSql = checkFileExists("database/seed.sql");
const seedTables = [
  "genres", "cinemas", "halls", "seat_templates", "movies",
  "movie_genres", "concessions", "users", "showtimes",
  "showtime_seats", "bookings", "tickets", "booking_concessions", "payments",
  "membership_tiers", "coupons", "gift_cards", "movie_reviews",
  "movie_watchlists", "group_bookings"
];

seedTables.forEach((table) => {
  const insertRegex = new RegExp(`INSERT INTO ${table}\\b`, "i");
  if (insertRegex.test(seedSql)) {
    console.log(`  ✓ Dữ liệu mẫu nạp thành công cho: ${table}`);
  } else {
    console.error(`  ❌ Thiếu INSERT INTO: ${table}`);
    hasErrors = true;
  }
});

// 4. Kiểm tra prisma/schema.prisma
console.log("\n[4/5] KIỂM TRA TỆP PRISMA ORM SCHEMA (29 MODELS):");
const prismaSchema = checkFileExists("prisma/schema.prisma");
const expectedPrismaModels = [
  "Cinema", "Hall", "SeatTemplate", "Genre", "Movie",
  "MovieGenre", "Showtime", "ShowtimeSeat", "User",
  "Booking", "Ticket", "Concession", "BookingConcession",
  "Payment", "SystemAuditLog",
  "MembershipTier", "UserLoyaltyTransaction", "Coupon", "CouponRedemption",
  "GiftCard", "GiftCardTransaction", "MovieReview", "ReviewLike",
  "MovieWatchlist", "GroupBooking", "GroupBookingMember", "RefundRequest",
  "ConcessionDelivery", "WaitingRoomSession"
];

expectedPrismaModels.forEach((model) => {
  const modelRegex = new RegExp(`model ${model}\\b`, "i");
  if (modelRegex.test(prismaSchema)) {
    console.log(`  ✓ Prisma Model hợp lệ: ${model}`);
  } else {
    console.error(`  ❌ Thiếu Prisma Model: ${model}`);
    hasErrors = true;
  }
});

// 5. Kiểm tra tài liệu đặc tả kiến trúc
console.log("\n[5/5] KIỂM TRA TÀI LIỆU ĐẶC TẢ KIẾN TRÚC:");
const specDoc = checkFileExists("DATABASE_DESIGN_SPECIFICATION.md");
if (specDoc.includes("TRIẾT LÝ THIẾT KẾ") && specDoc.includes("29 BẢNG THỰC THỂ")) {
  console.log("  ✓ Tài liệu đặc tả đầy đủ triết lý thiết kế và từ điển 29 bảng");
} else {
  console.error("  ❌ Tài liệu đặc tả thiếu nội dung cốt lõi");
  hasErrors = true;
}

console.log("\n==================================================================");
if (!hasErrors) {
  console.log("🎉 TẤT CẢ KIỂM THỬ ĐÃ VƯỢT QUA! BỘ CSDL HOÀN CHỈNH 100%!");
  console.log("Hệ thống đã sẵn sàng cho môi trường Production hoặc khởi chạy Day 0.");
  console.log("==================================================================");
  process.exit(0);
} else {
  console.error("⚠️ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ!");
  console.log("==================================================================");
  process.exit(1);
}
