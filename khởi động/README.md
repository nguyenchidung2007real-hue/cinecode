# THƯ MỤC KHỞI ĐỘNG DỰ ÁN CINEMAX AI (PROJECT KICKOFF)

Thư mục này tập hợp toàn bộ hồ sơ khởi động, tài liệu đặc tả yêu cầu nghiệp vụ (SRS/WBS), kiến trúc cơ sở dữ liệu chi tiết, các file bảng tính chuẩn mẫu Google Sheets và checklist chuẩn bị dự án **CineMax AI**.

---

## 👥 THÀNH VIÊN DỰ ÁN & PHÂN CÔNG TRÁCH NHIỆM

> **Lưu ý nhân sự:** Dự án gồm 4 thành viên chủ chốt (Kế thừa từ Smart CV, **không bao gồm Đặng Quốc Toản**):

| STT | Tên viết tắt | Họ và Tên | Vai Trò Chính | Phân Hệ Phụ Trách & Trách Nhiệm Chi Tiết |
| :---: | :---: | :--- | :--- | :--- |
| 1 | **Dũng** | **Nguyễn Chí Dũng** | **Trưởng Nhóm / Fullstack & AI Lead** | Kiến trúc tổng thể, tích hợp TMDB API & Groq LPU AI Chatbot, Semantic Search RAG, tối ưu UI/UX Home & Booking Modal, module Phim & Đánh giá. |
| 2 | **Đăng** | **Nguyễn Hải Đăng** | **Database Architect & Backend** | Thiết kế CSDL Upstash Redis & Relational Schema (11 bảng), kịch bản Redis Lua Script giữ ghế 300s nguyên tử, Distributed Mutex khóa phòng chiếu, thu hồi vé & ghế. |
| 3 | **Tuấn** | **Nguyễn Văn Tuấn** | **Backend Services & Business Logic** | Thuật toán Showtime Collision Engine (chống va chạm lịch chiếu), Orphan Seat Rule (chống ghế mồ côi), F&B Upsell combo bắp nước, Module Voucher, Dashboard thống kê doanh thu. |
| 4 | **Minh** | **Đào Duy Minh** | **Frontend Lead, Auth & Scanner** | Cổng Quản trị Admin (/admin), Cổng soát vé camera nhân viên (/scanner), Xác thực HMAC-SHA256 chống vé giả & chống quét trùng (Anti-replay), Dashboard ví vé khách hàng (/dashboard). |

---

## 📂 DANH MỤC TÀI LIỆU TRONG THƯ MỤC NÀY

### 1. 📊 Hồ Sơ Bảng Tính Google Sheets Chuẩn Mẫu (Theo đúng link mẫu Google Sheet)
- **[CineMax_AI_ChucNang_Va_Database_Giong_Mau.xlsx](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/CineMax_AI_ChucNang_Va_Database_Giong_Mau.xlsx)**: File Excel chuẩn cấu trúc và định dạng giống hệt link Google Sheet của bạn (gồm sheet `CHỨC NĂNG`, `DATABASE (11 BẢNG)`, `THÀNH VIÊN DỰ ÁN`). Sẵn sàng kéo thả vào Google Drive/Sheets.
- **[Tao_Google_Sheet_Chuan_Mau.js](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/Tao_Google_Sheet_Chuan_Mau.js)**: Mã Google Apps Script 1-Click tự động vẽ bảng, tạo tab và đổ dữ liệu chuẩn mẫu lên Google Sheets.
- **[HUONG_DAN_TAO_GOOGLE_SHEET_GIONG_MAU.md](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/HUONG_DAN_TAO_GOOGLE_SHEET_GIONG_MAU.md)**: Hướng dẫn chi tiết từng bước tạo và xem bảng tính trên Google Sheets.
- **File CSV xuất chuẩn UTF-8 with BOM**:
  - `1_Chuc_Nang_CineMax_Giong_Mau.csv`
  - `2_Database_CineMax_11_Bang.csv`
  - `3_Thanh_Vien_Du_An.csv`

### 2. 📝 Tài Liệu Đặc Tả Kỹ Thuật & Khởi Động Dự Án
- **[KHAO_SAT_CHUC_NANG_VA_DATABASE_CHI_TIET.md](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/KHAO_SAT_CHUC_NANG_VA_DATABASE_CHI_TIET.md)**: Đặc tả kỹ thuật đầy đủ kèm sơ đồ Mermaid ERD 11 bảng CSDL, Sequence Diagram quy trình giữ ghế và State Diagram vòng đời vé.
- **[PROJECT_KICKOFF_MASTER_CHECKLIST.md](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/PROJECT_KICKOFF_MASTER_CHECKLIST.md)**: Checklist 7 trụ cột khởi động dự án: Môi trường, Git/CI-CD, CSDL & Redis Lock, UI Design System, Playwright E2E Testing, Bảo mật 3 vai trò, Deployment.
"""

with open(r"c:\Users\NGUYEN CHI DUNG\OneDrive\Documents\web mua vé xem phim\khởi động\README.md", "w", encoding="utf-8") as f:
    f.write(CodeContent)
