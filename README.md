# 🎬 CineMax AI - Nền Tảng Web Phim & Đặt Vé Thông Minh

Một ứng dụng web phim hiện đại chuẩn rạp chiếu kết hợp giữa **khám phá phim (phong cách Netflix / IMDb)**, **module đặt vé rạp trực quan (CGV/Fandango)** và **Trợ lý ảo AI siêu tốc (~500 tokens/s) sử dụng chip Groq LPU**.

---

## 🌟 Tính Năng Nổi Bật

1. **Giao Diện Điện Ảnh Hiện Đại (Cinematic Dark Mode)**:
   - **Hero Banner**: Phim bom tấn tiêu điểm với trailer, tóm tắt và nút đặt vé nhanh.
   - **Thanh cuộn phim mượt mà (Movie Rows)**: Phim đang chiếu (Now Playing), Phim thịnh hành đánh giá cao (Trending/Top Rated), Phim sắp ra mắt (Upcoming).
   - **Tìm kiếm tức thì**: Lọc theo tên phim, diễn viên, đạo diễn hoặc thể loại.

2. **Trợ Lý AI Phản Hồi Siêu Tốc (Groq LPU Powered)**:
   - Tốc độ sinh text lên đến **300 - 500 tokens/giây** (nhanh gấp 5-10 lần so với ChatGPT thông thường).
   - Cơ chế **Server-Sent Events (SSE) Stream**: Từng từ xuất hiện tức thì (< 200ms) trên giao diện.
   - Tư vấn chọn phim hợp tâm trạng, gợi ý suất chiếu và phân tích vị trí ghế ngồi đẹp nhất trong rạp.

3. **Module Đặt Vé Rạp Trực Quan (Cinema Booking Engine)**:
   - **Bước 1**: Chọn cụm rạp (CGV, Lotte Cinema, BHD Star), ngày chiếu, suất chiếu và định dạng (2D, IMAX Laser).
   - **Bước 2**: Sơ đồ ghế động với màn hình cong rạp chiếu (Screen glow), phân loại Ghế Thường (90k), Ghế VIP (115k), Ghế Đôi Sweetbox (220k).
   - **Bước 3**: Chọn combo bắp nước rạp phim (Solo, Couple, VIP).
   - **Bước 4**: Xuất **Vé Điện Tử (E-Ticket)** với thông tin chi tiết và **Mã QR Code** động sẵn sàng để check-in tại rạp!

4. **Chế Độ Hoạt Động Kép (Smart Mock Fallback)**:
   - Web có sẵn bộ dữ liệu phim, poster 4K, trailer YouTube và AI mô phỏng chất lượng cao, chạy mượt mà ngay cả khi chưa nhập API Key.
   - Khi điền API Key vào `.env.local`, hệ thống tự động kết nối API thật.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### 2. Cấu hình API Key thật (Tùy chọn)
Chỉnh sửa file `.env.local`:
```env
# Khóa API Groq miễn phí (lấy tại https://console.groq.com/)
GROQ_API_KEY=gsk_your_groq_key_here

# Khóa TMDB v3 API miễn phí (lấy tại https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key_here
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism + Cinema Screen Glow
- **Iconography**: Lucide React
- **AI Streaming**: Groq SDK (`groq-sdk` với Llama 3.3 70B Versatile)
- **Mã Vé Rạp**: QRCode Generator
