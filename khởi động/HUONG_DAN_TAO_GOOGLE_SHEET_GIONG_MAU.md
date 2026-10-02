# HƯỚNG DẪN TẠO VÀ MỞ BẢNG TÍNH GOOGLE SHEETS CHUẨN MẪU 100%

Hồ sơ này được thiết kế và ánh xạ **chính xác 100% theo mẫu Google Sheet của bạn** (bao gồm: tiêu đề, khối công nghệ Front-end/Back-end, link Database, cột *Phân quyền*, *Chức năng*, *Mô tả chi tiết*, *Người làm*, *Khó khăn*, và 4 khối *Quy trình nghiệp vụ* ở cuối trang).

---

## 👥 THÀNH VIÊN DỰ ÁN (4 THÀNH VIÊN — KHÔNG CÓ ĐẶNG QUỐC TOẢN)
1. **Dũng** — **Nguyễn Chí Dũng** *(Trưởng Nhóm / Fullstack Lead & AI)*
2. **Đăng** — **Nguyễn Hải Đăng** *(Database Architect & Backend Engineer)*
3. **Tuấn** — **Nguyễn Văn Tuấn** *(Backend Services & Business Logic Engineer)*
4. **Minh** — **Đào Duy Minh** *(Frontend Lead & Security Engineer)*

---

## ⚡ CÁCH 1: NHẬP FILE EXCEL VÀO GOOGLE SHEETS (10 GIÂY — ĐẸP NHẤT)

File Excel [CineMax_AI_ChucNang_Va_Database_Giong_Mau.xlsx](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/CineMax_AI_ChucNang_Va_Database_Giong_Mau.xlsx) đã được căn lề, kẻ khung, phối màu và tính toán độ rộng cột hoàn toàn tương thích với Google Sheets.

### 4 Bước thực hiện:
1. Mở trình duyệt web và truy cập: **[https://sheets.new](https://sheets.new)** (hoặc vào [Google Drive](https://drive.google.com)).
2. Trên thanh menu, chọn: **Tệp (File)** > **Nhập (Import)** (phím tắt `Ctrl + O`).
3. Chọn thẻ **Tải lên (Upload)** > Kéo thả file `khởi động/CineMax_AI_ChucNang_Va_Database_Giong_Mau.xlsx` vào.
4. Chọn: **Thay thế bảng tính (Replace spreadsheet)** > Nhấn nút **Nhập dữ liệu (Import data)**.
5. 👉 **Kết quả:** Google Sheets hiển thị ngay lập tức với giao diện và cấu trúc chuẩn 100% như link mẫu!

---

## 🤖 CÁCH 2: TỰ ĐỘNG VẼ BẢNG BẰNG GOOGLE APPS SCRIPT (1-CLICK CODE)

Nếu bạn muốn Google Sheets tự động chạy script tạo bảng và định dạng online:

### 4 Bước thực hiện:
1. Mở bảng tính mới tại: **[https://sheets.new](https://sheets.new)**.
2. Trên thanh menu chọn: **Tiện ích mở rộng (Extensions)** > **Apps Script**.
3. Xóa hết code trong cửa sổ `Mã.gs`, sao chép toàn bộ nội dung trong file [Tao_Google_Sheet_Chuan_Mau.js](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/Tao_Google_Sheet_Chuan_Mau.js) và dán vào.
4. Nhấn nút **Chạy (Run)** (hàm `createCineMaxGoogleSheet`).
5. Quay lại tab Google Sheets: Toàn bộ bảng tính sẽ được vẽ và điền dữ liệu tự động trong vòng 3 giây!

---

## 📁 CÁCH 3: NHẬP TỪ FILE CSV
Bạn có thể kéo trực tiếp file [1_Chuc_Nang_CineMax_Giong_Mau.csv](file:///c:/Users/NGUYEN%20CHI%20DUNG/OneDrive/Documents/web%20mua%20v%C3%A9%20xem%20phim/kh%E1%BB%9Fi%20%C4%91%E1%BB%99ng/1_Chuc_Nang_CineMax_Giong_Mau.csv) vào Google Sheets qua menu **Tệp > Nhập > Tải lên**. Định dạng mã hóa UTF-8 with BOM đảm bảo không bao giờ bị lỗi font tiếng Việt.
