# 📋 BẢNG PHÂN CÔNG NHIỆM VỤ CHI TIẾT CHO 3 THÀNH VIÊN TRONG NHÓM
**Dự án:** Nền tảng Đặt vé Xem phim Thông minh CineMax AI  
**Trưởng nhóm điều phối:** Nguyễn Chí Dũng  

---

## 🎯 NGUYÊN TẮC PHÂN CÔNG (ĐẢM BẢO AI CŨNG CÓ PHẦN CODE, DATABASE & BÁO CÁO RÕ RÀNG)
Mỗi thành viên trong nhóm được chia **3 đầu việc đồng bộ với nhau**:
1. **Phụ trách Module Code & Giao diện riêng** (Có danh sách file cụ thể trong `src/` để tự tin mở code demo và giải thích khi thầy cô hỏi).
2. **Phụ trách Nhóm Bảng Database tương ứng** (Chỉ cần học kỹ các bảng thuộc phân hệ của mình thông qua file `DATABASE_DIAGRAM_VIEWER.html`).
3. **Phụ trách Phần Khảo sát & Báo cáo Word / Slide** (Để ráp lại thành cuốn báo cáo đồ án hoàn chỉnh).

---

## 👤 1. NGUYỄN HẢI ĐĂNG — *Database Architect & Cơ Chế Giữ Ghế 300 Giây*

### 💻 A. Phần Code & Chức năng phụ trách (Cần nắm rõ để Demo & Vấn đáp):
* **Chức năng chính:** Cơ chế giữ ghế nguyên tử 300 giây (5 phút), đồng hồ đếm ngược giữ chỗ, xử lý chống 2 người đặt trùng 1 ghế cùng lúc (Race Condition), lưu trữ dữ liệu Redis KV.
* **Các file code phụ trách chính (Cần đọc hiểu kỹ):**
  1. `src/lib/seatStore.ts` — Xử lý giữ ghế (Hold), chốt ghế (Commit), giải phóng ghế tự động sau 300s bằng Lua Script.
  2. `src/hooks/useSeatHold.ts` — Hook đếm ngược thời gian giữ ghế trên màn hình khách hàng.
  3. `src/app/api/seats/route.ts` — API lấy sơ đồ ghế và đặt giữ chỗ tạm thời.
  4. `src/app/api/booking/route.ts` & `src/lib/bookingService.ts` — API tạo đơn đặt vé và khóa ghế.
  5. `src/lib/kvRest.ts` — Kết nối cơ sở dữ liệu Upstash Redis REST.

### 🗄️ B. Phần Bảng Database cần học thuộc (Xem trong `DATABASE_DIAGRAM_VIEWER.html`):
* **Phụ trách 7 bảng (Nhóm Hạ tầng Rạp, Ghế động & Chống sập):**
  1. `cinemas` (Danh sách cụm rạp & tọa độ GPS)
  2. `halls` (Phòng chiếu IMAX, 2D, 4DX trong rạp)
  3. `seat_templates` (Sơ đồ ghế vật lý cố định bắt ốc vít trong phòng)
  4. `showtime_seats` (**Bảng quan trọng nhất**: Trạng thái ghế Trống/Đang giữ/Đã bán theo từng giờ chiếu)
  5. `waiting_room_sessions` (Phòng chờ ảo xếp hàng khi phim bom tấn mở bán chống sập web)
  6. `payments` (Lịch sử giao dịch thanh toán)
  7. `system_audit_logs` (Nhật ký an ninh hệ thống)

### 📝 C. Công việc Tài liệu & Khảo sát cần làm:
1. Mở file `DATABASE_DIAGRAM_VIEWER.html` và `database_schema.dbml` để nắm chắc sơ đồ ERD 29 bảng, chuẩn bị phần **Chương Thiết Kế Cơ Sở Dữ Liệu** trong báo cáo Word.
2. Phụ trách rà soát bài phân tích **Rạp CGV** (`khao-sat/1_phan_tich_cgv.md`).
3. Khảo sát phỏng vấn thực tế **5 người bạn** và điền kết quả vào file Excel `khao-sat/KHAO_SAT_OFFLINE_RAP_PHIM.csv` (từ dòng Khảo sát #1 đến #5).

---

## 👤 2. NGUYỄN VĂN TUẤN — *Backend Nghiệp Vụ: Lịch Chiếu, Ghế Mồ Côi, Bắp Nước & Voucher*

### 💻 A. Phần Code & Chức năng phụ trách (Cần nắm rõ để Demo & Vấn đáp):
* **Chức năng chính:** Thuật toán chống trùng lịch phòng chiếu (Showtime Collision Engine), Thuật toán chống bỏ trống 1 ghế lẻ (Orphan Seat Rule), Góc nhìn 3D từ ghế ngồi lên màn hình, Tính giá vé + Bắp nước F&B + Mã giảm giá Voucher.
* **Các file code phụ trách chính (Cần đọc hiểu kỹ):**
  1. `src/lib/showtimeCollision.ts` & `src/lib/showtimeStore.ts` — Kiểm tra va chạm giờ chiếu (Thời lượng phim + 10p trailer + 15p dọn vệ sinh) và gợi ý 3 khung giờ trống.
  2. `src/lib/orphanSeatRule.ts` — Thuật toán chặn khách để trống 1 ghế lẻ loi ở rìa hoặc ở giữa.
  3. `src/lib/seatLayout.ts` & `src/lib/seatRecommender.ts` — Vẽ sơ đồ 102 ghế (Standard, VIP, Sweetbox) và gợi ý vùng ghế đẹp nhất (Sweet Spot).
  4. `src/components/ViewFromSeatModal.tsx` — Mô phỏng góc nhìn thực tế từ ghế ngồi lên màn chiếu.
  5. `src/lib/pricing.ts` — Công thức tính tổng tiền vé, cộng combo bắp nước và trừ tiền mã Voucher.
  6. `src/app/api/showtimes/route.ts` & `src/app/api/admin/showtimes/route.ts` — API quản lý suất chiếu.

### 🗄️ B. Phần Bảng Database cần học thuộc (Xem trong `DATABASE_DIAGRAM_VIEWER.html`):
* **Phụ trách 8 bảng (Nhóm Suất chiếu, Bắp nước F&B & Khuyến mãi):**
  1. `showtimes` (Lịch suất chiếu phim theo phòng và giờ)
  2. `concessions` (Menu bắp rang bơ, nước ngọt, combo tại quầy)
  3. `booking_concessions` (Chi tiết các món bắp nước khách mua kèm trong đơn)
  4. `concession_deliveries` (Dịch vụ nhân viên giao bắp nước tới tận ghế ngồi)
  5. `coupons` (Kho mã giảm giá / Voucher khuyến mãi)
  6. `coupon_redemptions` (Lịch sử khách sử dụng mã giảm giá)
  7. `gift_cards` (Thẻ quà tặng nạp tiền trả trước)
  8. `gift_card_transactions` (Lịch sử trừ tiền thẻ quà tặng)

### 📝 C. Công việc Tài liệu & Khảo sát cần làm:
1. Viết phần **Đặc tả Nghiệp vụ cốt lõi** (Quy trình xếp lịch chống trùng phòng, quy tắc ghế mồ côi, công thức tính giá F&B & Voucher) vào báo cáo Word.
2. Phụ trách rà soát bài phân tích **Rạp Galaxy & Lotte** (`khao-sat/2_phan_tich_galaxy.md` và `khao-sat/3_phan_tich_lotte.md`).
3. Khảo sát phỏng vấn thực tế **5 người bạn** và điền kết quả vào file Excel `khao-sat/KHAO_SAT_OFFLINE_RAP_PHIM.csv` (từ dòng Khảo sát #6 đến #10).

---

## 👤 3. ĐÀO DUY MINH — *Frontend Admin, Máy Quét QR Soát Vé, Bảo Mật & Ví Vé Khách Hàng*

### 💻 A. Phần Code & Chức năng phụ trách (Cần nắm rõ để Demo & Vấn đáp):
* **Chức năng chính:** Trang Quản trị viên (`/admin`), Cổng Nhân viên Soát vé bằng Camera QR (`/scanner`), Chữ ký số HMAC-SHA256 chống làm giả vé, Trang Ví vé cá nhân của khách (`/dashboard`), Xử lý Hủy vé / Hoàn tiền và Bảo mật đăng nhập.
* **Các file code phụ trách chính (Cần đọc hiểu kỹ):**
  1. `src/app/admin/page.tsx` & `src/app/admin/login/page.tsx` — Giao diện Dashboard Admin quản lý đơn vé, suất chiếu, thống kê doanh thu.
  2. `src/app/scanner/page.tsx` & `src/app/api/tickets/check-in/route.ts` — Ứng dụng quét mã QR tại cửa phòng chiếu, phát hiện vé giả hoặc vé quét lại lần 2.
  3. `src/app/dashboard/page.tsx` & `src/components/MyTicketsModal.tsx` — Ví vé điện tử của khách hàng, hiển thị mã QR và nút yêu cầu hủy/hoàn vé.
  4. `src/lib/ticketStore.ts` — Tạo vé điện tử, ký số HMAC-SHA256 và xử lý hoàn vé (Void/Refund).
  5. `src/lib/adminAuth.ts`, `src/lib/staffAuth.ts`, `src/lib/rateLimit.ts`, `src/middleware.ts` — Bảo mật phiên đăng nhập HttpOnly Cookie và khóa IP khi nhập sai mật khẩu quá 8 lần.

### 🗄️ B. Phần Bảng Database cần học thuộc (Xem trong `DATABASE_DIAGRAM_VIEWER.html`):
* **Phụ trách 8 bảng (Nhóm Tài khoản, Vé QR, Hoàn tiền, Hội viên & Đặt nhóm):**
  1. `users` (Tài khoản Khách hàng, Nhân viên soát vé, Quản lý, Admin)
  2. `bookings` (Đơn đặt vé tổng)
  3. `tickets` (Từng tấm vé điện tử chứa mã QR và trạng thái quét qua cửa)
  4. `refund_requests` (Yêu cầu trả vé hoàn tiền trước giờ chiếu 60 phút)
  5. `membership_tiers` (Hạng thành viên Đồng, Bạc, Vàng, Kim Cương)
  6. `user_loyalty_transactions` (Sổ cái cộng/trừ điểm thưởng thành viên)
  7. `group_bookings` (Phòng đặt vé chung theo nhóm bạn bè)
  8. `group_booking_members` (Danh sách thành viên và chia tiền trong nhóm)

### 📝 C. Công việc Tài liệu & Khảo sát cần làm:
1. Chụp ảnh màn hình toàn bộ các giao diện (`/admin`, `/scanner`, `/dashboard`, màn hình vé QR) đưa vào **Báo cáo Word** và thiết kế **Slide thuyết trình (PowerPoint/Canva)** cho nhóm.
2. Phụ trách rà soát bài phân tích **Rạp Beta Cinemas** (`khao-sat/4_phan_tich_beta.md`).
3. Khảo sát phỏng vấn thực tế **5 người bạn** và điền kết quả vào file Excel `khao-sat/KHAO_SAT_OFFLINE_RAP_PHIM.csv` (từ dòng Khảo sát #11 đến #15).

---

## 👑 4. NGUYỄN CHÍ DŨNG (TRƯỞNG NHÓM) — *Tổng Chỉ Huy, AI Engine, Trang Chủ & Thanh Toán*
* **Phần Code phụ trách:** Trang chủ (`src/app/page.tsx`), Tìm kiếm ngữ nghĩa AI (`SemanticSearchModal.tsx`, `hfRagService.ts`), Chatbot tư vấn phim theo cảm xúc (`AiChatWidget.tsx`, `moodDetector.ts`), Luồng đặt vé (`BookingModal.tsx`), Tích hợp cổng thanh toán VNPay Sandbox & VietQR (`src/lib/vnpay.ts`, `src/app/api/payment/vnpay/...`), Quản lý GitHub.
* **Phần Database phụ trách (6 bảng):** `genres`, `movies`, `movie_genres`, `movie_reviews`, `review_likes`, `movie_watchlists` + Nắm tổng quan cả 29 bảng để hỗ trợ anh em khi bảo vệ.
