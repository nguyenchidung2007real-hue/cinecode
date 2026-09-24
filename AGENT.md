# 🤖 AGENT.md - Bộ Nhớ & Hướng Dẫn Kỹ Thuật Cho AI Coding Agent (Multi-Agent Standard)

> **Dự án**: CineMax AI - Nền Tảng Web Phim & Đặt Vé Rạp Chiếu Thông Minh  
> **Repository**: [https://github.com/nguyenchidung2007real-hue/cinecode](https://github.com/nguyenchidung2007real-hue/cinecode)  
> **Phương pháp phát triển**: Vibe Coding + Multi-Agent Team (Claude Code x Antigravity)  
> **Cập nhật**: Tháng 9/2026 - Tương thích chuẩn Claude Code CLI, Cursor, Windsurf, Codex & Antigravity.

---

## 🎯 1. Vai Trò & Nguyên Tắc Cốt Lõi (Core Principles)
1. **Bảo tồn tính toàn vẹn (Documentation & Code Integrity)**:
   - Tuyệt đối không tự ý xóa bỏ hoặc thay đổi cấu trúc của các tính năng đã hoạt động ổn định.
   - Luôn duy trì cơ chế **Smart Mock Fallback** (`src/lib/mockData.ts`): ứng dụng phải luôn khởi chạy và trải nghiệm mượt mà 100% ngay cả khi người dùng chưa cấu hình API Key.
2. **Quy tắc Vibe Coding UI**:
   - Khóa cứng **Design System** trước khi chỉnh sửa Screen.
   - Tuyệt đối không sửa file thuộc tầng Core/API khi đang thực hiện các Goal về giao diện.
   - Luôn chia nhỏ công việc theo từng **Goal** cụ thể (Goal 1, Goal 2...). Sau mỗi Goal phải chạy `npm run build` để kiểm tra lỗi type.
3. **Phân chia vai trò Multi-Agent**:
   - **Claude Code**: Đóng vai trò Tech Lead & UI Component Builder (thiết kế luồng, viết code React/Tailwind, tối ưu hóa giao diện).
   - **Antigravity**: Đóng vai trò DevOps & Automation Agent (quản lý môi trường, chạy kiểm thử, đồng bộ Git/GitHub, cấu hình API và deployment).

---

## 🛠️ 2. Công Nghệ & Các Module Tốt Nhất (Tech Stack & Best Modules)
* **Frontend Core**: Next.js 14 (App Router) + React 18 + TypeScript.
* **Styling & UI**: Tailwind CSS + Glassmorphism + Cinema Screen Glow + `lucide-react`.
* **AI Streaming Engine**: Groq SDK (`groq-sdk` với Llama 3.3 70B Versatile, Server-Sent Events SSE).
* **Semantic Discovery / Recommendation**: 
  * Transformers.js (`@xenova/transformers`) hoặc Jina Reader Semantic API để hỗ trợ tìm kiếm phim theo tâm trạng (Mood-based search).
* **Mã Vé & Thanh Toán**:
  * `qrcode.react`: Tạo QR Code động cho vé xem phim E-Ticket.
  * VietQR / MoMo Payment Simulator: Tự động tính tiền và sinh mã QR chuyển khoản chính xác.
* **Lưu trữ vé**: Client-side LocalStorage Persistence (`cinemax_tickets`).

---

## 📂 3. Cấu Trúc Thư Mục Chuẩn (Project Structure)
```
/
├── .env.example              # Mẫu biến môi trường
├── .env.local                # Khóa API (GROQ_API_KEY, TMDB_API_KEY)
├── AGENT.md                  # Bộ nhớ & quy tắc cho AI Agent (Tệp này)
├── CLAUDE.md                 # Chỉ dẫn dành riêng cho Claude Code
├── README.md                 # Tài liệu giới thiệu dự án
├── package.json              # Khai báo dependencies
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
    │   ├── Navbar.tsx        # Thanh điều hướng, tìm kiếm nhanh, nút Ví vé
    │   ├── HeroBanner.tsx    # Banner phim bom tấn tiêu điểm kèm trailer
    │   ├── MovieRow.tsx      # Hàng phim cuộn ngang mượt mà
    │   ├── MovieCard.tsx     # Thẻ phim với poster, điểm IMDb, badge chất lượng
    │   ├── MovieModal.tsx    # Modal chi tiết phim, trailer YouTube, diễn viên
    │   ├── BookingModal.tsx  # Trình đặt vé: Chọn rạp, suất chiếu, ghế, bắp nước, QR VietQR, xuất vé
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

## 🎨 4. Quy Chuẩn Thiết Kế Giao Diện (Design System Guidelines)
* **Tone màu chủ đạo**:
  * Nền: Cinema Dark `#0B0C10`, `#14151B`.
  * Màu thương hiệu: Đỏ rực `#E50914`, Đỏ neon `#FF2E4C`.
  * Màu điểm xuyết: Vàng Golden Star `#FFD700` (đánh giá sao, ghế VIP).
* **Hiệu ứng**:
  * `Cinema Glow`: Màn hình rạp chiếu cong phát sáng đa chiều (Screen glow).
  * `Glassmorphism`: Nền kính mờ viền sáng (`backdrop-blur-md bg-white/5 border border-white/10`).
  * `Bo góc chuẩn`: `rounded-xl` cho card phim, `rounded-2xl` cho modal đặt vé.

---

## ⚡ 5. Lệnh Thường Dùng (Commands)
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

## 📋 6. Lộ Trình Tính Năng Chi Tiết (Roadmap & Sprint Goals)
- [x] Giao diện Trang chủ Cinema Dark Mode chuẩn rạp chiếu
- [x] Hàng phim cuộn ngang (Đang chiếu, Thịnh hành, Sắp ra mắt)
- [x] Modal chi tiết phim kèm trailer YouTube
- [x] Trợ lý ảo AI tư vấn phim tốc độ cao (Groq LPU Llama 3.3)
- [x] Quy trình đặt vé: Chọn rạp -> Chọn ghế -> Chọn bắp nước -> Xuất vé QR Code
- [x] Đồng bộ Git & đẩy lên kho lưu trữ GitHub
- [x] **Goal 1**: Bổ sung bộ lọc phim theo tâm trạng (Mood-based Discovery) -> ĐÃ HOÀN THÀNH (Antigravity)
- [x] **Goal 2**: Tích hợp mô phỏng thanh toán quét mã QR (VietQR / MoMo) trước khi xuất vé -> ĐÃ HOÀN THÀNH (Antigravity)
- [x] **Goal 3**: Thêm tính năng "Ví Vé Của Tôi" (My Tickets) lưu trữ trên LocalStorage -> ĐÃ HOÀN THÀNH (Antigravity)
- [x] **Goal 4**: Chatbot phát hiện tâm trạng & Đặt vé nhanh (Claude lo Backend pure services, Antigravity lo UI Quick-Book) -> ĐÃ HOÀN THÀNH (Build 0 lỗi)
- [x] **Goal 5**: Hugging Face Semantic Search & RAG (`src/lib/hfRagService.ts`, `/api/search`, `SemanticSearchModal.tsx`) -> ĐÃ HOÀN THÀNH (Build 0 lỗi)
- [ ] **Goal 6**: Triển khai dự án lên Vercel để chạy online trên Internet & SEO Optimization -> TIẾP THEO




