/**
 * =========================================================================================
 * CINEMAX AI — GOOGLE APPS SCRIPT TỰ ĐỘNG TẠO BẢNG TÍNH GOOGLE SHEETS DỰ ÁN
 * =========================================================================================
 * Dự án: Hệ Thống Đặt Vé Xem Phim Trực Tuyến Tích Hợp AI (CineMax AI)
 * Thành viên (4 người):
 *   1. Nguyễn Chí Dũng   - Trưởng Nhóm / Fullstack Lead & AI
 *   2. Nguyễn Hải Đăng   - Database Architect & Backend
 *   3. Nguyễn Văn Tuấn   - Backend Services & Business Logic
 *   4. Đào Duy Minh      - Frontend Lead, Auth & Scanner Portal
 *   (Đặng Quốc Toản: Đã loại bỏ)
 *
 * HƯỚNG DẪN 3 BƯỚC THỰC HIỆN TRÊN GOOGLE SHEETS:
 * 1. Mở trang Google Sheets mới tại: https://sheets.new
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script
 * 3. Xóa sạch mã mặc định, dán toàn bộ đoạn code này vào rồi bấm nút "Chạy" (Run).
 *    (Cấp quyền truy cập nếu Google hỏi lần đầu).
 * 4. Mở lại tab Google Sheets, toàn bộ 4 trang tính chuẩn chỉ sẽ được tạo tự động trong 5 giây!
 * =========================================================================================
 */

function createCineMaxKickoffSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Màu sắc chủ đạo (CineMax Theme)
  const COLOR_HEADER = "#034EA2";      // Xanh CineMax
  const COLOR_SUBHEADER = "#E0F2FE";   // Xanh nhạt
  const COLOR_SECTION = "#0B2046";     // Xanh đen
  const COLOR_ZEBRA = "#F8FAFC";       // Xám nhẹ
  const COLOR_DONE_BG = "#D1FAE5";     // Xanh lá nhạt
  const COLOR_DONE_FG = "#047857";     // Xanh lá đậm
  
  // 1. TẠO HOẶC LẤY SHEET
  function getOrCreateSheet(title) {
    let sheet = ss.getSheetByName(title);
    if (!sheet) {
      sheet = ss.insertSheet(title);
    } else {
      sheet.clear();
      sheet.clearFormats();
    }
    return sheet;
  }

  // =======================================================================================
  // SHEET 1: THÔNG TIN DỰ ÁN & THÀNH VIÊN
  // =======================================================================================
  const sheet1 = getOrCreateSheet("1. Thong_Tin_Du_An");
  sheet1.setTabColor(COLOR_HEADER);
  
  const data1 = [
  [
    "",
    "BÁO CÁO KHẢO SÁT & ĐẶC TẢ DỰ ÁN PHẦN MỀM"
  ],
  [
    "",
    "Dự án: Hệ Thống Đặt Vé Xem Phim Thông Minh & Quản Trị Rạp Chiếu (CineMax AI)"
  ],
  [
    "",
    "Tài liệu thiết kế chi tiết: WBS Chức Năng, Ma Trận Phân Quyền, Data Dictionary CSDL & Quy Trình Nghiệp Vụ"
  ],
  [
    "",
    "1. THÔNG TIN CHUNG DỰ ÁN"
  ],
  [
    "",
    "Tên đề tài / Dự án",
    "CineMax AI — Nền Tảng Đặt Vé Xem Phim Trực Tuyến Tích Hợp AI"
  ],
  [
    "",
    "Mã dự án",
    "CINEMAX-AI-2026"
  ],
  [
    "",
    "Mô hình phát triển",
    "Agile / Scrum (Sprints 1-4)"
  ],
  [
    "",
    "Đối tượng phục vụ",
    "Khách hàng mua vé, Nhân viên soát vé tại rạp, Quản trị viên cụm rạp"
  ],
  [
    "",
    "Kiến trúc hệ thống",
    "Fullstack Modern Web (Next.js 14 App Router, Serverless Backend, REST API)"
  ],
  [
    "",
    "Công nghệ Frontend",
    "Next.js 14 (React 18), TypeScript, Tailwind CSS, Lucide Icons"
  ],
  [
    "",
    "Công nghệ Backend",
    "Next.js Route Handlers, Node.js Crypto (HMAC-SHA256, timingSafeEqual)"
  ],
  [
    "",
    "Hệ thống lưu trữ (Database)",
    "Upstash Redis REST KV (Distributed Lock, Atomic Lua Scripts, Sets, Hashes)"
  ],
  [
    "",
    "Tích hợp AI & Dịch vụ ngoài",
    "Groq AI (Llama 3.3 70B NLP), HuggingFace RAG, TMDB Live API v3, VietQR Banking"
  ],
  [
    "",
    "Kiểm thử chất lượng",
    "Playwright E2E Testing, 37/37 Automated Module Unit & Integration Tests"
  ],
  [
    "",
    "2. DANH SÁCH THÀNH VIÊN VÀ PHÂN CÔNG TRÁCH NHIỆM"
  ],
  [
    "",
    "STT",
    "Họ và Tên",
    "Vai Trò / Vị Trí",
    "Phân Hệ Phụ Trách",
    "Nhiệm Vụ Cụ Thể Trong Dự Án",
    "Ghi Chú"
  ],
  [
    "",
    "1",
    "Nguyễn Chí Dũng",
    "Trưởng Nhóm / Fullstack Lead & AI Integration",
    "Toàn hệ thống & AI Engine",
    "Quản lý mã nguồn (Git Repo), Kiến trúc tổng thể hệ thống, Tích hợp TMDB API & Groq AI Chatbot, Xây dựng Semantic Search RAG, Tối ưu hóa UI/UX Home & Booking Modal.",
    "Trưởng nhóm"
  ],
  [
    "",
    "2",
    "Nguyễn Hải Đăng",
    "Database Architect & Backend Engineer",
    "Cơ Sở Dữ Liệu & Concurrency",
    "Thiết kế cấu trúc CSDL Upstash Redis (Hash, Set, Key patterns), Viết các kịch bản Lua Script giữ ghế nguyên tử (hold/commit), Quản lý phân tán khóa phòng chiếu (Distributed Mutex).",
    "Thành viên chính"
  ],
  [
    "",
    "3",
    "Nguyễn Văn Tuấn",
    "Backend Services & Business Logic Engineer",
    "Engine Nghiệp Vụ & Báo Cáo",
    "Xây dựng Showtime Collision Engine (xử lý va chạm lịch chiếu), Thuật toán Orphan Seat Rule (chống ghế mồ côi), Module F&B Upsell & Pricing Engine, API Thống kê doanh thu rạp.",
    "Thành viên chính"
  ],
  [
    "",
    "4",
    "Đào Duy Minh",
    "Frontend Lead & Security Engineer",
    "Giao Diện, Auth & Scanner",
    "Phát triển Cổng Quản trị Admin (/admin), Xây dựng Cổng Nhân viên Soát vé (/scanner), Bảo mật vé với chữ ký số HMAC-SHA256, Cơ chế phiên đăng nhập Admin HttpOnly Cookie.",
    "Thành viên chính"
  ]
];

  if (data1.length > 0) {
    sheet1.getRange(1, 1, data1.length, Math.max(...data1.map(r => r.length))).setValues(
      data1.map(r => {
        const maxLen = Math.max(...data1.map(row => row.length));
        const newR = [...r];
        while (newR.length < maxLen) newR.push("");
        return newR;
      })
    );
  }

  // Định dạng Sheet 1
  sheet1.getRange("A2").setFontSize(15).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet1.getRange("A3").setFontSize(12).setFontWeight("bold").setFontColor("#0070BA");
  sheet1.getRange("A4").setFontSize(10).setFontItalic(true).setFontColor("#555555");
  sheet1.getRange("A6").setFontSize(12).setFontWeight("bold").setFontColor(COLOR_SECTION);
  sheet1.getRange("A18").setFontSize(12).setFontWeight("bold").setFontColor(COLOR_SECTION);

  // Header bảng thành viên (dòng 19)
  const memberHeaderRange = sheet1.getRange("A19:F19");
  memberHeaderRange.setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet1.getRange("A19:F23").setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
  sheet1.getRange("A20:F23").setWrap(true).setVerticalAlignment("middle");

  sheet1.setColumnWidth(1, 60);
  sheet1.setColumnWidth(2, 180);
  sheet1.setColumnWidth(3, 240);
  sheet1.setColumnWidth(4, 200);
  sheet1.setColumnWidth(5, 420);
  sheet1.setColumnWidth(6, 120);


  // =======================================================================================
  // SHEET 2: BẢNG KHẢO SÁT CHỨC NĂNG (WBS / SRS)
  // =======================================================================================
  const sheet2 = getOrCreateSheet("2. Khao_Sat_Chuc_Nang_WBS");
  sheet2.setTabColor("#0284C7");
  
  const data2 = [
  [
    "",
    "BẢNG KHẢO SÁT & PHÂN RÃ CHỨC NĂNG CHI TIẾT (WBS / SRS MATRIX)"
  ],
  [
    "",
    "Chi tiết ma trận phân quyền 3 tầng (Admin - Nhân viên - Khách hàng), luồng thao tác và phân công phụ trách"
  ],
  [
    "",
    "Mã CN",
    "Phân Quyền",
    "Module / Nhóm CN",
    "Tên Chức Năng",
    "Mô Tả Luồng Xử Lý & Yêu Cầu Giao Diện",
    "Quy Chuẩn Kỹ Thuật / Nghiệp Vụ",
    "Người Phụ Trách",
    "Trạng Thái"
  ],
  [
    "",
    "ADM-01",
    "Quản Trị Viên (Admin)",
    "Xác Thực & Bảo Mật",
    "Đăng nhập trang Quản trị",
    "Form nhập mật khẩu quản trị (/admin/login). Khóa tạm thời 5 phút sau 8 lần nhập sai. Sau khi đăng nhập cấp cookie phiên HMAC HttpOnly.",
    "POST /api/auth/admin-login; biến ADMIN_LOGIN_PASSWORD; Chống Brute Force.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-02",
    "Quản Trị Viên (Admin)",
    "Xác Thực & Bảo Mật",
    "Đăng xuất quản trị",
    "Nút bấm Đăng xuất trên thanh tiêu đề Admin, xóa sạch cookie phiên và chuyển hướng về trang login.",
    "POST /api/auth/admin-logout; Max-Age=0 cookie deletion.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-03",
    "Quản Trị Viên (Admin)",
    "Quản Lý Phim",
    "Xem danh sách & Lọc phim",
    "Hiển thị bảng danh sách phim đang chiếu / sắp chiếu kèm ảnh poster, thể loại, thời lượng, độ tuổi (T18, T16, P). Cho phép tìm kiếm nhanh theo tên phim.",
    "Phân trang 15/30/45 bản ghi; Sort theo tên, thời lượng, ngày phát hành; Fetch từ API/Local.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-04",
    "Quản Trị Viên (Admin)",
    "Quản Lý Suất Chiếu",
    "Tạo suất chiếu mới (Kiểm tra va chạm)",
    "Form chọn rạp, phòng chiếu, phim, ngày và giờ chiếu. Hệ thống tự động kích hoạt Engine kiểm tra va chạm phòng chiếu.",
    "Showtime Collision Engine: Tự động cộng 10p trailer + 15p dọn phòng [start, start+duration+25). Báo lỗi 409 nếu đè giờ và đề xuất 3 khung giờ trống gần nhất.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-05",
    "Quản Trị Viên (Admin)",
    "Quản Lý Suất Chiếu",
    "Xóa / Hủy suất chiếu (Thùng rác)",
    "Nút xóa suất chiếu đơn lẻ hoặc hàng loạt. Hỗ trợ chuyển vào thùng rác Soft Delete để khôi phục khi cần, tránh mất mát dữ liệu vé đã bán.",
    "DELETE /api/admin/showtimes; Thu hồi khóa phòng trong Upstash Redis; Void các vé liên quan.",
    "Nguyễn Hải Đăng",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-06",
    "Quản Trị Viên (Admin)",
    "Quản Lý Suất Chiếu",
    "Đồng bộ lịch chiếu Beta Cinemas",
    "Nút bấm 'Đồng bộ Beta Cinemas' tự động crawl lịch chiếu chuẩn từ cụm rạp Beta Xuân Thủy và đưa vào hệ thống quản lý.",
    "POST /api/admin/sync-beta; Header Authorization: Bearer <ADMIN_SYNC_SECRET>; Background Sync.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-07",
    "Quản Trị Viên (Admin)",
    "Quản Lý Vé & Đơn Hàng",
    "Xem danh sách vé toàn hệ thống",
    "Hiển thị bảng toàn bộ vé đã xuất: Mã vé, Khách hàng, SĐT, Phim, Suất, Ghế, Tổng tiền, Trạng thái (valid, used, void).",
    "Phân trang, lọc theo trạng thái vé, tìm kiếm theo số điện thoại hoặc mã vé, sắp xếp theo thời gian đặt.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-08",
    "Quản Trị Viên (Admin)",
    "Quản Lý F&B / Bắp Nước",
    "Quản lý danh mục Combo & Giá",
    "Cấu hình các gói Combo (Beta Solo, Couple, Party), giá bán lẻ, các vị bắp (ngọt, phô mai, caramel) và kích cỡ nước ngọt.",
    "F&B Upsell Catalog; Chống gian lận số lượng vị bắp vượt quá số ngăn cho phép.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-09",
    "Quản Trị Viên (Admin)",
    "Khuyến Mãi & Voucher",
    "Quản lý Mã Giảm Giá",
    "Tạo mã voucher (VD: SINHVIEN20, BETA50K), thiết lập hạn mức giảm (% hoặc số tiền), giá trị đơn tối thiểu, số lượt dùng tối đa và ngày hết hạn.",
    "Kiểm tra tính hợp lệ tại giỏ hàng; Soft delete mã giảm giá; Thống kê số lần kích hoạt.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "ADM-10",
    "Quản Trị Viên (Admin)",
    "Thống Kê & Báo Cáo",
    "Dashboard Thống kê Doanh thu",
    "Hiển thị các thẻ chỉ số KPI: Tổng doanh thu, Số vé đã bán, Tỷ lệ lấp đầy ghế, Top 5 phim bán chạy nhất. Biểu đồ trực quan theo ngày/tuần/tháng.",
    "Aggregated Metrics từ Ticket Store; Tính toán doanh thu thực tế; Phân loại theo cụm rạp.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "STF-01",
    "Nhân Viên (Staff)",
    "Xác Thực Nhân Viên",
    "Đăng nhập cổng soát vé",
    "Nhân viên nhập Mã nhân viên (Staff ID) và Mật khẩu (Passcode) tại màn hình /scanner để kích hoạt quyền soát vé ca trực.",
    "Biến môi trường STAFF_ACCOUNTS (MãNV:Passcode:HọTên); Server tự gán scannedByLabel chống giả mạo.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "STF-02",
    "Nhân Viên (Staff)",
    "Soát Vé Điện Tử",
    "Quét mã QR soát vé bằng Camera",
    "Giao diện kích hoạt Camera thiết bị (điện thoại/laptop), tự động căn khung quét mã QR trên vé khách hàng mang đến rạp.",
    "Tự động giải mã chuỗi định dạng 'cinemax:ticket:bk-xxxx:HMAC_TOKEN'; Báo rung/âm thanh khi quét thành công.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "STF-03",
    "Nhân Viên (Staff)",
    "Soát Vé Điện Tử",
    "Xác thực tính toàn vẹn vé & Chống giả",
    "Server băm lại HMAC-SHA256(bookingId + secret) và dùng timingSafeEqual so sánh. Nếu vé bị sửa đổi mã vé -> Báo vé giả mạo ngay lập tức.",
    "POST /api/tickets/check-in; HMAC Signature Verification; Status chuyển từ 'valid' sang 'used'.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "STF-04",
    "Nhân Viên (Staff)",
    "Soát Vé Điện Tử",
    "Chống quét trùng vé (Anti-Replay)",
    "Nếu vé đã được quét trước đó, màn hình cảnh báo đỏ rực: 'VÉ ĐÃ SỬ DỤNG' kèm thời gian quét và tên nhân viên đã soát trước đó.",
    "Redis SETNX cinemax:ticket:used:<id> đảm bảo nguyên tử, dù 2 nhân viên quét cùng 1 giây vẫn chỉ 1 máy báo hợp lệ.",
    "Nguyễn Hải Đăng",
    "Hoàn thành"
  ],
  [
    "",
    "STF-05",
    "Nhân Viên (Staff)",
    "Tra Cứu Vé",
    "Tra cứu thủ công khi điện thoại khách hết pin",
    "Ô nhập liệu nhanh cho phép nhân viên gõ Mã đặt vé (bookingId) hoặc Số điện thoại người mua để kiểm tra thông tin vé trên hệ thống.",
    "GET /api/tickets/[id]; Hiển thị chi tiết số ghế, phòng chiếu, tên phim để nhân viên đối soát thực tế.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-01",
    "Khách Hàng (Customer)",
    "Khám Phá Phim",
    "Xem danh mục phim chuẩn thương mại",
    "Trang chủ hiển thị danh sách phim theo tab chuẩn CGV/Galaxy: Đang Chiếu, Sắp Chiếu, Suất Chiếu Đặc Biệt. Dữ liệu live từ TMDB + phim rạp Việt.",
    "GET /api/movies?category=all; Caching s-maxage=120; Lọc theo thể loại, độ tuổi, tìm kiếm nhanh theo tiêu đề.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-02",
    "Khách Hàng (Customer)",
    "AI Hỗ Trợ",
    "Tìm kiếm thông minh Spotlight (RAG)",
    "Nhấn Ctrl+K mở thanh tìm kiếm Spotlight AI. Người dùng có thể gõ câu hỏi tự nhiên (VD: 'phim hành động cháy nổ xem cùng bạn gái').",
    "Hugging Face Semantic Search RAG; Trích xuất đặc trưng câu hỏi và so khớp ngữ nghĩa với mô tả phim.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-03",
    "Khách Hàng (Customer)",
    "AI Hỗ Trợ",
    "CineBot AI tư vấn phim theo cảm xúc",
    "Widget Chatbot góc phải màn hình. Khách nhắn tin trò chuyện về tâm trạng (stress, buồn, hẹn hò), AI phân tích và đề xuất phim kèm gợi ý ghế.",
    "Groq LPU Llama 3.3 70B (~500 tokens/s); Trích xuất party size; Nút bấm chọn phim vào thẳng sơ đồ ghế 1-click.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-04",
    "Khách Hàng (Customer)",
    "Đặt Vé",
    "Thanh Đặt Vé Nhanh (Quick Booking Bar)",
    "Thanh điều hướng 1-Click: Chọn Phim -> Chọn Cụm Rạp -> Chọn Ngày (Hôm nay, Ngày mai, Ngày kia) -> Chọn Suất -> Nút 'MUA VÉ NGAY'.",
    "Auto-select suất chiếu khả dụng; Tự động truyền initialShowtimeId vào modal chọn ghế.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-05",
    "Khách Hàng (Customer)",
    "Đặt Vé",
    "Modal Đặt Vé Bước 1: Chọn Rạp & Suất",
    "Hiển thị danh sách cụm rạp (Beta Xuân Thủy, CGV Bà Triệu, Lotte Keangnam...), các ngày chiếu và khung giờ chiếu (2D, IMAX, ScreenX).",
    "Tự động ẩn suất đã qua giờ chiếu; Tự động chuyển Ngày mai nếu hôm nay đã hết suất; Nút Tiếp tục chọn ghế kích hoạt tức thì.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-06",
    "Khách Hàng (Customer)",
    "Chọn Ghế",
    "Sơ đồ 102 ghế chuẩn Beta Cinemas",
    "Hiển thị trực quan ma trận ghế 9 hàng A-K x 12 cột. Phân tầng màu sắc: Ghế Standard (55k), Ghế VIP (75k), Ghế Đôi Sweetbox hàng K (130k).",
    "Trạng thái ghế thời gian thực (Trống, Đang giữ, Đã bán); Hỗ trợ chọn tối đa 8 ghế/lần đặt.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-07",
    "Khách Hàng (Customer)",
    "Chọn Ghế",
    "Thuật toán chống ghế mồ côi (Orphan Seat Rule)",
    "Ngăn chặn khách hàng để trống 1 ghế đơn độc ở đầu hàng, cuối hàng hoặc kẹp giữa 2 người khác, tối ưu hóa công suất lấp đầy phòng chiếu.",
    "Orphan Seat Rule Engine: Cảnh báo đỏ tức thì và chặn bấm Tiếp tục nếu vi phạm; Miễn trừ thông minh nếu ghế mồ côi đã có từ trước.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-08",
    "Khách Hàng (Customer)",
    "Chọn Ghế",
    "Mô phỏng góc nhìn rạp 3D (View From Seat)",
    "Bấm vào ghế để xem mô phỏng góc nhìn thực tế lên màn chiếu từ vị trí hàng ghế đó, giúp khách chọn được vị trí ưng ý nhất.",
    "Canvas 3D Projection Engine; Hiển thị góc nhìn trung tâm Sweet Spot (Hàng E, F).",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-09",
    "Khách Hàng (Customer)",
    "Giữ Ghế",
    "Cơ chế giữ ghế nguyên tử 300 giây (Seat Hold)",
    "Khi khách chọn ghế, hệ thống lập tức khóa các ghế đó trong 300s với đồng hồ đếm ngược. Trong thời gian này, không ai khác được phép chọn trùng.",
    "POST /api/seats/hold; Upstash Redis Lua Script; Khóa nguyên tử chống Overbooking; Tự động giải phóng khi hết 300s.",
    "Nguyễn Hải Đăng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-10",
    "Khách Hàng (Customer)",
    "Bắp Nước (F&B)",
    "Tùy biến vị bắp & Upsize nước ngọt",
    "Chọn combo bắp nước: Hỗ trợ chọn vị bắp (Ngọt truyền thống, Phô mai +10k, Caramel +10k) theo số ngăn và Upsize ly khổng lồ 32oz (+12k).",
    "Catalog Concession Combos; Tự động tính toán phụ phí minh bạch vào tổng tiền vé.",
    "Nguyễn Văn Tuấn",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-11",
    "Khách Hàng (Customer)",
    "Thanh Toán",
    "Thanh toán QR Code VietQR & MoMo",
    "Tạo mã VietQR động chứa chính xác số tiền, số tài khoản và nội dung chuyển khoản mã vé. Khách chỉ cần mở app ngân hàng quét mã 1 giây.",
    "Chuẩn Napas 247 VietQR; Hỗ trợ nút sao chép nhanh số tài khoản & nội dung thanh toán.",
    "Nguyễn Chí Dũng",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-12",
    "Khách Hàng (Customer)",
    "Vé Điện Tử",
    "Xuất vé QR Code kèm Chữ Ký Số HMAC",
    "Sau khi hoàn tất, hệ thống render Vé điện tử hiển thị mã QR chống vé giả, số ghế, phòng chiếu, hướng dẫn vào rạp và nút Tải vé về máy.",
    "Thư viện qrcode; Token mã hóa HMAC; Tự động lưu trữ vé vào Ví vé khách hàng.",
    "Đào Duy Minh",
    "Hoàn thành"
  ],
  [
    "",
    "CUS-13",
    "Khách Hàng (Customer)",
    "Ví Vé Của Tôi",
    "Quản lý lịch sử vé xem phim (/dashboard)",
    "Trang Dashboard cá nhân bảo vệ bằng số điện thoại. Khách xem lại toàn bộ các vé đã mua, xem mã QR để soát vé tại rạp, trạng thái vé.",
    "Phone Authentication Gate; Tra cứu vé theo SĐT bằng Replay Idempotency; Phân loại vé Đã dùng / Chưa dùng.",
    "Đào Duy Minh",
    "Hoàn thành"
  ]
];

  if (data2.length > 0) {
    const maxCols2 = Math.max(...data2.map(r => r.length));
    sheet2.getRange(1, 1, data2.length, maxCols2).setValues(
      data2.map(r => {
        const newR = [...r];
        while (newR.length < maxCols2) newR.push("");
        return newR;
      })
    );
  }

  // Định dạng Sheet 2
  sheet2.getRange("A2").setFontSize(15).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet2.getRange("A3").setFontSize(11).setFontItalic(true).setFontColor("#555555");
  
  // Header WBS (dòng 5)
  const wbsHeader = sheet2.getRange(5, 1, 1, 8);
  wbsHeader.setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet2.setFrozenRows(5);

  const numRows2 = data2.length;
  if (numRows2 >= 6) {
    const dataRange2 = sheet2.getRange(6, 1, numRows2 - 5, 8);
    dataRange2.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
    dataRange2.setWrap(true).setVerticalAlignment("middle");

    // Format zebra rows & status column
    for (let r = 6; r <= numRows2; r++) {
      if (r % 2 === 0) {
        sheet2.getRange(r, 1, 1, 8).setBackground(COLOR_ZEBRA);
      }
      const statusCell = sheet2.getRange(r, 8);
      if (statusCell.getValue() === "Hoàn thành") {
        statusCell.setBackground(COLOR_DONE_BG).setFontColor(COLOR_DONE_FG).setFontWeight("bold").setHorizontalAlignment("center");
      }
    }
  }

  sheet2.setColumnWidth(1, 90);   // Mã CN
  sheet2.setColumnWidth(2, 170);  // Phân quyền
  sheet2.setColumnWidth(3, 170);  // Nhóm chức năng
  sheet2.setColumnWidth(4, 230);  // Tên chức năng
  sheet2.setColumnWidth(5, 380);  // Mô tả luồng xử lý
  sheet2.setColumnWidth(6, 320);  // Kỹ thuật / API
  sheet2.setColumnWidth(7, 140);  // Người phụ trách
  sheet2.setColumnWidth(8, 110);  // Trạng thái


  // =======================================================================================
  // SHEET 3: THIẾT KẾ CSDL CHI TIẾT (DATA DICTIONARY 11 BẢNG)
  // =======================================================================================
  const sheet3 = getOrCreateSheet("3. Thiet_Ke_CSDL_Chi_Tiet");
  sheet3.setTabColor("#0D9488");
  
  const data3 = [
  [
    "",
    "TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU CHI TIẾT (DATA DICTIONARY & ERD)"
  ],
  [
    "",
    "Chi tiết toàn bộ bảng, cấu trúc trường, kiểu dữ liệu, khóa chính, khóa ngoại và ràng buộc toàn vẹn"
  ],
  [
    "",
    "Tên Bảng",
    "Tên Cột (Field)",
    "Kiểu Dữ Liệu",
    "Độ Dài / Định Dạng",
    "Khóa (Key)",
    "Null?",
    "Giá Trị Mặc Định",
    "Mô Tả Nghiệp Vụ & Ràng Buộc"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: USERS"
  ],
  [
    "",
    "users",
    "id",
    "VARCHAR",
    "36",
    "PK",
    "No",
    "UUIDv4",
    "Mã định danh duy nhất của tài khoản"
  ],
  [
    "",
    "users",
    "full_name",
    "VARCHAR",
    "100",
    "",
    "No",
    "None",
    "Họ và tên người dùng"
  ],
  [
    "",
    "users",
    "email",
    "VARCHAR",
    "150",
    "",
    "Yes",
    "None",
    "Địa chỉ email (duy nhất nếu có)"
  ],
  [
    "",
    "users",
    "phone",
    "VARCHAR",
    "15",
    "",
    "No",
    "None",
    "Số điện thoại định danh người dùng (Unique)"
  ],
  [
    "",
    "users",
    "password_hash",
    "VARCHAR",
    "255",
    "",
    "Yes",
    "None",
    "Mật khẩu đã băm (dành cho Admin/Staff)"
  ],
  [
    "",
    "users",
    "role",
    "TINYINT",
    "1",
    "",
    "No",
    "0",
    "Phân quyền: 0=Customer, 1=Staff, 2=Admin"
  ],
  [
    "",
    "users",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'active'",
    "Trạng thái: 'active', 'locked', 'suspended'"
  ],
  [
    "",
    "users",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm tạo tài khoản"
  ],
  [
    "",
    "users",
    "updated_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm cập nhật gần nhất"
  ],
  [
    "",
    "users",
    "deleted_at",
    "TIMESTAMP",
    "",
    "",
    "Yes",
    "NULL",
    "Thời điểm xóa mềm (Soft delete)"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: CINEMAS"
  ],
  [
    "",
    "cinemas",
    "id",
    "VARCHAR",
    "50",
    "PK",
    "No",
    "None",
    "Mã rạp (VD: 'beta-cinemas-xuan-thuy')"
  ],
  [
    "",
    "cinemas",
    "name",
    "VARCHAR",
    "150",
    "",
    "No",
    "None",
    "Tên cụm rạp (VD: 'Beta Cinemas Xuân Thủy')"
  ],
  [
    "",
    "cinemas",
    "address",
    "VARCHAR",
    "255",
    "",
    "No",
    "None",
    "Địa chỉ thực tế của rạp"
  ],
  [
    "",
    "cinemas",
    "city",
    "VARCHAR",
    "50",
    "",
    "No",
    "None",
    "Tỉnh / Thành phố (Hà Nội, TP.HCM...)"
  ],
  [
    "",
    "cinemas",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'active'",
    "Trạng thái hoạt động của rạp"
  ],
  [
    "",
    "cinemas",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm thêm rạp"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: ROOMS"
  ],
  [
    "",
    "rooms",
    "id",
    "VARCHAR",
    "60",
    "PK",
    "No",
    "None",
    "Mã phòng chiếu duy nhất"
  ],
  [
    "",
    "rooms",
    "cinema_id",
    "VARCHAR",
    "50",
    "FK",
    "No",
    "None",
    "Khóa ngoại tham chiếu bảng cinemas(id)"
  ],
  [
    "",
    "rooms",
    "room_name",
    "VARCHAR",
    "100",
    "",
    "No",
    "None",
    "Tên phòng chiếu (Phòng Beta 01 Dolby 7.1)"
  ],
  [
    "",
    "rooms",
    "total_seats",
    "INT",
    "",
    "",
    "No",
    "102",
    "Tổng số ghế trong phòng (chuẩn 102 ghế)"
  ],
  [
    "",
    "rooms",
    "room_type",
    "VARCHAR",
    "30",
    "",
    "No",
    "'Standard'",
    "Loại phòng: Standard, IMAX Laser, ScreenX"
  ],
  [
    "",
    "rooms",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'active'",
    "Trạng thái phòng chiếu: active, maintenance"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: MOVIES"
  ],
  [
    "",
    "movies",
    "id",
    "VARCHAR",
    "60",
    "PK",
    "No",
    "None",
    "Mã phim (VD: 'dune-2', 'lat-mat-7', 'tmdb-939243')"
  ],
  [
    "",
    "movies",
    "title",
    "VARCHAR",
    "255",
    "",
    "No",
    "None",
    "Tiêu đề phim phát hành tại Việt Nam"
  ],
  [
    "",
    "movies",
    "original_title",
    "VARCHAR",
    "255",
    "",
    "Yes",
    "None",
    "Tiêu đề gốc tiếng Anh/quốc tế"
  ],
  [
    "",
    "movies",
    "overview",
    "TEXT",
    "",
    "",
    "Yes",
    "None",
    "Nội dung tóm tắt phim"
  ],
  [
    "",
    "movies",
    "poster_url",
    "VARCHAR",
    "500",
    "",
    "Yes",
    "None",
    "Đường dẫn ảnh áp phích (Poster CDN)"
  ],
  [
    "",
    "movies",
    "backdrop_url",
    "VARCHAR",
    "500",
    "",
    "Yes",
    "None",
    "Đường dẫn ảnh bìa ngang (Backdrop CDN)"
  ],
  [
    "",
    "movies",
    "duration_minutes",
    "INT",
    "",
    "",
    "No",
    "120",
    "Thời lượng phim tính bằng phút"
  ],
  [
    "",
    "movies",
    "release_date",
    "DATE",
    "",
    "",
    "Yes",
    "None",
    "Ngày công chiếu chính thức"
  ],
  [
    "",
    "movies",
    "age_rating",
    "VARCHAR",
    "10",
    "",
    "No",
    "'T18'",
    "Phân loại độ tuổi: P, T13, T16, T18"
  ],
  [
    "",
    "movies",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'now_playing'",
    "Trạng thái: now_playing, upcoming, trending"
  ],
  [
    "",
    "movies",
    "vote_average",
    "DECIMAL",
    "3,1",
    "",
    "No",
    "0.0",
    "Điểm đánh giá trung bình (1-10)"
  ],
  [
    "",
    "movies",
    "trailer_youtube_id",
    "VARCHAR",
    "30",
    "",
    "Yes",
    "None",
    "Mã định danh video trailer trên YouTube"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: SHOWTIMES"
  ],
  [
    "",
    "showtimes",
    "id",
    "VARCHAR",
    "64",
    "PK",
    "No",
    "None",
    "Mã suất chiếu (VD: 'st-beta-1', 'st-xxxx')"
  ],
  [
    "",
    "showtimes",
    "movie_id",
    "VARCHAR",
    "60",
    "FK",
    "No",
    "None",
    "Tham chiếu bảng movies(id)"
  ],
  [
    "",
    "showtimes",
    "cinema_id",
    "VARCHAR",
    "50",
    "FK",
    "No",
    "None",
    "Tham chiếu bảng cinemas(id)"
  ],
  [
    "",
    "showtimes",
    "room_name",
    "VARCHAR",
    "100",
    "",
    "No",
    "None",
    "Tên phòng tổ chức chiếu phim"
  ],
  [
    "",
    "showtimes",
    "show_date",
    "DATE",
    "",
    "",
    "No",
    "None",
    "Ngày chiếu (YYYY-MM-DD theo giờ Việt Nam)"
  ],
  [
    "",
    "showtimes",
    "show_time",
    "VARCHAR",
    "5",
    "",
    "No",
    "None",
    "Giờ bắt đầu chiếu (HH:mm)"
  ],
  [
    "",
    "showtimes",
    "format",
    "VARCHAR",
    "30",
    "",
    "No",
    "'2D Phụ Đề'",
    "Định dạng: 2D Phụ Đề, 2D Lồng Tiếng, IMAX, 4DX"
  ],
  [
    "",
    "showtimes",
    "duration_minutes",
    "INT",
    "",
    "",
    "No",
    "120",
    "Thời lượng phim dùng để tính va chạm phòng"
  ],
  [
    "",
    "showtimes",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm tạo suất chiếu"
  ],
  [
    "",
    "showtimes",
    "deleted_at",
    "TIMESTAMP",
    "",
    "",
    "Yes",
    "NULL",
    "Thời điểm xóa mềm suất chiếu"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: SEAT_LAYOUTS"
  ],
  [
    "",
    "seat_layouts",
    "seat_id",
    "VARCHAR",
    "5",
    "PK",
    "No",
    "None",
    "Tên ghế theo sơ đồ (A1..H12, K1..K6)"
  ],
  [
    "",
    "seat_layouts",
    "row_label",
    "VARCHAR",
    "2",
    "",
    "No",
    "None",
    "Ký tự hàng ghế: A, B, C, D, E, F, G, H, K"
  ],
  [
    "",
    "seat_layouts",
    "seat_number",
    "TINYINT",
    "",
    "",
    "No",
    "None",
    "Số thứ tự trong hàng (1 đến 12)"
  ],
  [
    "",
    "seat_layouts",
    "seat_tier",
    "VARCHAR",
    "20",
    "",
    "No",
    "'standard'",
    "Phân tầng ghế: standard (55k), vip (75k), couple (130k)"
  ],
  [
    "",
    "seat_layouts",
    "is_sweet_spot",
    "BOOLEAN",
    "",
    "",
    "No",
    "FALSE",
    "Đánh dấu ghế vị trí vàng trung tâm (Hàng E, F)"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: SEAT_HOLDS"
  ],
  [
    "",
    "seat_holds",
    "hold_id",
    "VARCHAR",
    "32",
    "PK",
    "No",
    "None",
    "Mã phiên giữ ghế (CSPRNG 16-byte hex)"
  ],
  [
    "",
    "seat_holds",
    "showtime_id",
    "VARCHAR",
    "64",
    "FK",
    "No",
    "None",
    "Suất chiếu đang thực hiện giữ ghế"
  ],
  [
    "",
    "seat_holds",
    "seats_json",
    "TEXT",
    "",
    "",
    "No",
    "None",
    "Mảng danh sách các ghế đang giữ (VD: ['E5', 'E6'])"
  ],
  [
    "",
    "seat_holds",
    "created_at",
    "BIGINT",
    "",
    "",
    "No",
    "None",
    "Timestamp epoch ms thời điểm bắt đầu giữ ghế"
  ],
  [
    "",
    "seat_holds",
    "expires_at",
    "BIGINT",
    "",
    "",
    "No",
    "None",
    "Timestamp hết hạn TTL (300 giây = 5 phút)"
  ],
  [
    "",
    "seat_holds",
    "client_ip",
    "VARCHAR",
    "45",
    "",
    "Yes",
    "None",
    "Địa chỉ IP hoặc danh tính phiên của khách hàng"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: BOOKINGS"
  ],
  [
    "",
    "bookings",
    "booking_id",
    "VARCHAR",
    "32",
    "PK",
    "No",
    "None",
    "Mã đơn đặt vé duy nhất (bk-xxxxxxxx)"
  ],
  [
    "",
    "bookings",
    "hold_id",
    "VARCHAR",
    "32",
    "",
    "No",
    "None",
    "Mã phiên giữ ghế tương ứng để đối soát Idempotent"
  ],
  [
    "",
    "bookings",
    "showtime_id",
    "VARCHAR",
    "64",
    "FK",
    "No",
    "None",
    "Suất chiếu được đặt"
  ],
  [
    "",
    "bookings",
    "customer_name",
    "VARCHAR",
    "150",
    "",
    "No",
    "None",
    "Họ tên người mua vé"
  ],
  [
    "",
    "bookings",
    "customer_phone",
    "VARCHAR",
    "15",
    "",
    "No",
    "None",
    "Số điện thoại nhận vé & tra cứu"
  ],
  [
    "",
    "bookings",
    "customer_email",
    "VARCHAR",
    "150",
    "",
    "Yes",
    "None",
    "Email nhận vé điện tử"
  ],
  [
    "",
    "bookings",
    "seats_summary",
    "VARCHAR",
    "100",
    "",
    "No",
    "None",
    "Chuỗi danh sách ghế (VD: 'E5, E6')"
  ],
  [
    "",
    "bookings",
    "ticket_amount",
    "INT",
    "",
    "",
    "No",
    "0",
    "Tiền vé xem phim (VNĐ)"
  ],
  [
    "",
    "bookings",
    "concession_amount",
    "INT",
    "",
    "",
    "No",
    "0",
    "Tiền bắp nước mua kèm (VNĐ)"
  ],
  [
    "",
    "bookings",
    "discount_amount",
    "INT",
    "",
    "",
    "No",
    "0",
    "Số tiền được giảm giá qua voucher (VNĐ)"
  ],
  [
    "",
    "bookings",
    "total_amount",
    "INT",
    "",
    "",
    "No",
    "None",
    "Tổng tiền thanh toán cuối cùng (Server xác thực)"
  ],
  [
    "",
    "bookings",
    "payment_method",
    "VARCHAR",
    "20",
    "",
    "No",
    "'vietqr'",
    "Phương thức: 'vietqr', 'momo', 'counter'"
  ],
  [
    "",
    "bookings",
    "payment_status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'paid'",
    "Trạng thái thanh toán: unpaid, paid, refunded"
  ],
  [
    "",
    "bookings",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm tạo đơn thành công"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: TICKETS"
  ],
  [
    "",
    "tickets",
    "booking_id",
    "VARCHAR",
    "32",
    "PK, FK",
    "No",
    "None",
    "Khóa ngoại tham chiếu chính xác bookings(booking_id)"
  ],
  [
    "",
    "tickets",
    "qr_token",
    "VARCHAR",
    "255",
    "",
    "No",
    "None",
    "Chuỗi ký số HMAC-SHA256 chống làm giả vé"
  ],
  [
    "",
    "tickets",
    "ticket_status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'valid'",
    "Trạng thái: pending, valid, used, void"
  ],
  [
    "",
    "tickets",
    "scanned_at",
    "TIMESTAMP",
    "",
    "",
    "Yes",
    "NULL",
    "Thời điểm nhân viên quét vé vào rạp"
  ],
  [
    "",
    "tickets",
    "scanned_by",
    "VARCHAR",
    "100",
    "",
    "Yes",
    "NULL",
    "Tên hoặc Mã nhân viên đã thực hiện soát vé"
  ],
  [
    "",
    "tickets",
    "void_reason",
    "VARCHAR",
    "255",
    "",
    "Yes",
    "NULL",
    "Lý do hủy vé nếu trạng thái là void"
  ],
  [
    "",
    "tickets",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm phát hành vé"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: VOUCHERS"
  ],
  [
    "",
    "vouchers",
    "code",
    "VARCHAR",
    "30",
    "PK",
    "No",
    "None",
    "Mã khuyến mãi (VD: 'SINHVIEN20', 'CINE10K')"
  ],
  [
    "",
    "vouchers",
    "title",
    "VARCHAR",
    "150",
    "",
    "No",
    "None",
    "Tên chương trình ưu đãi"
  ],
  [
    "",
    "vouchers",
    "discount_type",
    "VARCHAR",
    "10",
    "",
    "No",
    "'percent'",
    "Loại giảm giá: 'percent' hoặc 'fixed'"
  ],
  [
    "",
    "vouchers",
    "discount_value",
    "INT",
    "",
    "",
    "No",
    "None",
    "Giá trị giảm (VD: 20% hoặc 20000 VNĐ)"
  ],
  [
    "",
    "vouchers",
    "min_order_value",
    "INT",
    "",
    "",
    "No",
    "0",
    "Giá trị đơn hàng tối thiểu để áp dụng"
  ],
  [
    "",
    "vouchers",
    "max_discount",
    "INT",
    "",
    "",
    "Yes",
    "NULL",
    "Mức giảm tối đa nếu tính theo phần trăm"
  ],
  [
    "",
    "vouchers",
    "usage_limit",
    "INT",
    "",
    "",
    "No",
    "100",
    "Tổng số lượt sử dụng tối đa của mã"
  ],
  [
    "",
    "vouchers",
    "used_count",
    "INT",
    "",
    "",
    "No",
    "0",
    "Số lượt đã được khách hàng sử dụng"
  ],
  [
    "",
    "vouchers",
    "start_date",
    "DATE",
    "",
    "",
    "No",
    "None",
    "Ngày bắt đầu áp dụng mã"
  ],
  [
    "",
    "vouchers",
    "end_date",
    "DATE",
    "",
    "",
    "No",
    "None",
    "Ngày hết hạn của mã khuyến mãi"
  ],
  [
    "",
    "vouchers",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'active'",
    "Trạng thái mã: active, disabled, expired"
  ],
  [
    "",
    "BẢNG DỮ LIỆU: REVIEWS"
  ],
  [
    "",
    "reviews",
    "id",
    "VARCHAR",
    "36",
    "PK",
    "No",
    "UUIDv4",
    "Mã định danh bản đánh giá"
  ],
  [
    "",
    "reviews",
    "movie_id",
    "VARCHAR",
    "60",
    "FK",
    "No",
    "None",
    "Tham chiếu bảng movies(id)"
  ],
  [
    "",
    "reviews",
    "booking_id",
    "VARCHAR",
    "32",
    "FK",
    "No",
    "None",
    "Mã vé đã mua để đảm bảo Verified Review"
  ],
  [
    "",
    "reviews",
    "customer_phone",
    "VARCHAR",
    "15",
    "",
    "No",
    "None",
    "Số điện thoại người đánh giá"
  ],
  [
    "",
    "reviews",
    "rating_stars",
    "TINYINT",
    "",
    "",
    "No",
    "5",
    "Điểm số từ 1 đến 5 sao"
  ],
  [
    "",
    "reviews",
    "comment_text",
    "TEXT",
    "",
    "",
    "Yes",
    "None",
    "Nội dung nhận xét cảm nhận về phim"
  ],
  [
    "",
    "reviews",
    "status",
    "VARCHAR",
    "20",
    "",
    "No",
    "'approved'",
    "Kiểm duyệt: pending, approved, hidden"
  ],
  [
    "",
    "reviews",
    "created_at",
    "TIMESTAMP",
    "",
    "",
    "No",
    "CURRENT_TIMESTAMP",
    "Thời điểm gửi đánh giá"
  ]
];

  if (data3.length > 0) {
    const maxCols3 = Math.max(...data3.map(r => r.length));
    sheet3.getRange(1, 1, data3.length, maxCols3).setValues(
      data3.map(r => {
        const newR = [...r];
        while (newR.length < maxCols3) newR.push("");
        return newR;
      })
    );
  }

  // Định dạng Sheet 3
  sheet3.getRange("A2").setFontSize(15).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet3.getRange("A3").setFontSize(11).setFontItalic(true).setFontColor("#555555");
  
  // Header CSDL (dòng 5)
  const dbHeader = sheet3.getRange(5, 1, 1, 8);
  dbHeader.setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet3.setFrozenRows(5);

  const numRows3 = data3.length;
  if (numRows3 >= 6) {
    const dataRange3 = sheet3.getRange(6, 1, numRows3 - 5, 8);
    dataRange3.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
    dataRange3.setWrap(true).setVerticalAlignment("middle");

    for (let r = 6; r <= numRows3; r++) {
      const rowVal = sheet3.getRange(r, 1).getValue().toString();
      if (rowVal.startsWith("BẢNG")) {
        sheet3.getRange(r, 1, 1, 8).setBackground(COLOR_SUBHEADER).setFontWeight("bold").setFontColor(COLOR_HEADER);
      } else if (r % 2 === 0) {
        sheet3.getRange(r, 1, 1, 8).setBackground(COLOR_ZEBRA);
      }
    }
  }

  sheet3.setColumnWidth(1, 130);  // Tên Bảng
  sheet3.setColumnWidth(2, 160);  // Tên Cột
  sheet3.setColumnWidth(3, 110);  // Kiểu dữ liệu
  sheet3.setColumnWidth(4, 130);  // Độ dài/Format
  sheet3.setColumnWidth(5, 90);   // Khóa
  sheet3.setColumnWidth(6, 70);   // Null
  sheet3.setColumnWidth(7, 150);  // Giá trị mặc định
  sheet3.setColumnWidth(8, 380);  // Mô tả nghiệp vụ & Ràng buộc


  // =======================================================================================
  // SHEET 4: QUY TRÌNH NGHIỆP VỤ CỐT LÕI
  // =======================================================================================
  const sheet4 = getOrCreateSheet("4. Quy_Trinh_Nghiep_Vu");
  sheet4.setTabColor("#7C3AED");
  
  const data4 = [
  [
    "",
    "ĐẶC TẢ CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS WORKFLOWS)"
  ],
  [
    "",
    "Quy trình giữ ghế nguyên tử, ký vé số HMAC, kiểm tra va chạm phòng chiếu và chính sách đổi trả hoàn tiền"
  ],
  [
    "",
    "Bước",
    "Giai Đoạn",
    "Tác Nhân (Actor)",
    "Hành Động & Thao Tác Hệ Thống",
    "Xử Lý Backend / Database",
    "Ràng Buộc & Biện Pháp Chống Gian Lận"
  ],
  [
    "",
    "Quy Trình 1: Đặt Vé & Giữ Ghế Nguyên Tử 300s (Seat Hold & Booking)"
  ],
  [
    "",
    "B1",
    "Chọn ghế",
    "Khách hàng",
    "Bấm chọn các ghế mong muốn trên sơ đồ 102 ghế.",
    "Kiểm tra Orphan Seat Rule phía Client; Giới hạn tối đa 8 ghế/lần.",
    "Không được để trống 1 ghế đơn độc."
  ],
  [
    "",
    "B2",
    "Yêu cầu giữ chỗ",
    "Client Frontend",
    "Gọi API POST /api/seats/hold gửi danh sách ghế.",
    "Thực thi Redis Lua Script kiểm tra trạng thái toàn bộ ghế phải là 'free'.",
    "Khóa nguyên tử atomic, nếu có 1 ghế bị người khác chọn trước -> Từ chối trọn gói 409 SEAT_TAKEN."
  ],
  [
    "",
    "B3",
    "Đếm ngược giữ chỗ",
    "Hệ thống",
    "Trả về holdId và thời hạn 300 giây (expiresAt).",
    "Tạo key cinemax:{showtimeId}:hold:{holdId} với TTL 300s.",
    "Sau 300s Redis tự động giải phóng ghế về free nếu chưa thanh toán."
  ],
  [
    "",
    "B4",
    "Thanh toán",
    "Khách hàng",
    "Quét mã VietQR chuyển khoản chính xác số tiền.",
    "Tạo bản ghi vé Pending; Kiểm tra thời gian giữ chỗ còn tối thiểu > 30s.",
    "Chặn thanh toán nếu thời gian giữ ghế còn dưới 30s để tránh race condition."
  ],
  [
    "",
    "B5",
    "Chốt ghế & Xuất vé",
    "Hệ thống",
    "Server xác thực thanh toán thành công.",
    "Lua Script chuyển trạng thái ghế từ 'held' sang 'booked' vĩnh viễn; Promote vé thành 'valid'.",
    "Cấp mã vé QR kèm chữ ký số HMAC-SHA256."
  ],
  [
    "",
    "Quy Trình 2: Soát Vé Điện Tử Tại Cửa Bằng Mã QR (Anti-Fraud Scanner)"
  ],
  [
    "",
    "B1",
    "Trình vé",
    "Khách hàng",
    "Mở điện thoại hiển thị mã QR trên vé đã mua tại /dashboard.",
    "Mã QR chứa token dạng: cinemax:ticket:bk-xxxx:HMAC_HASH.",
    "Không thể chỉnh sửa mã vé vì sai chữ ký số."
  ],
  [
    "",
    "B2",
    "Quét mã",
    "Nhân viên rạp",
    "Mở /scanner quét camera vào mã QR.",
    "Client tách chuỗi lấy bookingId và chữ ký số gửi lên API POST /api/tickets/check-in.",
    "Xác thực danh tính nhân viên qua STAFF_ACCOUNTS."
  ],
  [
    "",
    "B3",
    "Kiểm tra tính toàn vẹn",
    "Hệ thống",
    "Server băm lại HMAC(bookingId + secret) và so sánh chuỗi an toàn.",
    "Sử dụng timingSafeEqual để chống timing attack.",
    "Nếu sai khác -> Từ chối 403 INVALID_TOKEN báo vé giả mạo."
  ],
  [
    "",
    "B4",
    "Kiểm tra quét trùng",
    "Hệ thống",
    "Kiểm tra trạng thái vé và thực thi lệnh ghi nhận tại Redis.",
    "SET cinemax:ticket:used:<id> 'staffId' EX 2592000 NX.",
    "Nếu key đã tồn tại -> Báo lỗi 409 TICKET_ALREADY_USED và hiển thị người đã soát trước đó."
  ],
  [
    "",
    "B5",
    "Cho phép vào phòng",
    "Nhân viên rạp",
    "Màn hình chuyển xanh: HỢP LỆ kèm số ghế, phòng chiếu.",
    "Cập nhật vé: ticket_status = 'used', scanned_at = NOW(), scanned_by = staffName.",
    "Ghi log lịch sử soát vé vào hệ thống."
  ],
  [
    "",
    "Quy Trình 3: Xếp Lịch Chiếu & Kiểm Tra Va Chạm Phòng (Collision Engine)"
  ],
  [
    "",
    "B1",
    "Nhập thông tin suất",
    "Quản trị viên",
    "Chọn rạp, phòng chiếu, phim, ngày và giờ chiếu.",
    "Client tính toán thời lượng phim + 10p quảng cáo trailer + 15p dọn phòng.",
    "Khoảng chiếm dụng phòng là [start, start + duration + 25p)."
  ],
  [
    "",
    "B2",
    "Kiểm tra va chạm",
    "Hệ thống",
    "Hệ thống lấy toàn bộ các suất chiếu đã có trong phòng vào ngày đó.",
    "Chạy hàm checkShowtimeCollision so khớp khoảng thời gian tuyệt đối.",
    "Hai suất khác phòng chiếu cùng giờ được duyệt; cùng phòng bị chặn ngay."
  ],
  [
    "",
    "B3",
    "Xử lý xung đột",
    "Hệ thống",
    "Nếu bị đè giờ hoặc vi phạm 15p dọn phòng -> Báo lỗi xung đột.",
    "Collision Engine tự động tính toán và trả về 3 khung giờ trống hợp lệ gần nhất.",
    "Gợi ý giờ chiếu tối ưu cho người quản lý rạp."
  ],
  [
    "",
    "B4",
    "Ghi dữ liệu an toàn",
    "Hệ thống",
    "Nếu không va chạm -> Lấy khóa phân tán phòng chiếu để ghi.",
    "Lưu suất chiếu vào bucket phòng chiếu trong Upstash Redis.",
    "Khóa phân tán (Distributed Mutex) đảm bảo 2 admin không thể tạo đè lịch cùng 1 giây."
  ],
  [
    "",
    "Quy Trình 4: Quy Trình Xử Lý Hoàn Trả & Hủy Vé 6 Bước (Refund Policy)"
  ],
  [
    "",
    "B1",
    "Tiếp nhận khiếu nại",
    "Khách hàng & NV",
    "Khách yêu cầu hủy vé (do sự cố rạp/đổi suất) trước giờ chiếu 60 phút.",
    "Tiếp nhận mã vé, số điện thoại người mua, lý do và biên lai chuyển khoản.",
    "Quy định rạp: Không nhận hủy vé khi suất chiếu đã bắt đầu."
  ],
  [
    "",
    "B2",
    "Xác minh thông tin",
    "Nhân viên / Admin",
    "Tra cứu vé trên hệ thống để kiểm tra trạng thái vé.",
    "Kiểm tra vé phải ở trạng thái 'valid' (chưa quét vào phòng chiếu).",
    "Nếu vé đã ở trạng thái 'used' -> Từ chối hoàn tiền ngay lập tức."
  ],
  [
    "",
    "B3",
    "Vô hiệu hóa vé (Void)",
    "Quản trị viên",
    "Admin bấm nút 'Hủy vé' trên trang quản trị.",
    "Cập nhật vé ticket_status = 'void', ghi rõ void_reason và nhân viên thực hiện.",
    "Vé bị hủy sẽ không thể quét qua cửa soát vé nữa."
  ],
  [
    "",
    "B4",
    "Giải phóng ghế phòng",
    "Hệ thống",
    "Hệ thống trả ghế về trạng thái 'free' trên sơ đồ rạp.",
    "Xóa ghế khỏi Hash phòng chiếu để khách hàng khác có thể đặt lại.",
    "Cập nhật tồn kho ghế tức thì."
  ],
  [
    "",
    "B5",
    "Chuyển tiền hoàn trả",
    "Quản trị viên",
    "Kế toán/Admin chuyển khoản trả lại tiền cho khách hàng qua STK/Ví.",
    "Ghi nhận booking: payment_status = 'refunded'.",
    "Lưu biên lai giao dịch hoàn tiền vào hệ thống."
  ],
  [
    "",
    "B6",
    "Thông báo hoàn tất",
    "Hệ thống",
    "Gửi email / tin nhắn thông báo hoàn tiền thành công cho khách.",
    "Lưu vết toàn bộ thao tác vào Activity Log để phục vụ kiểm toán.",
    "Hoàn tất quy trình hoàn trả minh bạch."
  ]
];

  if (data4.length > 0) {
    const maxCols4 = Math.max(...data4.map(r => r.length));
    sheet4.getRange(1, 1, data4.length, maxCols4).setValues(
      data4.map(r => {
        const newR = [...r];
        while (newR.length < maxCols4) newR.push("");
        return newR;
      })
    );
  }

  // Định dạng Sheet 4
  sheet4.getRange("A2").setFontSize(15).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet4.getRange("A3").setFontSize(11).setFontItalic(true).setFontColor("#555555");
  
  // Header Quy trình (dòng 5)
  const flowHeader = sheet4.getRange(5, 1, 1, 6);
  flowHeader.setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet4.setFrozenRows(5);

  const numRows4 = data4.length;
  if (numRows4 >= 6) {
    const dataRange4 = sheet4.getRange(6, 1, numRows4 - 5, 6);
    dataRange4.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
    dataRange4.setWrap(true).setVerticalAlignment("middle");

    for (let r = 6; r <= numRows4; r++) {
      const rowVal = sheet4.getRange(r, 2).getValue().toString();
      if (rowVal.startsWith("QUY TRÌNH")) {
        sheet4.getRange(r, 1, 1, 6).setBackground(COLOR_SUBHEADER).setFontWeight("bold").setFontColor(COLOR_HEADER);
      } else if (r % 2 === 0) {
        sheet4.getRange(r, 1, 1, 6).setBackground(COLOR_ZEBRA);
      }
    }
  }

  sheet4.setColumnWidth(1, 60);   // Bước
  sheet4.setColumnWidth(2, 170);  // Quy trình
  sheet4.setColumnWidth(3, 150);  // Tác nhân
  sheet4.setColumnWidth(4, 350);  // Hành động chi tiết
  sheet4.setColumnWidth(5, 350);  // Xử lý hệ thống & API
  sheet4.setColumnWidth(6, 280);  // Xử lý ngoại lệ / Rollback

  // Xóa sheet mặc định "Sheet1" hoặc "Trang tính 1" nếu còn
  const defaultSheets = ["Sheet1", "Trang tính 1", "Sheet"];
  defaultSheets.forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 4) {
      ss.deleteSheet(s);
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Tạo hồ sơ khởi động CineMax AI thành công!", "Hoàn tất 100%", 5);
}
