// src/lib/reviewAndLoyaltyStore.ts
// Quản lý: Đơn đặt vé (mẫu + thực tế), Đánh giá phim, Hạng thành viên & Điểm thưởng.
// LƯU Ý: Dữ liệu đánh giá lưu in-memory (globalThis) để sống sót qua hot-reload khi dev.
// Khi lên production hãy thay bằng DB (Prisma / MongoDB / Supabase...).

import { getTicketStore } from "@/lib/ticketStore";
import type { BookingInfo } from "@/types";

/* ============================================================
 * 1. KIỂU DỮ LIỆU
 * ============================================================ */

export type OrderSource = "sample" | "real";

/** Đơn hàng hiển thị cho Admin = BookingInfo + thông tin mở rộng */
export type AdminOrder = BookingInfo & {
  combos: string[];
  paymentMethod: string;
  source: OrderSource;
};

export type ReviewStatus = "approved" | "pending" | "hidden";

export interface MovieReviewItem {
  id: string;
  movieId: string;
  movieTitle: string;
  customerName: string;
  customerPhone: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  isVerifiedBuyer: boolean;
  likesCount: number;
  status: ReviewStatus;
  createdAt: string;
}

export interface NewReviewInput {
  movieId?: string;
  movieTitle: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  content: string;
  isVerifiedBuyer?: boolean;
}

export type LoyaltyTierName = "Đồng" | "Bạc" | "Vàng" | "Kim Cương";

export interface LoyaltyInfo {
  tier: LoyaltyTierName;
  totalSpent: number;
  points: number;
  multiplier: number;
  perks: string[];
  nextTier: LoyaltyTierName | null;
  amountToNextTier: number;
  progressPercent: number;
}

export interface CancelResult {
  ok: boolean;
  message: string;
  order?: AdminOrder;
  refundAmount?: number;
}

interface StoreState {
  sampleOrders: AdminOrder[];
  registeredOrders: AdminOrder[];
  voided: Record<string, string>;
  reviews: MovieReviewItem[];
}

/* ============================================================
 * 2. TIỆN ÍCH
 * ============================================================ */

/** Chuẩn hoá SĐT: bỏ ký tự lạ, đổi +84 / 84 thành 0 */
export function normalizePhone(phone: string): string {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/** Tạo slug không dấu từ tiêu đề phim */
export function slugify(text: string): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function timeValue(value: unknown): number {
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? 0 : t;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================================================
 * 3. DỮ LIỆU MẪU
 * ============================================================ */

const MOVIE_TITLES = {
  dune: "Dune: Hành Tinh Cát - Phần 2",
  insideOut: "Inside Out 2: Những Mảnh Ghép Cảm Xúc",
  deadpool: "Deadpool & Wolverine",
  mai: "Mai",
  godzilla: "Godzilla x Kong: Đế Chế Mới",
  kungfu: "Kung Fu Panda 4",
} as const;

interface SampleOrderInput {
  bookingId: string;
  movieTitle: string;
  posterPath: string;
  cinemaName: string;
  roomName: string;
  format: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "valid" | "used" | "pending" | "void";
  voidReason?: string;
  createdAt: string;
  combos: string[];
  paymentMethod: string;
}

function makeSampleOrder(input: SampleOrderInput): AdminOrder {
  return { ...input, source: "sample" } as unknown as AdminOrder;
}

function buildSampleOrders(): AdminOrder[] {
  return [
    makeSampleOrder({
      bookingId: "CMX-261012-A1B2",
      movieTitle: MOVIE_TITLES.dune,
      posterPath: "/posters/dune-2.jpg",
      cinemaName: "CineMax Landmark 81",
      roomName: "Phòng IMAX 01",
      format: "IMAX 2D",
      showDate: "2026-10-14",
      showTime: "19:30",
      seats: ["H7", "H8"],
      totalAmount: 360000,
      customerName: "Nguyễn Văn An",
      customerEmail: "an.nguyen@example.com",
      customerPhone: "0901234567",
      status: "valid",
      createdAt: daysAgo(1, 9),
      combos: ["1x Combo Couple (1 bắp lớn + 2 nước)"],
      paymentMethod: "Ví MoMo",
    }),
    makeSampleOrder({
      bookingId: "CMX-261008-C3D4",
      movieTitle: MOVIE_TITLES.insideOut,
      posterPath: "/posters/inside-out-2.jpg",
      cinemaName: "CineMax Vincom Bà Triệu",
      roomName: "Phòng 03",
      format: "2D Phụ đề",
      showDate: "2026-10-09",
      showTime: "15:00",
      seats: ["E4", "E5", "E6"],
      totalAmount: 285000,
      customerName: "Trần Thị Bích",
      customerEmail: "bich.tran@example.com",
      customerPhone: "0912345678",
      status: "used",
      createdAt: daysAgo(5, 14),
      combos: ["2x Nước ngọt lớn", "1x Bắp caramel"],
      paymentMethod: "Thẻ ATM nội địa",
    }),
    makeSampleOrder({
      bookingId: "CMX-261010-E5F6",
      movieTitle: MOVIE_TITLES.deadpool,
      posterPath: "/posters/deadpool-wolverine.jpg",
      cinemaName: "CineMax Landmark 81",
      roomName: "Phòng 05",
      format: "4DX",
      showDate: "2026-10-13",
      showTime: "21:00",
      seats: ["C10", "C11"],
      totalAmount: 440000,
      customerName: "Lê Hoàng Nam",
      customerEmail: "nam.le@example.com",
      customerPhone: "0987654321",
      status: "valid",
      createdAt: daysAgo(2, 20),
      combos: ["1x Combo Solo (1 bắp vừa + 1 nước)"],
      paymentMethod: "Visa / Mastercard",
    }),
    makeSampleOrder({
      bookingId: "CMX-261005-G7H8",
      movieTitle: MOVIE_TITLES.mai,
      posterPath: "/posters/mai.jpg",
      cinemaName: "CineMax Vincom Bà Triệu",
      roomName: "Phòng 02",
      format: "2D",
      showDate: "2026-10-06",
      showTime: "18:00",
      seats: ["B3", "B4", "B5", "B6"],
      totalAmount: 380000,
      customerName: "Phạm Quỳnh Chi",
      customerEmail: "chi.pham@example.com",
      customerPhone: "0933445566",
      status: "used",
      createdAt: daysAgo(8, 11),
      combos: ["2x Combo Couple (1 bắp lớn + 2 nước)"],
      paymentMethod: "Ví ZaloPay",
    }),
    makeSampleOrder({
      bookingId: "CMX-261003-J9K1",
      movieTitle: MOVIE_TITLES.godzilla,
      posterPath: "/posters/godzilla-kong.jpg",
      cinemaName: "CineMax Landmark 81",
      roomName: "Phòng IMAX 01",
      format: "IMAX 3D",
      showDate: "2026-10-04",
      showTime: "20:15",
      seats: ["J12", "J13"],
      totalAmount: 400000,
      customerName: "Đỗ Minh Khang",
      customerEmail: "khang.do@example.com",
      customerPhone: "0977123456",
      status: "void",
      voidReason: "Khách đổi lịch công tác, yêu cầu hoàn vé",
      createdAt: daysAgo(9, 16),
      combos: [],
      paymentMethod: "Ví MoMo",
    }),
    makeSampleOrder({
      bookingId: "CMX-261011-L2M3",
      movieTitle: MOVIE_TITLES.kungfu,
      posterPath: "/posters/kung-fu-panda-4.jpg",
      cinemaName: "CineMax Vincom Bà Triệu",
      roomName: "Phòng 04",
      format: "2D Lồng tiếng",
      showDate: "2026-10-15",
      showTime: "10:30",
      seats: ["D5", "D6", "D7"],
      totalAmount: 255000,
      customerName: "Hoàng Thu Hà",
      customerEmail: "ha.hoang@example.com",
      customerPhone: "0366778899",
      status: "pending",
      createdAt: daysAgo(0, 8),
      combos: ["3x Bắp ngọt + nước (Combo gia đình nhỏ)"],
      paymentMethod: "Chuyển khoản QR",
    }),
    makeSampleOrder({
      bookingId: "CMX-260928-N4P5",
      movieTitle: MOVIE_TITLES.dune,
      posterPath: "/posters/dune-2.jpg",
      cinemaName: "CineMax Landmark 81",
      roomName: "Phòng IMAX 01",
      format: "IMAX 2D",
      showDate: "2026-09-29",
      showTime: "19:00",
      seats: ["G8", "G9"],
      totalAmount: 360000,
      customerName: "Nguyễn Văn An",
      customerEmail: "an.nguyen@example.com",
      customerPhone: "0901234567",
      status: "used",
      createdAt: daysAgo(14, 13),
      combos: ["1x Combo Couple (1 bắp lớn + 2 nước)"],
      paymentMethod: "Ví MoMo",
    }),
  ];
}

function buildSampleReviews(): MovieReviewItem[] {
  return [
    {
      id: "rv_sample_001",
      movieId: slugify(MOVIE_TITLES.dune),
      movieTitle: MOVIE_TITLES.dune,
      customerName: "Nguyễn Văn An",
      customerPhone: "0901234567",
      rating: 5,
      content:
        "Xem IMAX mới thấy hết độ hoành tráng của sa mạc Arrakis. Âm thanh rung cả ghế, hình ảnh đẹp từng khung hình. Đáng tiền từng đồng!",
      isVerifiedBuyer: true,
      likesCount: 42,
      status: "approved",
      createdAt: daysAgo(3, 21),
    },
    {
      id: "rv_sample_002",
      movieId: slugify(MOVIE_TITLES.insideOut),
      movieTitle: MOVIE_TITLES.insideOut,
      customerName: "Trần Thị Bích",
      customerPhone: "0912345678",
      rating: 4,
      content:
        "Phim dễ thương, đưa con đi xem bé cười suốt. Nhân vật Lo Âu rất giống mình ngoài đời. Chỉ tiếc đoạn cuối hơi vội một chút.",
      isVerifiedBuyer: true,
      likesCount: 18,
      status: "approved",
      createdAt: daysAgo(4, 18),
    },
    {
      id: "rv_sample_003",
      movieId: slugify(MOVIE_TITLES.deadpool),
      movieTitle: MOVIE_TITLES.deadpool,
      customerName: "Lê Hoàng Nam",
      customerPhone: "0987654321",
      rating: 5,
      content:
        "Phòng 4DX xem Deadpool cực đã, ghế rung và phun nước đúng lúc. Cười không nhặt được mồm, rất đáng xem cùng hội bạn!",
      isVerifiedBuyer: true,
      likesCount: 27,
      status: "approved",
      createdAt: daysAgo(1, 23),
    },
    {
      id: "rv_sample_004",
      movieId: slugify(MOVIE_TITLES.mai),
      movieTitle: MOVIE_TITLES.mai,
      customerName: "Phạm Quỳnh Chi",
      customerPhone: "0933445566",
      rating: 3,
      content:
        "Diễn xuất tốt, cảnh quay đẹp nhưng nhịp phim nửa sau hơi chậm. Mình xem xong vẫn khá cảm động, nên đi cùng người thân.",
      isVerifiedBuyer: true,
      likesCount: 9,
      status: "pending",
      createdAt: daysAgo(2, 12),
    },
    {
      id: "rv_sample_005",
      movieId: slugify(MOVIE_TITLES.godzilla),
      movieTitle: MOVIE_TITLES.godzilla,
      customerName: "Vũ Quốc Bảo",
      customerPhone: "0944111222",
      rating: 2,
      content:
        "Kịch bản khá yếu, chủ yếu là đánh nhau. Nhưng phải công nhận hiệu ứng hình ảnh khủng. Chưa mua vé ở đây nhưng xem rạp khác.",
      isVerifiedBuyer: false,
      likesCount: 3,
      status: "approved",
      createdAt: daysAgo(6, 20),
    },
    {
      id: "rv_sample_006",
      movieId: slugify(MOVIE_TITLES.kungfu),
      movieTitle: MOVIE_TITLES.kungfu,
      customerName: "Spam Bot 247",
      customerPhone: "0900000000",
      rating: 1,
      content:
        "Xem phim miễn phí tại link xxx.example, tặng ngay 500k cho thành viên mới!!! Click ngay để nhận quà.",
      isVerifiedBuyer: false,
      likesCount: 0,
      status: "hidden",
      createdAt: daysAgo(1, 3),
    },
  ];
}

/* ============================================================
 * 4. STATE TOÀN CỤC (sống sót qua hot-reload)
 * ============================================================ */

const globalRef = globalThis as typeof globalThis & {
  __cinemaxReviewLoyaltyStore?: StoreState;
};

function getState(): StoreState {
  if (!globalRef.__cinemaxReviewLoyaltyStore) {
    globalRef.__cinemaxReviewLoyaltyStore = {
      sampleOrders: buildSampleOrders(),
      registeredOrders: [],
      voided: {},
      reviews: buildSampleReviews(),
    };
  }
  return globalRef.__cinemaxReviewLoyaltyStore;
}

/* ============================================================
 * 5. ĐƠN ĐẶT VÉ
 * ============================================================ */

function normalizeOrder(booking: BookingInfo): AdminOrder {
  const extra = booking as unknown as Partial<AdminOrder>;
  return {
    ...booking,
    combos: Array.isArray(extra.combos) ? extra.combos : [],
    paymentMethod: extra.paymentMethod ?? "Không rõ",
    source: "real",
  } as AdminOrder;
}

/**
 * Cố gắng lấy danh sách vé thật từ ticketStore.
 * Do không biết chính xác tên hàm liệt kê, ta thử một số tên phổ biến.
 * Nếu không có, trả về mảng rỗng (khi đó dùng registerRealOrder để đăng ký đơn thật).
 */
async function fetchRealOrders(): Promise<BookingInfo[]> {
  try {
    const store = getTicketStore() as unknown as Record<string, unknown>;
    const candidates = [
      "listTickets",
      "getAllTickets",
      "getTickets",
      "listBookings",
      "getAllBookings",
    ];
    for (const name of candidates) {
      const fn = store[name];
      if (typeof fn === "function") {
        const result = await (fn as () => unknown).call(store);
        if (Array.isArray(result)) {
          return result as BookingInfo[];
        }
      }
    }
  } catch (error) {
    console.error("[reviewAndLoyaltyStore] Không đọc được đơn thật từ ticketStore:", error);
  }
  return [];
}

/** Gọi hàm này khi tạo đơn thật (ví dụ trong API checkout) để Admin nhìn thấy */
export function registerRealOrder(
  booking: BookingInfo,
  extra?: { combos?: string[]; paymentMethod?: string }
): void {
  const state = getState();
  const order = {
    ...normalizeOrder(booking),
    combos: extra?.combos ?? [],
    paymentMethod: extra?.paymentMethod ?? "Không rõ",
  } as AdminOrder;
  const index = state.registeredOrders.findIndex((o) => o.bookingId === order.bookingId);
  if (index >= 0) {
    state.registeredOrders[index] = order;
  } else {
    state.registeredOrders.push(order);
  }
}

/** Danh sách đơn = đơn mẫu + đơn đăng ký + đơn thật (đơn thật ghi đè đơn mẫu cùng mã) */
export async function getAdminOrders(): Promise<AdminOrder[]> {
  const state = getState();
  const merged = new Map<string, AdminOrder>();

  for (const o of state.sampleOrders) merged.set(o.bookingId, o);
  for (const o of state.registeredOrders) merged.set(o.bookingId, o);
  for (const b of await fetchRealOrders()) merged.set(b.bookingId, normalizeOrder(b));

  return Array.from(merged.values())
    .map((order) => {
      const reason = state.voided[order.bookingId];
      if (reason !== undefined) {
        return { ...order, status: "void", voidReason: reason } as AdminOrder;
      }
      return order;
    })
    .sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt));
}

/** Hủy vé & hoàn tiền: gọi ticketStore.voidTicket để giải phóng ghế */
export async function cancelAndRefundOrder(
  bookingId: string,
  reason: string
): Promise<CancelResult> {
  const finalReason = (reason ?? "").trim() || "Admin hủy vé & hoàn tiền";
  const orders = await getAdminOrders();
  const order = orders.find((o) => o.bookingId === bookingId);

  if (!order) {
    return { ok: false, message: `Không tìm thấy đơn hàng ${bookingId}.` };
  }
  if (order.status === "void") {
    return { ok: false, message: "Đơn hàng này đã được hủy trước đó." };
  }
  if (order.status === "used") {
    return { ok: false, message: "Vé đã sử dụng (đã check-in), không thể hoàn tiền." };
  }

  try {
    await getTicketStore().voidTicket(bookingId, finalReason);
  } catch (error) {
    // Đơn mẫu có thể không tồn tại trong ticketStore -> vẫn cho hủy cục bộ
    if (order.source === "real") {
      const message = error instanceof Error ? error.message : "Lỗi không xác định";
      return { ok: false, message: `Không thể hủy vé trong hệ thống: ${message}` };
    }
  }

  getState().voided[bookingId] = finalReason;

  const updated = { ...order, status: "void", voidReason: finalReason } as AdminOrder;
  return {
    ok: true,
    message: `Đã hủy vé ${bookingId} và giải phóng ghế. Hoàn ${order.totalAmount.toLocaleString("vi-VN")}đ cho khách.`,
    order: updated,
    refundAmount: order.totalAmount,
  };
}

/** Kiểm tra SĐT đã từng mua vé hợp lệ (valid / used) hay chưa */
export async function hasPurchasedTicket(phone: string): Promise<boolean> {
  const target = normalizePhone(phone);
  if (target.length < 9) return false;
  const orders = await getAdminOrders();
  return orders.some(
    (o) =>
      normalizePhone(o.customerPhone) === target &&
      (o.status === "valid" || o.status === "used")
  );
}

/* ============================================================
 * 6. HẠNG THÀNH VIÊN & ĐIỂM THƯỞNG
 * ============================================================ */

interface TierConfig {
  name: LoyaltyTierName;
  minSpent: number;
  multiplier: number;
  perks: string[];
}

const LOYALTY_TIERS: TierConfig[] = [
  {
    name: "Đồng",
    minSpent: 0,
    multiplier: 1,
    perks: ["Tích điểm 1 điểm / 10.000đ", "Quà tặng sinh nhật: 1 bắp nhỏ"],
  },
  {
    name: "Bạc",
    minSpent: 2_000_000,
    multiplier: 1.2,
    perks: [
      "Nhân 1.2 điểm thưởng",
      "Giảm 5% combo bắp nước",
      "Ưu tiên đặt vé suất chiếu sớm",
    ],
  },
  {
    name: "Vàng",
    minSpent: 5_000_000,
    multiplier: 1.5,
    perks: [
      "Nhân 1.5 điểm thưởng",
      "Giảm 10% combo bắp nước",
      "Tặng 2 vé xem phim mỗi năm",
      "Đổi / hủy vé miễn phí trước 2 giờ",
    ],
  },
  {
    name: "Kim Cương",
    minSpent: 10_000_000,
    multiplier: 2,
    perks: [
      "Nhân 2 điểm thưởng",
      "Giảm 15% combo bắp nước",
      "Tặng 4 vé xem phim mỗi năm",
      "Phòng chờ VIP & suất chiếu đặc biệt",
      "Hỗ trợ ưu tiên 24/7",
    ],
  },
];

export function calculateLoyaltyInfo(totalSpent: number): LoyaltyInfo {
  const spent = Number.isFinite(totalSpent) && totalSpent > 0 ? Math.floor(totalSpent) : 0;

  let currentIndex = 0;
  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (spent >= LOYALTY_TIERS[i].minSpent) currentIndex = i;
  }

  const current = LOYALTY_TIERS[currentIndex];
  const next = LOYALTY_TIERS[currentIndex + 1] ?? null;

  const basePoints = Math.floor(spent / 10_000);
  const points = Math.round(basePoints * current.multiplier);

  let progressPercent = 100;
  let amountToNextTier = 0;
  if (next) {
    const range = next.minSpent - current.minSpent;
    progressPercent = Math.min(100, Math.max(0, Math.round(((spent - current.minSpent) / range) * 100)));
    amountToNextTier = Math.max(0, next.minSpent - spent);
  }

  return {
    tier: current.name,
    totalSpent: spent,
    points,
    multiplier: current.multiplier,
    perks: [...current.perks],
    nextTier: next ? next.name : null,
    amountToNextTier,
    progressPercent,
  };
}

/** Gom tổng chi tiêu theo SĐT (chỉ tính đơn valid / used) rồi tính hạng */
export function getLoyaltyByPhone(orders: AdminOrder[]): Record<string, LoyaltyInfo> {
  const totals: Record<string, number> = {};
  for (const order of orders) {
    if (order.status !== "valid" && order.status !== "used") continue;
    const phone = normalizePhone(order.customerPhone);
    if (!phone) continue;
    totals[phone] = (totals[phone] ?? 0) + (Number(order.totalAmount) || 0);
  }
  const result: Record<string, LoyaltyInfo> = {};
  for (const phone of Object.keys(totals)) {
    result[phone] = calculateLoyaltyInfo(totals[phone]);
  }
  return result;
}

/* ============================================================
 * 7. ĐÁNH GIÁ & BÌNH LUẬN
 * ============================================================ */

export function getReviews(movieId?: string): MovieReviewItem[] {
  const all = getState().reviews;
  const filtered = movieId ? all.filter((r) => r.movieId === movieId) : all;
  return [...filtered].sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt));
}

export function addReview(input: NewReviewInput): MovieReviewItem {
  const movieTitle = String(input.movieTitle ?? "").trim();
  const customerName = String(input.customerName ?? "").trim();
  const customerPhone = String(input.customerPhone ?? "").trim();
  const content = String(input.content ?? "").trim();
  const rating = Number(input.rating);

  if (!movieTitle) throw new Error("Vui lòng chọn phim cần đánh giá.");
  if (!customerName) throw new Error("Vui lòng nhập tên của bạn.");
  if (normalizePhone(customerPhone).length < 9) throw new Error("Số điện thoại không hợp lệ.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Số sao phải là số nguyên từ 1 đến 5.");
  }
  if (content.length < 5) throw new Error("Nội dung đánh giá quá ngắn (tối thiểu 5 ký tự).");
  if (content.length > 1000) throw new Error("Nội dung đánh giá quá dài (tối đa 1000 ký tự).");

  const isVerifiedBuyer = Boolean(input.isVerifiedBuyer);

  const review: MovieReviewItem = {
    id: generateId("rv"),
    movieId: input.movieId?.trim() || slugify(movieTitle),
    movieTitle,
    customerName,
    customerPhone,
    rating: rating as MovieReviewItem["rating"],
    content,
    isVerifiedBuyer,
    likesCount: 0,
    // Người đã mua vé thật được duyệt tự động, còn lại chờ Admin kiểm duyệt
    status: isVerifiedBuyer ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };

  getState().reviews.unshift(review);
  return review;
}

export function likeReview(id: string): MovieReviewItem | null {
  const review = getState().reviews.find((r) => r.id === id);
  if (!review) return null;
  review.likesCount += 1;
  return review;
}

export function updateReviewStatus(id: string, status: ReviewStatus): MovieReviewItem | null {
  const review = getState().reviews.find((r) => r.id === id);
  if (!review) return null;
  review.status = status;
  return review;
}

export function deleteReview(id: string): boolean {
  const state = getState();
  const index = state.reviews.findIndex((r) => r.id === id);
  if (index < 0) return false;
  state.reviews.splice(index, 1);
  return true;
}
