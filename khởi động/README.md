# THƯ MỤC KHỞI ĐỘNG DỰ ÁN CINEMAX AI (PROJECT KICKOFF)

Thư mục này tập hợp toàn bộ hồ sơ khởi động, tài liệu đặc tả yêu cầu nghiệp vụ (SRS/WBS), kiến trúc cơ sở dữ liệu chi tiết và checklist chuẩn bị dự án **CineMax AI**.

---

## 👥 THÀNH VIÊN DỰ ÁN & PHÂN CÔNG TRÁCH NHIỆM

> **Lưu ý nhân sự:** Dự án gồm 4 thành viên chủ chốt (Kế thừa từ Smart CV, **không bao gồm Đặng Quốc Toản**):

| STT | Thành Viên | Vai Trò Chính | Trách Nhiệm Chi Tiết |
| :---: | :--- | :--- | :--- |
| 1 | **Nguyễn Chí Dũng** | **Trưởng Nhóm / Fullstack & AI Lead** | - Kiến trúc tổng thể hệ thống CineMax AI<br>- Tích hợp AI Movie Chatbot & Recommendations<br>- Quản lý tiến độ, review code & deploy production |
| 2 | **Nguyễn Hải Đăng** | **Database Architect & Backend** | - Thiết kế lược đồ CSDL (11 bảng), quan hệ, chỉ mục (Index)<br>- Quản trị dữ liệu, tối ưu hiệu năng truy vấn<br>- Kiểm soát toàn vẹn dữ liệu & migration |
| 3 | **Nguyễn Văn Tuấn** | **Backend Services & Business Logic** | - Hiện thực hóa quy trình giữ ghế (Seat Hold 300s) & giải thuật chống xung đột lịch chiếu (Collision Engine)<br>- Tích hợp cổng thanh toán (VNPay / MoMo) & sinh mã vé HMAC QR<br>- Quản lý nghiệp vụ hoàn tiền & Voucher giảm giá |
| 4 | **Đào Duy Minh** | **Frontend Lead, Auth & Scanner** | - Phát triển giao diện người dùng (Next.js 14, Tailwind CSS)<br>- Tối ưu UX/UI đặt vé & sơ đồ ghế tương tác thời gian thực<br>- Xây dựng cổng soát vé nhân viên (/staff/scan) & phân quyền truy cập |

---

## 📂 DANH MỤC TÀI LIỆU TRONG THƯ MỤC NÀY

### 1. [CineMax_AI_KhaoSatChucNang_Database_ChiTiet.xlsx](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/CineMax_AI_KhaoSatChucNang_Database_ChiTiet.xlsx)
File Excel chuẩn nghiệp vụ gồm 4 Sheet chi tiết:
- **Sheet 1: Thông tin dự án & Thành viên:** Bảng phân công 4 thành viên, công nghệ sử dụng, mục tiêu và phạm vi hệ thống.
- **Sheet 2: Bảng phân rã chức năng (WBS/SRS):** 23 chức năng được mã hóa rõ ràng theo 3 tầng phân quyền (Khách hàng, Nhân viên rạp, Quản trị viên Admin).
- **Sheet 3: Data Dictionary chi tiết 11 bảng CSDL:** Liệt kê đầy đủ từng cột, kiểu dữ liệu, ràng buộc khóa chính/khóa ngoại, mục đích của 11 bảng (`users`, `cinemas`, `rooms`, `movies`, `showtimes`, `seat_layouts`, `seat_holds`, `bookings`, `tickets`, `vouchers`, `reviews`).
- **Sheet 4: Quy trình nghiệp vụ cốt lõi:** Đặc tả chi tiết 4 quy trình (Giữ ghế 300s, Soát vé bảo mật HMAC QR, Kiểm tra xung đột suất chiếu rạp, Chính sách hoàn vé tự động).

### 2. [KHAO_SAT_CHUC_NANG_VA_DATABASE_CHI_TIET.md](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/KHAO_SAT_CHUC_NANG_VA_DATABASE_CHI_TIET.md)
Tài liệu Markdown toàn diện (34+ KB) bao gồm:
- Toàn bộ nội dung khảo sát chức năng & WBS.
- Biểu đồ quan hệ thực thể **Mermaid ERD** của 11 bảng CSDL.
- Biểu đồ tuần tự (Sequence Diagram) quy trình giữ ghế & thanh toán.
- Sơ đồ máy trạng thái (State Diagram) vòng đời vé.

### 3. [PROJECT_KICKOFF_MASTER_CHECKLIST.md](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/PROJECT_KICKOFF_MASTER_CHECKLIST.md)
Checklist 7 trụ cột khởi động dự án chuyên nghiệp:
- Trụ cột 1: Hạ tầng & Môi trường phát triển (Git, Next.js, Redis, TMDB API).
- Trụ cột 2: Quản trị mã nguồn, Branching Strategy & CI/CD.
- Trụ cột 3: Đặc tả dữ liệu & Cơ chế bảo toàn tính nhất quán (Redis Lock, DB ACID).
- Trụ cột 4: UI/UX Design System & Thư viện thành phần.
- Trụ cột 5: Kiểm thử tự động (Unit test, Integration test, Playwright E2E).
- Trụ cột 6: Bảo mật, Xác thực & Phân quyền 3 vai trò (User/Staff/Admin).
- Trụ cột 7: Triển khai (Deployment), Giám sát (Monitoring) & Báo cáo tiến độ.
