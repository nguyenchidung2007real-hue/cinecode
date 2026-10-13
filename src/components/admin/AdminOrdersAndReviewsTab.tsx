"use client";

// src/components/admin/AdminOrdersAndReviewsTab.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Crown,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  MessageSquare,
  QrCode,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import type {
  AdminOrder,
  LoyaltyInfo,
  MovieReviewItem,
  ReviewStatus,
} from "@/lib/reviewAndLoyaltyStore";

/* ============================================================
 * CẤU HÌNH & HẰNG SỐ
 * ============================================================ */

type SubTab = "orders" | "reviews";
type OrderFilter = "all" | "valid" | "used" | "pending" | "void";
type ReviewFilter = "all" | ReviewStatus;

interface ToastState {
  type: "success" | "error";
  text: string;
}

const ORDER_STATUS_META: Record<string, { label: string; className: string }> = {
  valid: { label: "Hợp lệ", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  used: { label: "Đã sử dụng", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  pending: { label: "Chờ thanh toán", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  void: { label: "Đã hủy", className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; className: string }> = {
  approved: { label: "Đã duyệt", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Chờ duyệt", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  hidden: { label: "Đã ẩn", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};

const TIER_CLASS: Record<string, string> = {
  "Đồng": "text-orange-300 bg-orange-500/10 border-orange-500/30",
  "Bạc": "text-slate-200 bg-slate-400/10 border-slate-400/30",
  "Vàng": "text-yellow-300 bg-yellow-500/10 border-yellow-500/30",
  "Kim Cương": "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-white/10 bg-[#0B0C10] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500";

/* ============================================================
 * HÀM TIỆN ÍCH
 * ============================================================ */

function normalizePhone(phone: string): string {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) digits = "0" + digits.slice(2);
  return digits;
}

function formatDateTime(value: unknown): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function seatsToText(seats: unknown): string {
  return Array.isArray(seats) ? seats.join(", ") : String(seats ?? "");
}

function slugify(text: string): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? "fill-amber-400 text-amber-400" : "text-white/20"}
        />
      ))}
    </div>
  );
}

/* ============================================================
 * COMPONENT CHÍNH
 * ============================================================ */

export default function AdminOrdersAndReviewsTab() {
  const [subTab, setSubTab] = useState<SubTab>("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<MovieReviewItem[]>([]);
  const [loyaltyByPhone, setLoyaltyByPhone] = useState<Record<string, LoyaltyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Orders state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Reviews state
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  // Form viết thử bình luận
  const [formMovie, setFormMovie] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formHover, setFormHover] = useState(0);
  const [formContent, setFormContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Toast ---------------- */
  const showToast = useCallback((type: ToastState["type"], text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  /* ---------------- Tải dữ liệu ---------------- */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Nếu isAdminAuthorized của bạn dùng header (vd: x-admin-token) thì thêm vào headers ở đây.
      const res = await fetch("/api/reviews", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Không thể tải dữ liệu.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setLoyaltyByPhone(data.loyaltyByPhone ?? {});
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------- Gọi API ghi ---------------- */
  const callApi = useCallback(async (method: "POST" | "PUT" | "DELETE", body: unknown) => {
    const res = await fetch("/api/reviews", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Thao tác thất bại.");
    return data;
  }, []);

  /* ============================================================
   * ĐƠN HÀNG
   * ============================================================ */
  const filteredOrders = useMemo(() => {
    const keyword = orderSearch.trim().toLowerCase();
    const phoneKeyword = normalizePhone(orderSearch);
    return orders.filter((o) => {
      if (orderFilter !== "all" && o.status !== orderFilter) return false;
      if (!keyword) return true;
      return (
        o.bookingId.toLowerCase().includes(keyword) ||
        o.movieTitle.toLowerCase().includes(keyword) ||
        (phoneKeyword.length >= 3 && normalizePhone(o.customerPhone).includes(phoneKeyword)) ||
        o.customerName.toLowerCase().includes(keyword)
      );
    });
  }, [orders, orderSearch, orderFilter]);

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length, valid: 0, used: 0, pending: 0, void: 0 };
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }, [orders]);

  const openCancelModal = (order: AdminOrder) => {
    setCancelTarget(order);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const data = await callApi("PUT", {
        action: "cancelOrder",
        bookingId: cancelTarget.bookingId,
        reason: cancelReason,
      });
      showToast("success", data.message ?? "Đã hủy vé và hoàn tiền.");
      setCancelTarget(null);
      await loadData();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Không thể hủy vé.");
    } finally {
      setCancelling(false);
    }
  };

  /* ============================================================
   * ĐÁNH GIÁ
   * ============================================================ */
  const reviewCountsByStar = useMemo(() => {
    const counts: Record<number, number> = { 0: reviews.length, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) counts[r.rating] += 1;
    return counts;
  }, [reviews]);

  const reviewCountsByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: reviews.length, approved: 0, pending: 0, hidden: 0 };
    for (const r of reviews) counts[r.status] += 1;
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(
    () =>
      reviews.filter((r) => {
        if (ratingFilter !== 0 && r.rating !== ratingFilter) return false;
        if (reviewFilter !== "all" && r.status !== reviewFilter) return false;
        return true;
      }),
    [reviews, ratingFilter, reviewFilter]
  );

  const movieOptions = useMemo(() => {
    const titles = new Set<string>();
    for (const o of orders) titles.add(o.movieTitle);
    for (const r of reviews) titles.add(r.movieTitle);
    return Array.from(titles).sort((a, b) => a.localeCompare(b, "vi"));
  }, [orders, reviews]);

  useEffect(() => {
    if (!formMovie && movieOptions.length > 0) setFormMovie(movieOptions[0]);
  }, [movieOptions, formMovie]);

  const changeReviewStatus = async (review: MovieReviewItem, status: ReviewStatus) => {
    setBusyReviewId(review.id);
    try {
      await callApi("PUT", { action: "updateStatus", id: review.id, status });
      showToast(
        "success",
        status === "approved" ? "Đã duyệt bình luận." : "Đã ẩn bình luận vi phạm."
      );
      await loadData();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Không thể cập nhật.");
    } finally {
      setBusyReviewId(null);
    }
  };

  const removeReview = async (review: MovieReviewItem) => {
    const ok = window.confirm(
      `Xóa vĩnh viễn bình luận của "${review.customerName}"? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;
    setBusyReviewId(review.id);
    try {
      await callApi("DELETE", { id: review.id });
      showToast("success", "Đã xóa bình luận spam.");
      await loadData();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Không thể xóa.");
    } finally {
      setBusyReviewId(null);
    }
  };

  const submitTestReview = async () => {
    if (!formMovie) {
      showToast("error", "Vui lòng chọn phim.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await callApi("POST", {
        movieId: slugify(formMovie),
        movieTitle: formMovie,
        customerName: formName,
        customerPhone: formPhone,
        rating: formRating,
        content: formContent,
      });
      showToast("success", data.message ?? "Đã gửi đánh giá.");
      setFormContent("");
      await loadData();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Không thể gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <div className="space-y-6 text-white">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
              : "border-rose-500/30 bg-rose-950/90 text-rose-200"
          }`}
        >
          {toast.type === "success" ? <Check size={16} className="mt-0.5 shrink-0" /> : <X size={16} className="mt-0.5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#14151B] p-1.5">
        <button
          type="button"
          onClick={() => setSubTab("orders")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            subTab === "orders" ? "bg-rose-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Ticket size={16} />
          Quản Lý Đơn Hàng &amp; Hoàn Vé
        </button>
        <button
          type="button"
          onClick={() => setSubTab("reviews")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            subTab === "reviews" ? "bg-rose-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <MessageSquare size={16} />
          Quản Lý Đánh Giá &amp; Bình Luận Phim
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#14151B] py-12 text-white/60">
          <Loader2 size={18} className="animate-spin" /> Đang tải dữ liệu...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200">
          {loadError}{" "}
          <button type="button" onClick={loadData} className="font-semibold underline">
            Thử lại
          </button>
        </div>
      )}

      {/* ===================== TAB 1: ĐƠN HÀNG ===================== */}
      {!loading && !loadError && subTab === "orders" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Tìm theo mã đặt vé, SĐT khách hàng hoặc tên phim..."
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Tất cả"],
                  ["valid", "Hợp lệ"],
                  ["used", "Đã sử dụng"],
                  ["pending", "Chờ thanh toán"],
                  ["void", "Đã hủy"],
                ] as [OrderFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOrderFilter(key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    orderFilter === key
                      ? "border-rose-500 bg-rose-600/20 text-rose-300"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {label} ({orderCounts[key] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#14151B] py-12 text-center text-sm text-white/50">
              Không tìm thấy đơn hàng phù hợp.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredOrders.map((order) => {
                const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.pending;
                const expanded = expandedId === order.bookingId;
                const loyalty = loyaltyByPhone[normalizePhone(order.customerPhone)];
                const canCancel = order.status === "valid" || order.status === "pending";
                return (
                  <li key={order.bookingId} className="overflow-hidden rounded-xl border border-white/10 bg-[#14151B]">
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wide text-white">
                            {order.bookingId}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                          {order.source === "sample" && (
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/40">
                              Đơn mẫu
                            </span>
                          )}
                          {loyalty && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                TIER_CLASS[loyalty.tier] ?? ""
                              }`}
                              title={`${loyalty.points.toLocaleString("vi-VN")} điểm • nhân ${loyalty.multiplier}`}
                            >
                              <Crown size={11} /> {loyalty.tier}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-base font-semibold">{order.movieTitle}</p>
                        <p className="text-xs text-white/50">
                          {order.customerName} • {order.customerPhone} • {order.showTime} {order.showDate} •{" "}
                          Ghế: {seatsToText(order.seats)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                        <span className="mr-2 text-lg font-bold text-rose-400">
                          {formatVND(order.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : order.bookingId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
                        >
                          Chi tiết
                          <ChevronDown size={14} className={`transition ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                          >
                            <RotateCcw size={14} />
                            Hủy Vé &amp; Hoàn Tiền (Giải phóng ghế)
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="grid gap-4 border-t border-white/10 bg-[#0B0C10]/60 p-4 md:grid-cols-[1fr_auto]">
                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-white/40">Rạp / Phòng chiếu</dt>
                            <dd>{order.cinemaName} — {order.roomName}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Định dạng</dt>
                            <dd>{order.format}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Suất chiếu</dt>
                            <dd>{order.showTime} — {order.showDate}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Ghế đã đặt</dt>
                            <dd className="font-semibold text-white">{seatsToText(order.seats)}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-white/40">Combo bắp nước</dt>
                            <dd>
                              {order.combos && order.combos.length > 0
                                ? order.combos.join(" • ")
                                : "Không đặt combo"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Khách hàng</dt>
                            <dd>{order.customerName}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Liên hệ</dt>
                            <dd>{order.customerPhone} • {order.customerEmail}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Thanh toán</dt>
                            <dd>{order.paymentMethod}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-white/40">Thời gian đặt</dt>
                            <dd>{formatDateTime(order.createdAt)}</dd>
                          </div>
                          {loyalty && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-white/40">Hạng thành viên</dt>
                              <dd>
                                Hạng {loyalty.tier} • {loyalty.points.toLocaleString("vi-VN")} điểm (nhân {loyalty.multiplier}) • Tổng chi tiêu {formatVND(loyalty.totalSpent)}
                                {loyalty.nextTier && (
                                  <span className="text-white/50">
                                    {" "}— còn {formatVND(loyalty.amountToNextTier)} để lên hạng {loyalty.nextTier}
                                  </span>
                                )}
                              </dd>
                            </div>
                          )}
                          {order.status === "void" && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-rose-400">Lý do hủy</dt>
                              <dd className="text-rose-300">{order.voidReason || "Không có lý do"}</dd>
                            </div>
                          )}
                        </dl>

                        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(order.bookingId)}`}
                            alt={`Mã QR ${order.bookingId}`}
                            width={140}
                            height={140}
                            className={order.status === "void" ? "opacity-20" : ""}
                          />
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700">
                            <QrCode size={12} /> {order.status === "void" ? "QR đã vô hiệu" : "Quét tại cổng soát vé"}
                          </span>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* ===================== TAB 2: ĐÁNH GIÁ ===================== */}
      {!loading && !loadError && subTab === "reviews" && (
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {/* Lọc theo sao */}
            <div className="flex flex-wrap gap-2">
              {[0, 5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(star)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    ratingFilter === star
                      ? "border-rose-500 bg-rose-600/20 text-rose-300"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {star === 0 ? (
                    "Tất cả sao"
                  ) : (
                    <>
                      {star} <Star size={12} className="fill-amber-400 text-amber-400" />
                    </>
                  )}
                  <span className="text-white/40">({reviewCountsByStar[star] ?? 0})</span>
                </button>
              ))}
            </div>

            {/* Lọc theo trạng thái */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Tất cả trạng thái"],
                  ["approved", "Đã duyệt"],
                  ["pending", "Chờ duyệt"],
                  ["hidden", "Đã ẩn"],
                ] as [ReviewFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReviewFilter(key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    reviewFilter === key
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  {label} ({reviewCountsByStatus[key] ?? 0})
                </button>
              ))}
            </div>

            {filteredReviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#14151B] py-12 text-center text-sm text-white/50">
                Không có bình luận nào phù hợp bộ lọc.
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredReviews.map((review) => {
                  const meta = REVIEW_STATUS_META[review.status];
                  const busy = busyReviewId === review.id;
                  return (
                    <li key={review.id} className="rounded-xl border border-white/10 bg-[#14151B] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{review.customerName}</span>
                            {review.isVerifiedBuyer && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                                <ShieldCheck size={12} /> ✔️ Đã mua vé thật (Verified Buyer)
                              </span>
                            )}
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-white/50">
                            {review.movieTitle} • {review.customerPhone} • {formatDateTime(review.createdAt)}
                          </p>
                        </div>
                        <Stars value={review.rating} />
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">
                        {review.content}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-white/50">
                          <Heart size={14} className="text-rose-400" /> {review.likesCount} lượt thích
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {review.status !== "approved" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => changeReviewStatus(review, "approved")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <Eye size={14} /> Duyệt
                            </button>
                          )}
                          {review.status !== "hidden" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => changeReviewStatus(review, "hidden")}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-50"
                            >
                              <EyeOff size={14} /> Ẩn
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeReview(review)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Xóa spam
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Form viết thử bình luận */}
          <aside className="h-fit space-y-3 rounded-xl border border-white/10 bg-[#14151B] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Send size={16} className="text-rose-400" /> Viết thử bình luận mới
            </h3>
            <p className="text-xs text-white/50">
              Nếu SĐT trùng với đơn đã mua vé, hệ thống tự gắn nhãn Verified Buyer và duyệt luôn.
            </p>

            <div>
              <label className="mb-1 block text-xs text-white/50">Phim</label>
              <select
                value={formMovie}
                onChange={(e) => setFormMovie(e.target.value)}
                className={INPUT_CLASS}
              >
                {movieOptions.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Tên khán giả</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Số điện thoại</label>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="0901234567"
                inputMode="tel"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Số sao</label>
              <div className="flex gap-1" onMouseLeave={() => setFormHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormRating(n)}
                    onMouseEnter={() => setFormHover(n)}
                    aria-label={`${n} sao`}
                  >
                    <Star
                      size={26}
                      className={
                        n <= (formHover || formRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-white/20"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Nội dung</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                className={`${INPUT_CLASS} resize-none`}
              />
              <p className="mt-1 text-right text-[11px] text-white/30">{formContent.length}/1000</p>
            </div>

            <button
              type="button"
              onClick={submitTestReview}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Gửi đánh giá
            </button>
          </aside>
        </section>
      )}

      {/* ===================== MODAL HỦY VÉ ===================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#14151B] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Hủy vé &amp; hoàn tiền</h3>
                <p className="mt-1 text-sm text-white/60">
                  Mã vé <span className="font-mono text-white">{cancelTarget.bookingId}</span> —{" "}
                  {cancelTarget.movieTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !cancelling && setCancelTarget(null)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0B0C10] p-3 text-sm">
              <p>
                Ghế sẽ được giải phóng:{" "}
                <span className="font-semibold">{seatsToText(cancelTarget.seats)}</span>
              </p>
              <p className="mt-1">
                Số tiền hoàn lại:{" "}
                <span className="font-bold text-rose-400">{formatVND(cancelTarget.totalAmount)}</span>
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Lý do hủy (tùy chọn)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="VD: Khách yêu cầu hoàn vé do thay đổi lịch..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-50"
              >
                Giữ lại vé
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={confirmCancel}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {cancelling ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Xác nhận hủy &amp; hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
