# 🤖 BỘ 3 MASTER PROMPT DÀNH RIÊNG CHO CLAUDE FREE (ĐĂNG - TUẤN - MINH)
> **Đặc điểm thiết kế:**
> 1. **Tự chứa 100% ngữ cảnh (Self-Contained)**: Đã nhúng sẵn cấu trúc dự án, kiểu dữ liệu TypeScript và hàm có sẵn. **Claude bản Free KHÔNG CẦN đọc file từ máy tính** vẫn viết ra code chính xác 100%, không lỗi đỏ.
> 2. **Tách file độc lập (Zero Git Conflict)**: Mỗi bạn tạo các file module riêng của mình (`src/lib/...`, `src/app/api/...`, `src/components/admin/...`), đảm bảo khi cả 3 người cùng tạo Pull Request merge vào `main` sẽ **không bao giờ bị đụng code (Conflict) với nhau**.

---

## 👤 MASTER PROMPT 1: GỬI CHO NGUYỄN HẢI ĐĂNG
*(Nhánh Git: `feat/dang-seats-movies-audit` — Quản lý Sơ đồ Ghế Admin + Quản lý Phim & Thùng rác + Nhật ký An ninh)*

```text
Bạn là Senior Fullstack Developer chuyên về Next.js 14 (App Router), TypeScript và Tailwind CSS.
Tôi đang làm việc trong nhóm phát triển dự án "CineMax AI" (Web đặt vé xem phim). Do tôi dùng Claude bản Free không tải toàn bộ source code lên được, dưới đây là toàn bộ thông tin cấu trúc có sẵn trong dự án của tôi:

1. CÁC HÀM & KIỂU DỮ LIỆU ĐÃ CÓ SẴN TRONG DỰ ÁN (Chỉ việc import và dùng, KHÔNG cần tạo lại):
- Trong `@/types`:
  export interface Movie {
    id: string | number; title: string; originalTitle?: string; overview: string;
    posterPath: string; backdropPath: string; releaseDate: string; voteAverage: number;
    voteCount: number; genres: string[]; durationMinutes: number; director: string;
    cast: string[]; trailerYoutubeId: string; ageRating: string;
    status: "now_playing" | "upcoming" | "trending";
  }
- Trong `@/lib/mockData`: đã export sẵn `MOCK_MOVIES: Movie[]` và `MOCK_SHOWTIMES`.
- Trong `@/lib/seatLayout`: đã export `SEAT_ROWS = ["A","B","C","D","E","F","G","H","K"]`, `SEATS_PER_ROW = 12`, `COUPLE_SEATS_COUNT = 6`, `allSeatIds(): string[]`, `seatTier(seatId: string): "standard" | "vip" | "couple"`.
- Trong `@/lib/seatStore`: đã export `getSeatStore()` có hàm `statuses(showtimeId, seatIds)` và `release(showtimeId, holdId)`.
- Trong `@/lib/adminAuth`: đã export `isAdminAuthorized(request: NextRequest): boolean`.
- Thư viện icon đã cài sẵn: `lucide-react`. Giao diện dùng Tailwind CSS tông màu tối (`bg-[#0B0C10]`, card `bg-[#14151B]`, viền `border-white/10`, nút chính màu đỏ `bg-rose-600`).

2. NHIỆM VỤ ĐƯỢC GIAO CỦA TÔI (NGUYỄN HẢI ĐĂNG):
Hãy viết ĐẦY ĐỦ MÃ NGUỒN (Full code từ dòng đầu đến dòng cuối, không viết tắt `// ...`) cho 3 file mới độc lập sau đây để tôi copy dán vào VS Code và merge vào nhánh main:

- FILE 1: `src/lib/adminSeatAndMovieStore.ts`
  + Quản lý Sơ đồ Ghế Admin theo phòng chiếu & suất chiếu:
    - Lưu danh sách ghế bị khóa bảo trì (`blockedSeats`: Map theo phòng/suất chiếu kèm lý do bảo trì như "Hỏng tay vịn", "Bảo trì đệm ghế", "Ghế khách mời VIP").
    - Cho phép Admin đổi hạng ghế linh hoạt (`customSeatTiers`: đổi ghế giữa "standard", "vip", "couple") và thu hồi/giải phóng ghế đang bị giữ treo (`forceReleaseSeat`).
  + Quản lý Phim & Thùng rác phim (Khởi tạo từ `MOCK_MOVIES`, hỗ trợ Thêm phim, Sửa phim, Xóa mềm vào thùng rác, Khôi phục, Xóa vĩnh viễn).
  + Quản lý Nhật ký an ninh (`AuditLogItem`: tự động ghi log mỗi khi Admin khóa/mở khóa ghế, đổi hạng ghế, thêm/sửa/xóa phim).

- FILE 2: `src/app/api/admin/seats-and-movies/route.ts`
  + Next.js App Router API (`GET`, `POST`, `PUT`, `DELETE`), kiểm tra `isAdminAuthorized(request)`.
  + Hỗ trợ đầy đủ các action cho Admin:
    1. Lấy trạng thái sơ đồ 102 ghế của một suất chiếu (kết hợp `getSeatStore().statuses` và danh sách ghế bị khóa bảo trì `blockedSeats`).
    2. Khóa ghế bảo trì (`block_seat`) / Mở khóa ghế (`unblock_seat`) / Giải phóng ghế bị treo (`force_release`) / Đổi hạng ghế (`change_tier`).
    3. Thêm, sửa, xóa mềm vào thùng rác, khôi phục và xóa vĩnh viễn phim.

- FILE 3: `src/components/admin/AdminSeatsMoviesAuditTab.tsx`
  + Component React `"use client"` hoàn chỉnh có 3 sub-tabs:
    1. "Quản Lý Sơ Đồ Ghế & Bảo Trì Phòng Chiếu":
       - Chọn Phòng chiếu & Suất chiếu.
       - Vẽ trực quan ma trận 102 ghế (Hàng A-H 12 ghế, Hàng K 6 ghế đôi) với màu sắc rõ ràng: Trống (xám), Đang giữ 300s (vàng), Đã bán (đỏ), Đang khóa bảo trì (tím/đen có icon cờ lê).
       - Khi Admin click vào 1 hoặc nhiều ghế: Mở bảng điều khiển cho phép "Khóa ghế bảo trì (nhập lý do)", "Mở khóa ghế", "Giải phóng ghế đang giữ (Force Release)", hoặc "Đổi hạng ghế (Standard / VIP / Sweetbox)".
       - Thống kê nhanh: Tổng số ghế, Ghế trống, Ghế đã bán, Ghế đang giữ, Ghế đang bảo trì.
    2. "Quản Lý Phim & Thùng Rác": Tìm kiếm, lọc, phân trang, Thêm/Sửa phim, chuyển vào Thùng rác và Khôi phục.
    3. "Nhật Ký An Ninh (Audit Logs)": Bảng lịch sử mọi thao tác khóa ghế, sửa phim của Admin.

Hãy xuất rõ ràng từng khối code với tiêu đề đường dẫn file ở trên để tôi copy tạo file ngay!
```

---

## 👤 MASTER PROMPT 2: GỬI CHO NGUYỄN VĂN TUẤN
*(Nhánh Git: `feat/tuan-vouchers-and-fnb` — Quản lý Voucher + Bắp nước F&B + Giao tận ghế)*

```text
Bạn là Senior Fullstack Developer chuyên về Next.js 14 (App Router), TypeScript và Tailwind CSS.
Tôi đang làm việc trong nhóm phát triển dự án "CineMax AI" (Web đặt vé xem phim). Do tôi dùng Claude bản Free không tải toàn bộ source code lên được, dưới đây là toàn bộ thông tin cấu trúc có sẵn trong dự án của tôi:

1. CÁC HÀM & KIỂU DỮ LIỆU ĐÃ CÓ SẴN TRONG DỰ ÁN (Chỉ việc import và dùng, KHÔNG cần tạo lại):
- Trong `@/lib/utils`: đã export hàm `formatVND(amount: number): string` (ví dụ `75000` -> `"75.000 ₫"`).
- Trong `@/lib/adminAuth`: đã export sẵn hàm `isAdminAuthorized(request: NextRequest): boolean`.
- Trong `@/lib/mockData`: đã export mảng `CONCESSION_COMBOS` có kiểu:
  `{ id: string; name: string; description: string; price: number; icon: string; badge?: string }`
- Thư viện icon đã cài sẵn: `lucide-react`. Giao diện dùng Tailwind CSS tông màu tối sang trọng (`bg-[#0B0C10]`, card `bg-[#14151B]`, viền `border-white/10`, nút chính màu đỏ `bg-rose-600`).

2. NHIỆM VỤ ĐƯỢC GIAO CỦA TÔI (NGUYỄN VĂN TUẤN):
Hãy viết ĐẦY ĐỦ MÃ NGUỒN (Full code từ dòng đầu đến dòng cuối, không viết tắt `// ...`) cho 3 file mới độc lập sau đây để tôi copy dán vào VS Code và merge vào nhánh main:

- FILE 1: `src/lib/voucherAndFnbStore.ts`
  + Quản lý danh sách Mã giảm giá Voucher (`VoucherItem`: id, code, description, discountType: "PERCENTAGE" | "FIXED", discountValue, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, startDate, endDate, isActive) với 4 mã mẫu có sẵn: `SINHVIEN20` (giảm 20% tối đa 40k), `BETA50K` (giảm 50k cho đơn từ 150k), `CINEMAX2026` (giảm 30k), `COMBO15` (giảm 15%).
  + Quản lý danh sách Combo Bắp nước F&B (`FnbComboItem`: kế thừa `CONCESSION_COMBOS`, thêm `inStock: boolean`, `allowAtSeatDelivery: boolean`, `popcornFlavors: string[]`).
  + Các hàm: `getVouchers()`, `createVoucher()`, `updateVoucher()`, `deleteVoucher()`, `validateAndApplyVoucher(code: string, orderAmount: number)` (kiểm tra mã tồn tại, đang active, còn hạn, đủ đơn tối thiểu, còn lượt dùng -> trả về số tiền được giảm `discountAmount` và `finalAmount`), `getFnbItems()`, `addFnbItem()`, `updateFnbItem()`, `deleteFnbItem()`.

- FILE 2: `src/app/api/vouchers/route.ts`
  + Next.js App Router API (`GET`, `POST`, `PUT`, `DELETE`).
  + `GET`: trả về danh sách `{ vouchers, fnbItems }`.
  + `POST`: nếu body có `action === "apply"` thì gọi `validateAndApplyVoucher(code, orderAmount)` cho khách hàng áp mã giảm giá khi mua vé; nếu là Admin (`isAdminAuthorized`) thì cho phép thêm mới Voucher hoặc thêm mới Combo Bắp nước.
  + `PUT` & `DELETE`: cho phép Admin sửa / bật tắt trạng thái kích hoạt / xóa Voucher hoặc bật tắt "Còn hàng / Tạm hết hàng" của Combo Bắp nước.

- FILE 3: `src/components/admin/AdminVouchersAndFnbTab.tsx`
  + Component React `"use client"` hoàn chỉnh có 2 sub-tabs:
    1. "Quản Lý Mã Giảm Giá (Voucher)": Tìm kiếm theo mã code, lọc trạng thái, bảng danh sách Voucher hiển thị số lượt đã dùng / giới hạn, nút Bật/Tắt nhanh, nút Xóa, Form thêm mới Voucher và Khu vực "Test thử áp dụng mã giảm giá" trực quan.
    2. "Quản Lý Bắp Nước (F&B & Giao Tận Ghế)": Danh sách các combo bắp nước, nút gạt Bật/Tắt "Còn hàng / Tạm hết hàng", bật/tắt hỗ trợ "Giao bắp nước tận ghế ngồi (At-Seat Delivery)", Form thêm mới / chỉnh sửa giá combo bắp nước.

Hãy xuất rõ ràng từng khối code với tiêu đề đường dẫn file ở trên để tôi copy tạo file ngay!
```

---

## 👤 MASTER PROMPT 3: GỬI CHO ĐÀO DUY MINH
*(Nhánh Git: `feat/minh-orders-and-reviews` — Quản lý Đơn vé & Hoàn tiền + Đánh giá Phim & Hạng Thành Viên)*

```text
Bạn là Senior Fullstack Developer chuyên về Next.js 14 (App Router), TypeScript và Tailwind CSS.
Tôi đang làm việc trong nhóm phát triển dự án "CineMax AI" (Web đặt vé xem phim). Do tôi dùng Claude bản Free không tải toàn bộ source code lên được, dưới đây là toàn bộ thông tin cấu trúc có sẵn trong dự án của tôi:

1. CÁC HÀM & KIỂU DỮ LIỆU ĐÃ CÓ SẴN TRONG DỰ ÁN (Chỉ việc import và dùng, KHÔNG cần tạo lại):
- Trong `@/lib/utils`: đã export hàm `formatVND(amount: number): string`.
- Trong `@/lib/adminAuth`: đã export sẵn hàm `isAdminAuthorized(request: NextRequest): boolean`.
- Trong `@/lib/ticketStore`: đã export hàm `getTicketStore()` (có phương thức `await getTicketStore().voidTicket(bookingId, reason)`).
- Trong `@/types`: đã export `BookingInfo` (gồm `bookingId, movieTitle, posterPath, cinemaName, roomName, format, showDate, showTime, seats, totalAmount, customerName, customerEmail, customerPhone, status: "valid" | "used" | "pending" | "void", voidReason, createdAt`).
- Thư viện icon đã cài sẵn: `lucide-react`. Giao diện dùng Tailwind CSS tông màu tối sang trọng (`bg-[#0B0C10]`, card `bg-[#14151B]`, viền `border-white/10`, nút chính màu đỏ `bg-rose-600`).

2. NHIỆM VỤ ĐƯỢC GIAO CỦA TÔI (ĐÀO DUY MINH):
Hãy viết ĐẦY ĐỦ MÃ NGUỒN (Full code từ dòng đầu đến dòng cuối, không viết tắt `// ...`) cho 3 file mới độc lập sau đây để tôi copy dán vào VS Code và merge vào nhánh main:

- FILE 1: `src/lib/reviewAndLoyaltyStore.ts`
  + Quản lý danh sách Đơn đặt vé mẫu kết hợp đơn thực tế (`getAdminOrders()`, `cancelAndRefundOrder(bookingId, reason)` có gọi `await getTicketStore().voidTicket(bookingId, reason)`).
  + Quản lý danh sách Đánh giá & Bình luận phim (`MovieReviewItem`: id, movieId, movieTitle, customerName, customerPhone, rating: 1..5, content, isVerifiedBuyer: boolean, likesCount: number, status: "approved" | "pending" | "hidden", createdAt). Khởi tạo sẵn 6 bình luận mẫu chân thực.
  + Quản lý tính toán Hạng thành viên & Điểm thưởng (`calculateLoyaltyInfo(totalSpent: number)`: trả về Hạng Đồng / Bạc / Vàng / Kim Cương, số điểm tích lũy, hệ số nhân điểm, quyền lợi ưu đãi).
  + Các hàm: `getReviews(movieId?: string)`, `addReview(input)`, `likeReview(id)`, `updateReviewStatus(id, status)`, `deleteReview(id)`.

- FILE 2: `src/app/api/reviews/route.ts`
  + Next.js App Router API (`GET`, `POST`, `PUT`, `DELETE`).
  + `GET`: trả về `{ reviews, orders }` từ `reviewAndLoyaltyStore.ts`.
  + `POST`: khách hàng gửi đánh giá phim mới (1-5 sao, nội dung) hoặc bấm thả tim (`action === "like"`). Tự động kiểm tra nếu SĐT người gửi có trong danh sách đơn vé đã mua thì gắn `isVerifiedBuyer = true` (Tích xanh Đã mua vé).
  + `PUT` & `DELETE`: dành cho Admin (`isAdminAuthorized`) để Duyệt / Ẩn bình luận vi phạm, Xóa bình luận spam, hoặc bấm nút "Hủy vé & Hoàn tiền" (`cancelAndRefundOrder`).

- FILE 3: `src/components/admin/AdminOrdersAndReviewsTab.tsx`
  + Component React `"use client"` hoàn chỉnh có 2 sub-tabs:
    1. "Quản Lý Đơn Hàng & Hoàn Vé": Tìm kiếm theo Mã đặt vé (bookingId), SĐT khách hàng hoặc tên phim; lọc theo trạng thái (`valid`, `used`, `void`); xem chi tiết ghế, combo bắp nước, mã QR; có nút "Hủy Vé & Hoàn Tiền (Giải phóng ghế)" ngay trên từng đơn hàng.
    2. "Quản Lý Đánh Giá & Bình Luận Phim": Xem danh sách nhận xét của khán giả theo số sao (1-5 sao), hiển thị nhãn "✔️ Đã mua vé thật (Verified Buyer)", lọc theo trạng thái (Đã duyệt / Chờ duyệt / Đã ẩn), nút Duyệt / Ẩn / Xóa bình luận spam và Form viết thử bình luận mới.

Hãy xuất rõ ràng từng khối code với tiêu đề đường dẫn file ở trên để tôi copy tạo file ngay!
```

---

## 🛠️ HƯỚNG DẪN CÁC BẠN SAU KHI CLAUDE FREE TRẢ CODE VỀ:

Mỗi bạn chỉ cần làm đúng 4 bước cực dễ sau trên máy tính của mình:

1. **Bước 1:** Mở Terminal trong VS Code, kéo code mới nhất và tạo nhánh riêng của mình:
   - **Đăng:** `git checkout main && git pull origin main && git checkout -b feat/dang-movies-and-audit`
   - **Tuấn:** `git checkout main && git pull origin main && git checkout -b feat/tuan-vouchers-and-fnb`
   - **Minh:** `git checkout main && git pull origin main && git checkout -b feat/minh-orders-and-reviews`
2. **Bước 2:** Tạo đúng 3 file theo đường dẫn Claude vừa xuất ra và dán (Paste) code vào.
3. **Bước 3:** Kiểm tra không có lỗi cú pháp, sau đó lưu và commit:
   ```bash
   git add .
   git commit -m "feat(admin): bo sung module quan tri va API nghiep vu"
   ```
4. **Bước 4:** Đẩy nhánh của mình lên GitHub:
   - **Đăng:** `git push -u origin feat/dang-movies-and-audit`
   - **Tuấn:** `git push -u origin feat/tuan-vouchers-and-fnb`
   - **Minh:** `git push -u origin feat/minh-orders-and-reviews`
5. **Bước 5:** Lên GitHub bấm **"Compare & pull request"** để Trưởng nhóm (Dũng) bấm **Merge** vào `main` và gắn 3 tab mới này vào `src/app/admin/page.tsx`!
