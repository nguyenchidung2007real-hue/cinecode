import { PrismaClient } from "@prisma/client";
import { MOCK_MOVIES, MOCK_SHOWTIMES, CONCESSION_COMBOS } from "../src/lib/mockData";
import { allSeatIds, seatTier } from "../src/lib/seatLayout";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================================");
  console.log("   KHỞI TẠO DỮ LIỆU SEED CHO CƠ SỞ DỮ LIỆU PRISMA RUNTIME (29 BẢNG)   ");
  console.log("===============================================================================\n");

  // 1. CỤM RẠP (cinemas)
  console.log("1. Khởi tạo Cụm rạp...");
  const cinema = await prisma.cinema.upsert({
    where: { slug: "beta-cinemas-xuan-thuy" },
    update: {},
    create: {
      id: "beta-cinemas-xuan-thuy",
      name: "Beta Cinemas Xuân Thủy",
      slug: "beta-cinemas-xuan-thuy",
      address: "Tầng 4, Tòa nhà HITC, 239 Xuân Thủy",
      district: "Cầu Giấy",
      city: "Hà Nội",
      phone: "024 7302 8885",
      amenities: JSON.stringify(["Bãi đỗ xe", "Máy lạnh", "Ghế đôi Sweetbox", "Quầy bắp nước", "Thanh toán VNPay"]),
      latitude: 21.0368,
      longitude: 105.7877,
      isActive: true,
    },
  });

  // 2. PHÒNG CHIẾU (halls)
  console.log("2. Khởi tạo Phòng chiếu...");
  const hall01 = await prisma.hall.upsert({
    where: { id: "hall-beta-01" },
    update: {},
    create: {
      id: "hall-beta-01",
      cinemaId: cinema.id,
      name: "Phòng Beta 01 (Dolby 7.1)",
      hallType: "STANDARD_2D",
      soundSystem: "Dolby Atmos 7.1",
      projectorType: "Christie 4K Laser",
      totalSeats: 102,
      rowsCount: 9,
      colsCount: 12,
      isActive: true,
    },
  });

  const hall02 = await prisma.hall.upsert({
    where: { id: "hall-beta-02" },
    update: {},
    create: {
      id: "hall-beta-02",
      cinemaId: cinema.id,
      name: "Phòng Beta 02 (Laser HD)",
      hallType: "DIGITAL_3D",
      soundSystem: "Dolby Surround 7.1",
      projectorType: "Barco Laser 2K",
      totalSeats: 102,
      rowsCount: 9,
      colsCount: 12,
      isActive: true,
    },
  });

  // 3. MẪU GHẾ CỐ ĐỊNH (seat_templates)
  console.log("3. Khởi tạo 102 Mẫu ghế vật lý cho phòng 01...");
  const seatIds = allSeatIds();
  for (const sId of seatIds) {
    const rowCode = sId.charAt(0);
    const seatNum = parseInt(sId.slice(1), 10);
    const tier = seatTier(sId); // standard, vip, couple
    const seatType = tier === "vip" ? "VIP" : tier === "couple" ? "SWEETBOX" : "STANDARD";

    await prisma.seatTemplate.upsert({
      where: {
        hallId_rowCode_seatNumber: {
          hallId: hall01.id,
          rowCode,
          seatNumber: seatNum,
        },
      },
      update: {},
      create: {
        id: `seat-${hall01.id}-${sId}`,
        hallId: hall01.id,
        rowCode,
        seatNumber: seatNum,
        seatType,
        coordX: seatNum,
        coordY: rowCode.charCodeAt(0) - 64,
        isActive: true,
      },
    });
  }

  // 4. THỂ LOẠI (genres)
  console.log("4. Khởi tạo Thể loại phim...");
  const genresData = [
    { name: "Hành Động", slug: "hanh-dong", description: "Những pha hành động kịch tính nghẹt thở" },
    { name: "Viễn Tưởng", slug: "vien-tuong", description: "Khoa học viễn tưởng, vũ trụ tương lai" },
    { name: "Hoạt Hình", slug: "hoat-hinh", description: "Phim hoạt hình phù hợp mọi lứa tuổi gia đình" },
    { name: "Kinh Dị", slug: "kinh-di", description: "Bí ẩn rùng rợn, giật gân hồi hộp" },
    { name: "Tình Cảm", slug: "tinh-cam", description: "Phim lãng mạn, cảm động về tình yêu" },
  ];
  for (const g of genresData) {
    await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
  }

  // 5. KHO PHIM (movies)
  console.log("5. Khởi tạo Kho phim từ Catalog...");
  for (const m of MOCK_MOVIES) {
    const slug = String(m.id).toLowerCase();
    const posterUrl = m.posterPath || "https://images.unsplash.com/photo-1534447677768-be436bb09401";
    const backdropUrl = m.backdropPath || posterUrl;
    const ratingAverage = m.voteAverage || 8.0;
    const ratingCount = m.voteCount || 100;

    await prisma.movie.upsert({
      where: { slug },
      update: {
        title: m.title,
        durationMin: m.durationMinutes,
        posterUrl,
        backdropUrl,
        ageRating: m.ageRating,
        ratingAverage,
        ratingCount,
      },
      create: {
        id: String(m.id),
        title: m.title,
        originalTitle: m.originalTitle || m.title,
        slug,
        overview: m.overview || "Bộ phim bom tấn hấp dẫn tại rạp.",
        posterUrl,
        backdropUrl,
        trailerYoutubeId: m.trailerYoutubeId || "Way9Dexny3w",
        durationMin: m.durationMinutes,
        releaseDate: new Date(m.releaseDate || "2026-03-01"),
        ageRating: m.ageRating,
        director: m.director || "Denis Villeneuve",
        castMembers: JSON.stringify(m.cast || ["Diễn viên nổi tiếng"]),
        ratingAverage,
        ratingCount,
        status: m.status === "now_playing" ? "NOW_SHOWING" : "COMING_SOON",
      },
    });
  }

  // 6. SUẤT CHIẾU (showtimes)
  console.log("6. Khởi tạo Lịch suất chiếu...");
  for (const st of MOCK_SHOWTIMES) {
    const hallId = st.roomName.includes("02") ? hall02.id : hall01.id;
    const movie = await prisma.movie.findFirst({ where: { id: String(st.movieId) } });
    if (!movie) continue;

    const startDateTime = new Date(`${st.date}T${st.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (movie.durationMin + 25) * 60000);

    await prisma.showtime.upsert({
      where: { id: st.id },
      update: {},
      create: {
        id: st.id,
        movieId: movie.id,
        hallId,
        startTime: startDateTime,
        endTime: endDateTime,
        format: st.format || "2D Phụ Đề",
        basePrice: 55000,
        status: "OPEN_BOOKING",
      },
    });
  }

  // 7. MENU BẮP NƯỚC (concessions)
  console.log("7. Khởi tạo Menu bắp nước F&B...");
  for (const cb of CONCESSION_COMBOS) {
    await prisma.concession.upsert({
      where: { id: cb.id },
      update: { price: cb.price },
      create: {
        id: cb.id,
        cinemaId: cinema.id,
        name: cb.name,
        category: "COMBO",
        description: cb.description,
        price: cb.price,
        imageUrl: cb.icon,
        isActive: true,
      },
    });
  }

  // 8. HẠNG THÀNH VIÊN (membership_tiers)
  console.log("8. Khởi tạo Hạng thành viên...");
  const tiers = [
    { tierName: "Đồng", minSpending: 0, pointMultiplier: 1.0, badgeColor: "#94a3b8" },
    { tierName: "Bạc", minSpending: 1000000, pointMultiplier: 1.2, badgeColor: "#cbd5e1" },
    { tierName: "Vàng", minSpending: 3000000, pointMultiplier: 1.5, badgeColor: "#facc15" },
    { tierName: "Kim Cương", minSpending: 6000000, pointMultiplier: 2.0, badgeColor: "#38bdf8" },
  ];
  for (const t of tiers) {
    await prisma.membershipTier.upsert({
      where: { tierName: t.tierName },
      update: {},
      create: t,
    });
  }

  // 9. MÃ GIẢM GIÁ / VOUCHER (coupons)
  console.log("9. Khởi tạo Kho mã giảm giá Voucher...");
  const coupons = [
    {
      code: "CINEMAX2026",
      description: "Giảm 20.000đ cho đơn hàng thanh toán qua VNPay",
      discountType: "FIXED_AMOUNT",
      discountValue: 20000,
      minOrderAmount: 100000,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      isActive: true,
    },
    {
      code: "SINHVIEN20K",
      description: "Đồng giá vé sinh viên 45.000đ tại Beta Xuân Thủy",
      discountType: "FIXED_AMOUNT",
      discountValue: 20000,
      minOrderAmount: 55000,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      isActive: true,
    },
  ];
  for (const cp of coupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: {},
      create: cp,
    });
  }

  // 10. TÀI KHOẢN HỆ THỐNG (users)
  console.log("10. Khởi tạo Tài khoản Admin, Nhân viên & Khách hàng demo...");
  const users = [
    {
      id: "usr-admin-01",
      fullName: "Nguyễn Chí Dũng (Admin)",
      email: "admin@cinemax.vn",
      phone: "0988888888",
      role: "SUPER_ADMIN",
      loyaltyPoints: 500,
      isActive: true,
    },
    {
      id: "usr-staff-nv01",
      fullName: "Nguyễn Văn A (Soát Vé)",
      email: "staff01@cinemax.vn",
      phone: "0977777771",
      role: "STAFF",
      loyaltyPoints: 0,
      isActive: true,
    },
    {
      id: "usr-cust-demo",
      fullName: "Nguyễn Hải Đăng (Khách Hàng)",
      email: "haidang@gmail.com",
      phone: "0987654321",
      role: "CUSTOMER",
      loyaltyPoints: 120,
      isActive: true,
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  console.log("\n===============================================================================");
  console.log("   SEED THÀNH CÔNG TOÀN BỘ CƠ SỞ DỮ LIỆU PRISMA RUNTIME!   ");
  console.log("===============================================================================\n");
}

main()
  .catch((e) => {
    console.error("Lỗi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
