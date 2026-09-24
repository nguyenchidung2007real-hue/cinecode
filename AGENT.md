# 🤖 AGENT.md - Bộ Nhớ & Hướng Dẫn Kỹ Thuật Cho AI Coding Agent

> **Dự án**: CineMax AI - Nền Tảng Web Phim & Đặt Vé Rạp Chiếu Thông Minh  
> **Repository**: [https://github.com/nguyenchidung2007real-hue/cinecode](https://github.com/nguyenchidung2007real-hue/cinecode)  
> **Phương pháp phát triển**: Vibe Coding (Người dùng định hướng sản phẩm, AI Agent trực tiếp thực thi và đảm bảo chất lượng).

---

## 🎯 1. Vai Trò & Nguyên Tắc Của AI Agent (Mindset)
1. **Bảo tồn tính toàn vẹn (Documentation & Code Integrity)**:
   - Tuyệt đối không tự ý xóa bỏ hoặc làm hỏng các tính năng đã hoạt động ổn định.
   - Luôn duy trì cơ chế **Hoạt động kép (Smart Mock Fallback)**: nếu chưa có API Key (`GROQ_API_KEY`, `TMDB_API_KEY`), ứng dụng vẫn phải hoạt động mượt mà bằng mock data trong `src/lib/mockData.ts`.
2. **Tư duy Vibe Coding**:
   - Khi người dùng mô tả tính năng mới, AI chủ động chia nhỏ nhiệm vụ, tự triển khai mã nguồn, kiểm tra lỗi và cập nhật tài liệu.
   - Viết code ngắn gọn, rõ ràng, chia component nhỏ gọn, dễ tái sử dụng.
3. **Quản lý phiên bản tự động**:
   - Sau khi hoàn thành một tính năng hoặc sửa lỗi quan trọng, tự động tạo Git commit với thông điệp rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat: ...`, `fix: ...`).

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)
* **Framework**: Next.js 14 (App Router) + React 18 + TypeScript.
* **Styling**: Tailwind CSS + Glassmorphism + Hiệu ứng ánh sáng rạp chiếu (Cinema Screen Glow).
* **Icons**: `lucide-react`.
* **AI Streaming**: Groq SDK (`groq-sdk`) với model Llama 3.3 70B Versatile, phản hồi dạng Server-Sent Events (SSE).
* **Mã vé điện tử**: `qrcode.react` (Sinh QR Code động cho vé xem phim).

---

## 📂 3. Cấu Trúc Thư Mục Chuẩn (Project Structure)
```
/
├── .env.example              # Mẫu biến môi trường
├── .env.local                # Khóa API thực tế (GROQ_API_KEY, TMDB_API_KEY)
├── AGENT.md                  # Bộ nhớ & quy tắc cho AI Agent (Tệp này)
├── README.md                 # Giới thiệu dự án cho con người
├── package.json              # Khai báo thư viện & kịch bản lệnh
├── tailwind.config.ts        # Cấu hình màu sắc, animation, bóng neon
└── src/
    ├── app/
    │   ├── api/              # Backend API Routes
    │   │   ├── booking/      # API xử lý đặt vé, lưu trữ giao dịch
    │   │   ├── chat/         # API tương tác AI tư vấn phim (Groq SSE Stream)
    │   │   └── movies/       # API lấy danh sách phim (TMDB + Fallback mock)
    │   ├── globals.css       # Custom scrollbar, neon glow, animations
    │   ├── layout.tsx        # Khung layout chung, font chữ, metadata SEO
    │   └── page.tsx          # Trang chủ chính
    ├── components/           # Các khối giao diện React
    │   ├── Navbar.tsx        # Thanh điều hướng trên cùng, tìm kiếm nhanh
    │   ├── HeroBanner.tsx    # Banner phim bom tấn tiêu điểm kèm trailer
    │   ├── MovieRow.tsx      # Hàng phim cuộn ngang mượt mà
    │   ├── MovieCard.tsx     # Thẻ phim với poster, điểm IMDb, badge chất lượng
    │   ├── MovieModal.tsx    # Modal chi tiết phim, trailer YouTube, diễn viên
    │   ├── BookingModal.tsx  # Trình đặt vé: Chọn rạp, suất chiếu, ghế, combo bắp nước, xuất vé QR
    │   ├── AiChatWidget.tsx  # Cửa sổ chat AI nổi góc màn hình (Groq streaming)
    │   └── Footer.tsx        # Chân trang rạp chiếu phim
    ├── lib/                  # Dịch vụ & hàm bổ trợ
    │   ├── mockData.ts       # Bộ dữ liệu phim, suất chiếu, bắp nước dự phòng
    │   ├── movieService.ts   # Tích hợp TMDB API & xử lý dữ liệu phim
    │   └── utils.ts          # Hàm tiện ích (định dạng tiền tệ VNĐ, ngày giờ)
    └── types/
        └── index.ts          # Định nghĩa kiểu dữ liệu TypeScript (Movie, Booking, Seat,...)
```

---

## 🎨 4. Quy Chuẩn Giao Diện (Design System Guidelines)
* **Tone màu chủ đạo**:
  * Nền chính: Đen rạp chiếu `#0B0C10`, `#14151B`.
  * Màu nhấn thương hiệu: Đỏ Netflix/Cinematic `#E50914`, Đỏ rực `#FF2E4C`.
  * Màu điểm xuyết: Vàng Golden Star `#FFD700` (đánh giá sao, ghế VIP).
* **Hiệu ứng đặc trưng**:
  * `Cinema Glow`: Màn hình rạp chiếu phát sáng đa chiều (Screen glow).
  * `Glassmorphism`: Nền kính mờ viền sáng (`backdrop-blur-md bg-white/5 border border-white/10`).
  * `Micro-interactions`: Thẻ phim phóng to nhẹ khi hover (`hover:scale-105 transition-all`).

---

## ⚡ 5. Lệnh Thường Dùng (Quick Commands)
```bash
# Khởi chạy server phát triển nội bộ
npm run dev

# Kiểm tra lỗi type và biên dịch dự án
npm run build

# Chạy linter kiểm tra code
npm run lint

# Đẩy code lên GitHub
git add .
git commit -m "feat/fix: mô tả ngắn gọn"
git push origin main
```

---

## 📋 6. Lộ Trình Phát Triển & Trạng Thái Tính Năng (Roadmap)
- [x] Giao diện Trang chủ Cinema Dark Mode chuẩn rạp chiếu
- [x] Hàng phim cuộn ngang (Đang chiếu, Thịnh hành, Sắp ra mắt)
- [x] Modal chi tiết phim kèm trailer YouTube
- [x] Trợ lý ảo AI tư vấn phim tốc độ cao (Groq LPU Llama 3.3)
- [x] Quy trình đặt vé đa bước (Chọn rạp -> Chọn ghế -> Chọn bắp nước -> Xuất vé QR Code)
- [x] Đồng bộ Git & đẩy lên kho lưu trữ GitHub
- [ ] Tích hợp cổng thanh toán giả lập quét mã QR (MoMo / ZaloPay / VietQR)
- [ ] Lưu lịch sử vé đã đặt vào LocalStorage hoặc cơ sở dữ liệu
- [ ] Chức năng lọc phim nâng cao (Thể loại, Năm phát hành, Đánh giá)
- [ ] Triển khai Web lên Vercel để chạy online trên Internet
