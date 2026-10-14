// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import {
  addReview,
  cancelAndRefundOrder,
  deleteReview,
  getAdminOrders,
  getLoyaltyByPhone,
  getReviews,
  hasPurchasedTicket,
  likeReview,
  updateReviewStatus,
  type ReviewStatus,
} from "@/lib/reviewAndLoyaltyStore";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ReviewStatus[] = ["approved", "pending", "hidden"];

async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function unauthorized() {
  return NextResponse.json(
    { error: "Bạn không có quyền thực hiện thao tác này (yêu cầu Admin)." },
    { status: 401 }
  );
}

/* ------------------------------------------------------------
 * GET /api/reviews?movieId=...
 *  - Admin: trả về { reviews (tất cả trạng thái), orders, loyaltyByPhone }
 *  - Khách: chỉ trả về review đã duyệt, orders = [] (tránh lộ SĐT / thông tin khách)
 * ------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const movieId = request.nextUrl.searchParams.get("movieId") ?? undefined;
    const movieTitle = request.nextUrl.searchParams.get("movieTitle") ?? undefined;

    if (isAdminAuthorized(request)) {
      const orders = await getAdminOrders();
      return NextResponse.json({
        reviews: getReviews(movieId, movieTitle),
        orders,
        loyaltyByPhone: getLoyaltyByPhone(orders),
      });
    }

    const publicReviews = getReviews(movieId, movieTitle)
      .filter((r) => r.status === "approved")
      .map((r) => ({ ...r, customerPhone: "" }));

    return NextResponse.json({ reviews: publicReviews, orders: [], loyaltyByPhone: {} });
  } catch (error) {
    console.error("[GET /api/reviews]", error);
    return NextResponse.json({ error: "Không thể tải dữ liệu." }, { status: 500 });
  }
}

/* ------------------------------------------------------------
 * POST /api/reviews
 *  - { action: "like", id }
 *  - { movieId?, movieTitle, customerName, customerPhone, rating, content }
 * ------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    if (!body) {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    // Thả tim
    if (body.action === "like") {
      const id = asString(body.id);
      if (!id) {
        return NextResponse.json({ error: "Thiếu mã bình luận." }, { status: 400 });
      }
      const updated = likeReview(id);
      if (!updated) {
        return NextResponse.json({ error: "Không tìm thấy bình luận." }, { status: 404 });
      }
      return NextResponse.json({ success: true, review: updated });
    }

    // Gửi đánh giá mới
    const customerPhone = asString(body.customerPhone);
    const isVerifiedBuyer = await hasPurchasedTicket(customerPhone);

    const review = addReview({
      movieId: asString(body.movieId) || undefined,
      movieTitle: asString(body.movieTitle),
      customerName: asString(body.customerName),
      customerPhone,
      rating: Number(body.rating),
      content: asString(body.content),
      isVerifiedBuyer,
    });

    return NextResponse.json(
      {
        success: true,
        review,
        message: isVerifiedBuyer
          ? "Cảm ơn bạn! Đánh giá của khách đã mua vé đã được đăng ngay."
          : "Cảm ơn bạn! Đánh giá đang chờ quản trị viên duyệt.",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể gửi đánh giá.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/* ------------------------------------------------------------
 * PUT /api/reviews  (Admin)
 *  - { action: "updateStatus", id, status }
 *  - { action: "cancelOrder", bookingId, reason? }
 * ------------------------------------------------------------ */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  try {
    const body = await readJson(request);
    if (!body) {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    if (body.action === "updateStatus") {
      const id = asString(body.id);
      const status = asString(body.status) as ReviewStatus;
      if (!id || !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Thiếu mã bình luận hoặc trạng thái sai." }, { status: 400 });
      }
      const updated = updateReviewStatus(id, status);
      if (!updated) {
        return NextResponse.json({ error: "Không tìm thấy bình luận." }, { status: 404 });
      }
      return NextResponse.json({ success: true, review: updated });
    }

    if (body.action === "cancelOrder") {
      const bookingId = asString(body.bookingId);
      if (!bookingId) {
        return NextResponse.json({ error: "Thiếu mã đặt vé." }, { status: 400 });
      }
      const result = await cancelAndRefundOrder(bookingId, asString(body.reason));
      return NextResponse.json(
        { success: result.ok, ...result, error: result.ok ? undefined : result.message },
        { status: result.ok ? 200 : 400 }
      );
    }

    return NextResponse.json({ error: "Hành động không được hỗ trợ." }, { status: 400 });
  } catch (error) {
    console.error("[PUT /api/reviews]", error);
    return NextResponse.json({ error: "Không thể xử lý yêu cầu." }, { status: 500 });
  }
}

/* ------------------------------------------------------------
 * DELETE /api/reviews?id=...  (Admin)  hoặc body { id }
 * ------------------------------------------------------------ */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  try {
    let id = request.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
      const body = await readJson(request);
      id = body ? asString(body.id) : "";
    }
    if (!id) {
      return NextResponse.json({ error: "Thiếu mã bình luận." }, { status: 400 });
    }
    const ok = deleteReview(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy bình luận." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/reviews]", error);
    return NextResponse.json({ error: "Không thể xóa bình luận." }, { status: 500 });
  }
}
