import { prisma } from "@/lib/prisma";
import type { TicketRecord } from "@/lib/ticketStore";

/**
 * CineMax AI - Database Repository & Runtime Bridge
 * Cầu nối Runtime đồng bộ dữ liệu vào 29 bảng Prisma ORM
 */

export class DbRepository {
  /**
   * Đồng bộ hóa đơn và vé vào bảng bookings & tickets trong cơ sở dữ liệu
   */
  static async syncTicketToDatabase(ticket: TicketRecord): Promise<void> {
    try {
      // 1. Tìm hoặc tạo user theo số điện thoại (upsert an toàn concurrency)
      const phone = ticket.customerPhone?.trim() || "0987654321";
      const user = await prisma.user.upsert({
        where: { phone },
        update: {
          fullName: ticket.customerName || undefined,
        },
        create: {
          fullName: ticket.customerName || "Khách Hàng CineMax",
          email: `cust-${phone}@cinemax.vn`,
          phone,
          role: "CUSTOMER",
          loyaltyPoints: Math.floor((ticket.totalAmount || 0) / 1000),
        },
      });

      // 2. Tìm showtime tương ứng hoặc lấy showtime đầu tiên
      let showtime = await prisma.showtime.findFirst({
        where: { id: ticket.showtimeId || "st-dune-01" },
      });

      if (!showtime) {
        showtime = await prisma.showtime.findFirst();
      }

      if (!showtime) return;

      // 3. Lưu hoặc cập nhật Booking
      const paymentStatus =
        ticket.status === "valid" || ticket.status === "used"
          ? "PAID"
          : ticket.status === "void"
          ? "REFUNDED"
          : "PENDING";

      const booking = await prisma.booking.upsert({
        where: { bookingCode: ticket.bookingId },
        update: {
          totalAmount: ticket.totalAmount,
          finalAmount: ticket.totalAmount,
          paymentStatus,
          customerNotes: `Khách: ${ticket.customerName} - SĐT: ${ticket.customerPhone}`,
        },
        create: {
          id: ticket.bookingId,
          bookingCode: ticket.bookingId,
          userId: user.id,
          showtimeId: showtime.id,
          totalAmount: ticket.totalAmount,
          finalAmount: ticket.totalAmount,
          paymentStatus,
          idempotencyKey: `idemp-${ticket.bookingId}`,
          customerNotes: `Khách: ${ticket.customerName} - SĐT: ${ticket.customerPhone}`,
        },
      });

      // 4. Lưu hoặc cập nhật vé chi tiết từng ghế
      for (const seatName of ticket.seats || []) {
        const ticketCode = `TK-${ticket.bookingId}-${seatName}`;

        // Tìm seat template tương ứng
        const seatTemplate = await prisma.seatTemplate.findFirst({
          where: {
            rowCode: seatName.charAt(0),
            seatNumber: parseInt(seatName.slice(1), 10) || 1,
          },
        });

        if (seatTemplate) {
          // Tạo showtime seat nếu chưa có
          const showtimeSeat = await prisma.showtimeSeat.upsert({
            where: {
              showtimeId_seatTemplateId: {
                showtimeId: showtime.id,
                seatTemplateId: seatTemplate.id,
              },
            },
            update: {
              status: ticket.status === "valid" ? "BOOKED" : ticket.status === "used" ? "BOOKED" : "AVAILABLE",
            },
            create: {
              showtimeId: showtime.id,
              seatTemplateId: seatTemplate.id,
              status: "BOOKED",
              price: ticket.totalAmount / (ticket.seats.length || 1),
            },
          });

          // Lưu vé điện tử theo showtimeSeatId (quan hệ 1:1 duy nhất với ghế suất chiếu)
          await prisma.ticket.upsert({
            where: { showtimeSeatId: showtimeSeat.id },
            update: {
              bookingId: booking.id,
              ticketCode,
              isCheckedIn: ticket.status === "used",
              checkedInAt: ticket.usedAt ? new Date(ticket.usedAt) : null,
            },
            create: {
              bookingId: booking.id,
              showtimeSeatId: showtimeSeat.id,
              ticketCode,
              qrCodePayload: `CINEMAX:${ticket.bookingId}:${seatName}`,
              isCheckedIn: ticket.status === "used",
              checkedInAt: ticket.usedAt ? new Date(ticket.usedAt) : null,
            },
          });
        }
      }

      // 5. Nếu vé thành công -> Lưu giao dịch thanh toán
      if (ticket.status === "valid" || ticket.status === "used") {
        await prisma.payment.upsert({
          where: { id: `pay-${ticket.bookingId}` },
          update: { status: "SUCCESS" },
          create: {
            id: `pay-${ticket.bookingId}`,
            bookingId: booking.id,
            gateway: "VNPAY",
            gatewayTransactionId: ticket.lastTxnRef || `txn-${Date.now()}`,
            amount: ticket.totalAmount,
            status: "SUCCESS",
            currency: "VND",
          },
        });
      }
    } catch (error) {
      console.warn("[DbRepository.syncTicketToDatabase] Không thể đồng bộ Prisma (sử dụng in-memory fallback):", error);
    }
  }

  /**
   * Tra cứu thông tin Voucher & kiểm tra điều kiện áp dụng
   */
  static async validateCoupon(code: string, orderAmount: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return { valid: false, message: "Mã giảm giá không tồn tại hoặc đã bị khóa." };
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return { valid: false, message: "Mã giảm giá đã hết hạn sử dụng." };
    }

    if (orderAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderAmount.toLocaleString("vi-VN")}đ để dùng mã này.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === "FIXED_AMOUNT") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "PERCENTAGE") {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.min(discount, orderAmount),
      finalAmount: Math.max(0, orderAmount - discount),
    };
  }

  /**
   * Ghi nhận Audit Log an ninh hệ thống
   */
  static async logAuditAction(params: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    ipAddress?: string;
    metadata?: any;
  }) {
    try {
      await prisma.systemAuditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          ipAddress: params.ipAddress,
          metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        },
      });
    } catch (err) {
      console.warn("[DbRepository.logAuditAction] Lỗi ghi audit:", err);
    }
  }

  /**
   * Lấy danh sách phim từ Database
   */
  static async getMovies() {
    return prisma.movie.findMany({
      orderBy: { ratingAverage: "desc" },
    });
  }

  /**
   * Lấy danh sách suất chiếu
   */
  static async getShowtimes() {
    return prisma.showtime.findMany({
      include: {
        movie: true,
        hall: {
          include: { cinema: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }
}
