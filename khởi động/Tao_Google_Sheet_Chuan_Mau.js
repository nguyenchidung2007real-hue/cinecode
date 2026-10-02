/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT: TẠO BẢNG TÍNH CINEMAX AI CHUẨN MẪU GOOGLE SHEET ĐÍNH KÈM
 * (BAO GỒM ĐẦY ĐỦ SƠ ĐỒ MŨI TÊN LIÊN KẾT QUAN HỆ CƠ SỞ DỮ LIỆU ERD 11 BẢNG)
 * =========================================================================================
 * Dự án: Hệ Thống Đặt Vé Xem Phim Trực Tuyến Tích Hợp AI (CineMax AI)
 * Thành viên (4 người, KHÔNG CÓ Đặng Quốc Toản):
 *   - Dũng (Nguyễn Chí Dũng - Lead/AI)
 *   - Đăng (Nguyễn Hải Đăng - Database/Backend)
 *   - Tuấn (Nguyễn Văn Tuấn - Business Logic/Backend)
 *   - Minh (Đào Duy Minh - Frontend/Scanner)
 *
 * CÁCH DÙNG (CHỈ MẤT 10 GIÂY):
 * 1. Mở trang Google Sheets mới tại: https://sheets.new
 * 2. Trên menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script
 * 3. Xóa code cũ, dán toàn bộ đoạn code này vào rồi bấm "Chạy" (Run) (Hàm createCineMaxGoogleSheet)
 * 4. Mở lại Google Sheets: Bảng tính được tạo xong 100% với 4 tab hoàn chỉnh!
 * =========================================================================================
 */

function createCineMaxGoogleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const COLOR_HEADER = "#1E3A8A";      // Xanh đậm chuẩn mẫu
  const COLOR_SUBHEADER = "#E0F2FE";   // Xanh nhạt
  const COLOR_ADMIN = "#EFF6FF";       // Xanh dương rất nhẹ
  const COLOR_STAFF = "#F0FDF4";       // Xanh lá rất nhẹ
  const COLOR_USER = "#FFFBEB";        // Vàng cam rất nhẹ
  const COLOR_ZEBRA = "#F8FAFC";
  const COLOR_ARROW = "#0284C7";       // Xanh nổi bật mũi tên liên kết

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
  // SHEET 1: CHỨC NĂNG (GIỐNG LINK MẪU 100%)
  // =======================================================================================
  const sheet1 = getOrCreateSheet("CHỨC NĂNG");
  sheet1.setTabColor(COLOR_HEADER);

  const data1 = [
  [
    "CHỨC NĂNG DỰ ÁN CINEMAX AI — WEB ĐẶT VÉ XEM PHIM THÔNG MINH"
  ],
  [
    "- Công nghệ sử dụng:",
    "Front-end:\n  Next.js 14 App Router (React 18)\n  TypeScript & Tailwind CSS\n  Lucide Icons & Framer Motion",
    "Back-end:\n  Next.js Server Actions & API Handlers\n  Node.js Crypto (HMAC-SHA256)\n  Upstash Redis REST KV & Lua Scripts\n  Groq LPU Llama 3.3 70B AI\n  TMDB Live API v3 & VietQR Napas 247",
    "",
    "Link DATABASE: Xem chi tiết tại Trang tính 'DATABASE (11 BẢNG)'"
  ],
  [
    "Phân quyền",
    "Chức năng",
    "Mô tả chi tiết (Luồng xử lý, Trang danh sách, Thêm, Sửa, Xóa, Lọc...)",
    "Người làm",
    "Khó khăn / Thách thức kỹ thuật"
  ],
  [
    "Admin",
    "Quản lý phim",
    "- Trang danh sách:\n   + Hiển thị danh sách phim có phân trang (15, 30, 45 bản ghi)\n   + Thay đổi được số bản ghi trên một trang\n   + Tìm kiếm theo tên phim, thể loại\n   + Lọc theo trạng thái: Đang chiếu (now_playing), Sắp chiếu (upcoming), Nổi bật (trending)\n   + Sắp xếp tăng dần, giảm dần theo tên, ngày phát hành, thời lượng, điểm đánh giá\n   + Có thể thay đổi trạng thái hiển thị phim\n   + Chuyển vào thùng rác một phim\n   + Chuyển vào thùng rác nhiều phim\n- Trang thùng rác:\n   + Hiển thị danh sách phim đã xóa có phân trang\n   + Tìm kiếm theo tên phim trong thùng rác\n   + Khôi phục một phim & khôi phục nhiều phim\n   + Xóa vĩnh viễn một & xóa vĩnh viễn nhiều phim\n- Trang chi tiết phim: Hiển thị đầy đủ poster, trailer YouTube, thời lượng, độ tuổi (T18, T16, P), diễn viên\n- Trang thêm mới phim: Tự động điền dữ liệu bằng cách nhập mã TMDB ID hoặc nhập thủ công\n- Trang sửa phim: Cập nhật thông tin, poster, độ tuổi, phân loại",
    "Dũng",
    "Hình ảnh poster dung lượng lớn làm chậm tốc độ tải trang. Khắc phục bằng Next.js Image Optimization nén WebP và CDN Cache s-maxage=120s."
  ],
  [
    "Admin",
    "Quản lý suất chiếu",
    "- Trang danh sách suất chiếu:\n   + Hiển thị lịch chiếu theo từng phòng và từng cụm rạp có phân trang\n   + Lọc suất chiếu theo ngày (hôm nay, ngày mai, 7 ngày tới) và theo định dạng (2D, IMAX, ScreenX)\n   + Tìm kiếm theo tên phim hoặc tên phòng chiếu\n   + Xem số lượng ghế đã bán / ghế còn trống thời gian thực\n   + Hủy suất chiếu đơn lẻ hoặc nhiều suất\n- Trang thêm mới suất chiếu:\n   + Chọn cụm rạp, chọn phòng chiếu, chọn phim và ngày chiếu\n   + Chọn giờ bắt đầu chiếu (HH:mm)\n   + Tự động kích hoạt Showtime Collision Engine: Tính toán thời lượng phim + 10 phút trailer + 15 phút dọn phòng vệ sinh\n   + Nếu trùng giờ chiếu với phim khác: Báo lỗi 409 Xung đột lịch chiếu và tự động đề xuất 3 khung giờ trống gần nhất của phòng đó\n- Nút Đồng bộ lịch chiếu Beta Cinemas:\n   + Crawl và đồng bộ tự động toàn bộ lịch chiếu từ rạp Beta Cinemas Xuân Thủy vào hệ thống\n- Trang sửa suất chiếu: Điều chỉnh giờ chiếu, đổi phòng chiếu",
    "Tuấn",
    "Nguy cơ xung đột lịch phòng chiếu giữa 2 phim nối tiếp nhau. Khắc phục bằng giải thuật Collision Engine kiểm tra khoảng giao thời gian [start, start + duration + 25p]."
  ],
  [
    "Admin",
    "Quản lý đơn hàng & Vé",
    "- Trang danh sách đơn vé:\n   + Hiển thị toàn bộ vé đặt trên hệ thống có phân trang (15, 30, 45)\n   + Tìm kiếm theo Mã đặt vé (bookingId), Số điện thoại khách hàng, Tên phim\n   + Lọc theo trạng thái: Chờ thanh toán, Đã thanh toán (valid), Đã soát vào rạp (used), Đã hủy/hoàn (void)\n   + Sắp xếp theo ngày đặt, tổng tiền thanh toán\n- Trang chi tiết đơn vé:\n   + Xem thông tin người mua, chi tiết các ghế đã chọn (A1, A2...)\n   + Xem combo bắp nước đi kèm, mã giảm giá voucher đã áp dụng\n   + Xem chuỗi mã QR soát vé và trạng thái chữ ký số HMAC\n- Xử lý hoàn vé & Hủy vé:\n   + Nút 'Hủy vé & Trả ghế': Chuyển trạng thái vé sang void, tự động giải phóng ghế trong Redis showtime store\n   + Cập nhật trạng thái hoàn tiền cho khách",
    "Minh",
    "Khối lượng vé lớn gây nghẽn truy vấn. Khắc phục bằng phân trang phía Server (Server-side Pagination) kết hợp Indexing trên bookingId và phone."
  ],
  [
    "Admin",
    "Quản lý F&B (Bắp nước)",
    "- Trang danh sách bắp nước & combo:\n   + Hiển thị danh sách combo (Beta Solo, Combo Couple, Party) có phân trang\n   + Tìm kiếm theo tên sản phẩm\n   + Thay đổi trạng thái Còn hàng / Tạm hết hàng\n   + Xóa một hoặc xóa nhiều sản phẩm\n- Trang thêm mới combo bắp nước:\n   + Nhập tên combo, giá bán, hình ảnh minh họa\n   + Cấu hình các vị bắp (Ngọt truyền thống, Phô mai +10k, Caramel +10k)\n   + Cấu hình số ngăn bắp tối đa (1 ngăn, 2 ngăn) và size nước (22oz, 32oz)\n- Trang sửa combo: Cập nhật giá bán, mô tả, vị bắp",
    "Tuấn",
    "Khách hàng can thiệp gửi số lượng vị bắp vượt quá số ngăn quy định. Khắc phục bằng cơ chế Validation Matrix phía Server trước khi tính tổng tiền."
  ],
  [
    "Admin",
    "Quản lý mã giảm giá (Voucher)",
    "- Trang danh sách voucher:\n   + Hiển thị danh sách mã ưu đãi có phân trang (15, 30, 45)\n   + Tìm kiếm theo mã voucher (VD: SINHVIEN20, BETA50K)\n   + Sắp xếp theo ngày tạo, ngày hết hạn, số lượt đã dùng\n   + Bật / Tắt trạng thái kích hoạt của mã\n   + Xóa một hoặc nhiều voucher vào thùng rác\n- Trang thêm mới voucher:\n   + Nhập mã code, loại giảm giá (% hoặc số tiền cố định VNĐ)\n   + Thiết lập giá trị đơn tối thiểu, mức giảm tối đa\n   + Thiết lập tổng số lượt sử dụng tối đa và thời hạn áp dụng (start_date, end_date)\n- Trang sửa voucher: Cập nhật hạn mức, gia hạn ngày",
    "Tuấn",
    "Nguy cơ khách áp dụng đồng thời voucher vượt quá số lượt cho phép. Khắc phục bằng Atomic Redis Counter và kiểm tra Unique Phone."
  ],
  [
    "Admin",
    "Quản lý đánh giá & Bình luận",
    "- Trang danh sách đánh giá:\n   + Xem danh sách nhận xét phim của khán giả theo số sao (1-5 sao)\n   + Lọc theo phim, lọc theo trạng thái: Chờ duyệt, Đã duyệt, Đã ẩn\n   + Tìm kiếm theo số điện thoại người đánh giá hoặc nội dung bình luận\n   + Phê duyệt hoặc ẩn nhận xét vi phạm tiêu chuẩn cộng đồng\n   + Xóa nhận xét spam",
    "Dũng",
    "Bình luận spam và nhận xét ảo không mua vé. Khắc phục bằng cơ chế Verified Review (chỉ tài khoản có bookingId hợp lệ mới được gửi đánh giá)."
  ],
  [
    "Admin",
    "Thống kê & Báo cáo Dashboard",
    "- Thống kê tổng quan KPI:\n   + Tổng doanh thu bán vé & bắp nước (theo ngày, tuần, tháng)\n   + Số lượng vé đã bán và tỷ lệ lấp đầy ghế bình quân (Occupancy Rate)\n   + Top 5 bộ phim có doanh thu cao nhất phòng vé\n   + Thống kê theo từng cụm rạp và từng phòng chiếu\n- Biểu đồ doanh thu trực quan:\n   + Biểu đồ đường tăng trưởng doanh thu 30 ngày gần nhất\n   + Biểu đồ tròn cơ cấu doanh thu: Tiền vé (80%) vs Tiền bắp nước F&B (20%)",
    "Tuấn",
    "Truy vấn aggregate dữ liệu lớn làm chậm Dashboard. Khắc phục bằng Pre-calculated Cache lưu trữ các mốc thống kê định kỳ."
  ],
  [
    "Admin",
    "Xác thực & Bảo mật Quản trị",
    "- Trang đăng nhập quản trị riêng biệt (/admin/login):\n   + Nhập mật khẩu quản trị bảo mật\n   + Khóa tạm thời 5 phút sau 8 lần nhập sai liên tiếp (Chống Brute Force)\n   + Cấp cookie phiên HMAC-SHA256 với cờ HttpOnly, SameSite=Strict, Secure\n- Đăng xuất quản trị:\n   + Nút Đăng xuất xóa sạch cookie phiên, vô hiệu hóa token và chuyển hướng an toàn",
    "Minh",
    "Nguy cơ tấn công dò quét mật khẩu quản trị. Khắc phục bằng cơ chế Rate Limiting theo IP và mã hóa Session Cookie chuẩn HMAC."
  ],
  [
    "Nhân viên",
    "Xác thực nhân viên soát vé",
    "- Trang đăng nhập cổng nhân viên (/scanner):\n   + Nhập Mã nhân viên (Staff ID) và Mật khẩu bảo mật (Passcode)\n   + Xác thực theo danh sách ca trực được phân quyền\n   + Ghi nhận tên nhân viên và mã ca trực vào phiên làm việc\n- Đăng xuất ca trực khi hết giờ",
    "Minh",
    "Nhân viên quên đăng xuất khiến người khác thao tác nhầm. Khắc phục bằng tự động hết hạn phiên ca trực sau 8 tiếng."
  ],
  [
    "Nhân viên",
    "Soát vé điện tử (QR Scanner)",
    "- Quét mã QR bằng Camera thiết bị:\n   + Kích hoạt Camera điện thoại hoặc máy tính bảng của rạp\n   + Tự động căn khung lấy nét và nhận diện chuỗi QR định dạng cinemax:ticket:bookingId:token\n   + Báo âm thanh Bíp thành công và rung nhẹ trên thiết bị\n- Xác thực tính toàn vẹn vé & Chống giả mạo:\n   + Server băm lại HMAC-SHA256(bookingId + secret) và dùng timingSafeEqual so sánh với chuỗi token trên vé\n   + Nếu token bị sai lệch -> Báo động đỏ: 'VÉ GIẢ MẠO HOẶC ĐÃ BỊ CHỈNH SỬA' ngay lập tức\n- Chống quét trùng vé (Anti-Replay Attack):\n   + Thực thi lệnh Redis SETNX cinemax:ticket:used:<id>\n   + Nếu vé đã được soát trước đó: Báo động đỏ: 'VÉ ĐÃ SỬ DỤNG' kèm thời gian quét và tên nhân viên đã soát trước đó\n- Cho phép vào rạp:\n   + Màn hình xanh hiển thị: Tên phim, Giờ chiếu, Phòng chiếu, Số ghế ngồi hợp lệ",
    "Minh",
    "Khách hàng chụp màn hình mã QR gửi cho người khác cùng vào rạp hoặc 2 nhân viên quét cùng lúc. Khắc phục bằng Atomic Redis SETNX đảm bảo chỉ duy nhất 1 lần quét hợp lệ."
  ],
  [
    "Nhân viên",
    "Tra cứu vé thủ công",
    "- Ô tìm kiếm nhanh khi khách hết pin điện thoại hoặc không mở được QR:\n   + Nhập Mã đặt vé (bookingId) hoặc Số điện thoại người mua\n   + Hiển thị thông tin vé, số ghế, trạng thái thanh toán\n   + Nút 'Xác nhận vào rạp thủ công' cho nhân viên đối soát thực tế",
    "Minh",
    "Khách đọc nhầm số điện thoại. Khắc phục bằng đối chiếu thêm tên khách hàng và 4 số cuối số điện thoại."
  ],
  [
    "Nhân viên",
    "Thống kê ca trực",
    "- Xem báo cáo nhanh ca trực tại cổng soát vé:\n   + Tổng số lượt khách đã soát thành công vào rạp trong ca trực\n   + Số lượng vé lỗi / vé giả mạo phát hiện được\n   + Danh sách các vé vừa soát gần nhất",
    "Minh",
    "Đồng bộ dữ liệu ca trực khi mạng rạp chập chờn. Khắc phục bằng LocalStorage Offline Queue tự đồng bộ khi có mạng."
  ],
  [
    "Khách hàng",
    "Xác thực & Ví vé cá nhân",
    "- Trang Dashboard cá nhân (/dashboard):\n   + Đăng nhập nhanh bằng Số điện thoại (Phone Auth Gate)\n   + Xem danh sách toàn bộ các vé đã mua theo trạng thái: Vé sắp xem, Vé đã xem, Vé đã hủy\n   + Mở lại mã QR vé điện tử bất kỳ lúc nào để trình cho nhân viên rạp soát vé\n   + Tuyệt đối tách biệt, không lộ bất kỳ nút hay quyền hạn của Admin / Nhân viên",
    "Minh",
    "Khách hàng vào nhầm link quản trị hoặc thấy các nút của admin. Khắc phục bằng cơ chế Route Guard phân quyền nghiêm ngặt 3 tầng."
  ],
  [
    "Khách hàng",
    "Khám phá phim & Trang chủ",
    "- Trang chủ hiển thị danh mục phim chuẩn rạp chiếu:\n   + Tab Phim Đang Chiếu, Phim Sắp Chiếu, Suất Chiếu Đặc Biệt\n   + Dữ liệu trực tiếp từ TMDB API v3 kết hợp danh mục phim rạp Việt Nam\n   + Thanh tìm kiếm nhanh theo tiêu đề phim\n   + Lọc phim theo thể loại (Hành động, Kinh dị, Hoạt hình, Tình cảm...) và độ tuổi (P, T13, T16, T18)\n   + Xem trailer YouTube, điểm đánh giá khán giả, nội dung tóm tắt phim",
    "Dũng",
    "Dữ liệu API TMDB có độ trễ kết nối quốc tế. Khắc phục bằng cơ chế Fallback sang danh mục phim nội bộ lưu sẵn trong hệ thống."
  ],
  [
    "Khách hàng",
    "AI Hỗ trợ tìm kiếm & Tư vấn",
    "- Tìm kiếm thông minh Spotlight AI (Phím tắt Ctrl+K):\n   + Người dùng gõ câu hỏi bằng ngôn ngữ tự nhiên (VD: 'phim hành động cháy nổ cuối tuần này')\n   + Mô hình Hugging Face Semantic Search RAG trích xuất ngữ nghĩa và tìm phim phù hợp trong 0.2 giây\n- CineBot AI tư vấn phim theo cảm xúc:\n   + Chatbot AI góc màn hình đóng vai chuyên gia điện ảnh CineMax\n   + Khách chia sẻ tâm trạng (buồn, stress, hẹn hò), AI phân tích và đề xuất phim kèm lý do\n   + Tự động nhận diện số lượng người xem (party size) và cung cấp nút chọn phim vào thẳng phòng vé 1-click",
    "Dũng",
    "Độ trễ xử lý ngôn ngữ tự nhiên của AI. Khắc phục bằng hạ tầng Groq LPU tốc độ ~500 tokens/giây và Streaming Text tức thời."
  ],
  [
    "Khách hàng",
    "Đặt vé & Chọn suất chiếu",
    "- Thanh Đặt Vé Nhanh (Quick Booking Bar):\n   + Cố định đầu trang: 1-Click Chọn Phim -> Chọn Cụm Rạp -> Chọn Ngày -> Chọn Suất Chiếu -> MUA VÉ NGAY\n   + Tự động nhận diện suất chiếu khả dụng gần nhất\n- Modal Đặt Vé Bước 1 (Chọn rạp & Giờ chiếu):\n   + Danh sách cụm rạp: Beta Cinemas Xuân Thủy, CGV Vincom...\n   + Chọn ngày chiếu (Hôm nay, Ngày mai, Ngày kia)\n   + Hiển thị khung giờ chiếu theo định dạng (2D Phụ đề, IMAX, ScreenX)\n   + Tự động ẩn suất đã qua giờ chiếu; Nút 'Tiếp tục: Chọn ghế' luôn kích hoạt chính xác",
    "Dũng",
    "Khách chọn nhầm suất đã qua giờ chiếu dẫn đến lỗi không tiếp tục được. Khắc phục bằng bộ lọc thời gian tương lai và tự động chọn suất khả dụng."
  ],
  [
    "Khách hàng",
    "Sơ đồ chọn ghế tương tác",
    "- Sơ đồ 102 ghế chuẩn Beta Cinemas:\n   + Ma trận 9 hàng A-K x 12 cột hiển thị trực quan\n   + Phân tầng màu sắc: Ghế Standard (55.000đ), Ghế VIP (75.000đ), Ghế đôi Sweetbox hàng K (130.000đ/cặp)\n   + Cập nhật trạng thái ghế: Trống (xám), Đang chọn (xanh), Đang có người giữ (vàng), Đã bán (đỏ)\n   + Cho phép chọn tối đa 8 ghế/lần đặt\n- Thuật toán chống ghế mồ côi (Orphan Seat Rule):\n   + Không cho phép để lại 1 ghế trống đơn độc ở đầu hàng, cuối hàng hoặc giữa 2 khách khác\n   + Cảnh báo trực quan màu đỏ và hướng dẫn khách chọn hợp lệ\n- Mô phỏng góc nhìn rạp 3D (View From Seat):\n   + Nhấp vào ghế để xem góc nhìn thực tế lên màn chiếu từ vị trí đó, làm nổi bật khu vực Sweet Spot (Hàng E, F)",
    "Tuấn",
    "Sơ đồ 102 ghế bị chậm trên điện thoại. Khắc phục bằng tối ưu hóa React Virtualization và vẽ phẳng bằng CSS Grid hiện đại."
  ],
  [
    "Khách hàng",
    "Giữ ghế nguyên tử 300 giây",
    "- Cơ chế giữ ghế thời gian thực (Seat Hold):\n   + Ngay khi khách chọn ghế xong và bấm tiếp tục, hệ thống lập tức khóa các ghế đó trong 300 giây (5 phút)\n   + Đồng hồ đếm ngược thời gian thực trên màn hình thanh toán\n   + Trong 300 giây này, không bất kỳ ai khác trên toàn mạng có thể chọn trùng ghế (Chống Overbooking 100%)\n   + Nếu hết 300 giây chưa thanh toán, hệ thống tự động giải phóng ghế trở lại trạng thái trống cho người khác chọn",
    "Đăng",
    "Nhiều khách hàng cùng bấm giữ 1 ghế ở cùng 1 phần nghìn giây (Race Condition). Khắc phục bằng Upstash Redis Lua Script thực thi nguyên tử atomic."
  ],
  [
    "Khách hàng",
    "Chọn bắp nước (F&B Upsell)",
    "- Thêm bắp nước vào vé:\n   + Chọn các combo tiện lợi (Beta Solo 1 bắp 1 nước, Combo Đôi 1 bắp 2 nước, Party Combo)\n   + Chọn vị bắp: Ngọt truyền thống, Phô mai (+10k), Caramel (+10k)\n   + Tùy chọn Upsize ly nước ngọt khổng lồ 32oz (+12k)\n   + Tự động cộng dồn tiền bắp nước minh bạch vào tổng tiền đơn hàng",
    "Tuấn",
    "Xử lý tùy chọn vị bắp linh hoạt theo số ngăn. Khắc phục bằng component selector kiểm soát chặt chẽ số lượng ngăn bắp."
  ],
  [
    "Khách hàng",
    "Thanh toán VietQR & MoMo",
    "- Thanh toán không tiền mặt tiện lợi:\n   + Sinh mã VietQR động chuẩn Napas 247 chứa chính xác số tiền, số tài khoản và nội dung mã vé\n   + Nút bấm sao chép nhanh số tài khoản & nội dung chuyển khoản\n   + Hỗ trợ cổng thanh toán ví điện tử MoMo\n   + Nhận mã giảm giá voucher trừ tiền tức thì trước khi thanh toán",
    "Dũng",
    "Khách chuyển khoản sai nội dung hoặc thiếu tiền. Khắc phục bằng tích hợp mã VietQR quét tự điền chuẩn 100% số tiền và mã vé."
  ],
  [
    "Khách hàng",
    "Vé điện tử & Vào rạp",
    "- Xuất vé xem phim điện tử hoàn chỉnh:\n   + Hiển thị mã QR bảo mật chữ ký số HMAC-SHA256\n   + Hiển thị chi tiết tên phim, phòng chiếu, vị trí ghế, giờ chiếu và combo bắp nước\n   + Nút tải vé về máy hoặc lưu vào thư viện ảnh\n   + Hướng dẫn chi tiết đường đi vào phòng chiếu tại rạp",
    "Minh",
    "Mã QR hiển thị trên màn hình bị mờ khó quét. Khắc phục bằng thư viện qrcode tạo vector SVG độ nét cao với mức sửa lỗi Error Correction Level H."
  ],
  [
    "- QUY TRÌNH NGHIỆP VỤ HỆ THỐNG CINEMAX AI:"
  ],
  [
    "- Quy trình 1: Đặt vé & Giữ ghế nguyên tử 300s (Seat Hold & Booking):"
  ],
  [
    "B1: Khách hàng chọn suất chiếu và bấm chọn ghế trên sơ đồ 102 chỗ (hệ thống kiểm tra chống ghế mồ côi Orphan Seat)."
  ],
  [
    "B2: Khách hàng bấm 'Tiếp tục', hệ thống gọi API giữ chỗ POST /api/seats/hold."
  ],
  [
    "B3: Backend thực thi Redis Lua Script kiểm tra nguyên tử: Nếu tất cả ghế đều trống -> Khóa giữ chỗ trong 300 giây (5 phút), trả về holdId."
  ],
  [
    "- Nếu có bất kỳ ghế nào đã bị người khác chọn trước: Báo lỗi 409 SEAT_TAKEN và yêu cầu khách chọn lại ghế khác."
  ],
  [
    "B4: Khách hàng chọn bắp nước, áp mã voucher giảm giá và quét mã VietQR để thanh toán."
  ],
  [
    "B5: Sau khi thanh toán thành công, hệ thống chuyển vé sang trạng thái 'valid', ký số HMAC-SHA256 và sinh mã QR vào rạp."
  ],
  [
    "B6: Nếu sau 300 giây khách hàng không thanh toán, Redis tự động giải phóng ghế trở lại trạng thái trống hoàn toàn."
  ],
  [
    "- Quy trình 2: Soát vé điện tử & Chống vé giả mạo / Quét trùng (QR Check-in):"
  ],
  [
    "B1: Khách hàng xuất trình mã QR trên vé điện tử tại cửa phòng chiếu."
  ],
  [
    "B2: Nhân viên rạp mở ứng dụng /scanner trên điện thoại và quét mã QR."
  ],
  [
    "B3: Server nhận mã vé và token, tự động tính toán lại HMAC-SHA256(bookingId + secret) rồi so sánh bằng timingSafeEqual."
  ],
  [
    "- Nếu chữ ký sai: Lập tức báo động đỏ 'VÉ GIẢ MẠO / KHÔNG HỢP LỆ' và từ chối vào rạp."
  ],
  [
    "B4: Server thực hiện khóa nguyên tử Redis SETNX cinemax:ticket:used:<bookingId>."
  ],
  [
    "- Nếu vé đã quét trước đó: Báo động đỏ 'VÉ ĐÃ ĐƯỢC SỬ DỤNG' kèm thời gian và nhân viên đã soát lần đầu."
  ],
  [
    "B5: Nếu vé hợp lệ và chưa sử dụng: Màn hình hiển thị màu xanh 'VÉ HỢP LỆ — MỜI VÀO PHÒNG CHIẾU', ghi nhận thời gian soát."
  ],
  [
    "- Quy trình 3: Điều phối lịch chiếu & Chống va chạm phòng chiếu (Showtime Collision Engine):"
  ],
  [
    "B1: Admin vào trang Quản lý suất chiếu, chọn rạp, phòng chiếu, phim, ngày chiếu và giờ bắt đầu."
  ],
  [
    "B2: Hệ thống tự động lấy thời lượng phim, cộng 10 phút chiếu trailer giới thiệu + 15 phút dọn dẹp vệ sinh phòng chiếu."
  ],
  [
    "B3: Collision Engine kiểm tra khoảng thời gian chiếm dụng [start_time, start_time + duration + 25 phút] với tất cả các suất chiếu hiện có của phòng."
  ],
  [
    "- Nếu phát hiện trùng giờ chiếu: Hệ thống từ chối tạo suất chiếu, báo lỗi 409 và tự động tính toán đề xuất 3 khung giờ trống gần nhất."
  ],
  [
    "B4: Nếu không va chạm: Hệ thống lưu suất chiếu vào cơ sở dữ liệu và hiển thị ngay cho khách hàng đặt vé."
  ],
  [
    "- Quy trình 4: Hoàn tiền & Hủy vé tự động (Refund Policy):"
  ],
  [
    "B1: Khách hàng vào trang Dashboard cá nhân (/dashboard), chọn vé muốn hủy và bấm 'Yêu cầu hoàn vé'."
  ],
  [
    "B2: Hệ thống kiểm tra điều kiện thời gian: Yêu cầu phải trước giờ chiếu phim tối thiểu 60 phút."
  ],
  [
    "- Nếu thời gian còn lại dưới 60 phút hoặc vé đã được quét vào rạp: Hệ thống từ chối hoàn vé theo quy định của rạp."
  ],
  [
    "B3: Nếu đủ điều kiện hợp lệ: Hệ thống chuyển trạng thái vé sang 'void', tự động giải phóng ghế trong phòng chiếu về 'free'."
  ],
  [
    "B4: Hệ thống tạo lệnh hoàn tiền tự động qua tài khoản VietQR/MoMo của khách hàng hoặc cấp voucher tương đương giá trị vé."
  ],
  [
    "B5: Gửi thông báo xác nhận hủy vé thành công đến số điện thoại của khách hàng."
  ]
];
  if (data1.length > 0) {
    const maxCols1 = Math.max(...data1.map(r => r.length));
    sheet1.getRange(1, 1, data1.length, maxCols1).setValues(
      data1.map(r => {
        const newR = [...r];
        while (newR.length < maxCols1) newR.push("");
        return newR;
      })
    );
  }

  sheet1.getRange("A2").setFontSize(14).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet1.getRange("A4").setFontSize(11).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet1.getRange("B4").setFontSize(10).setBackground("#F8FAFC").setWrap(true);
  sheet1.getRange("C4").setFontSize(10).setBackground("#F8FAFC").setWrap(true);
  sheet1.getRange("E4").setFontSize(11).setFontWeight("bold").setFontColor("#0284C7").setWrap(true);

  const headerRange1 = sheet1.getRange("A6:E6");
  headerRange1.setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet1.setFrozenRows(6);

  const tableDataRange = sheet1.getRange(7, 1, 21, 5);
  tableDataRange.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
  tableDataRange.setWrap(true).setVerticalAlignment("top");

  for (let r = 7; r <= 27; r++) {
    const roleVal = sheet1.getRange(r, 1).getValue().toString();
    const rangeRow = sheet1.getRange(r, 1, 1, 5);
    if (roleVal === "Admin") {
      rangeRow.setBackground(r % 2 === 0 ? COLOR_ADMIN : "#FFFFFF");
    } else if (roleVal === "Nhân viên") {
      rangeRow.setBackground(r % 2 === 0 ? COLOR_STAFF : "#FFFFFF");
    } else {
      rangeRow.setBackground(r % 2 === 0 ? COLOR_USER : "#FFFFFF");
    }
    sheet1.getRange(r, 1).setFontWeight("bold").setHorizontalAlignment("center");
    sheet1.getRange(r, 2).setFontWeight("bold");
    sheet1.getRange(r, 4).setFontWeight("bold").setFontColor("#047857").setHorizontalAlignment("center");
    sheet1.getRange(r, 5).setFontStyle("italic").setFontColor("#991B1B");
  }

  const totalRows1 = sheet1.getLastRow();
  for (let r = 29; r <= totalRows1; r++) {
    const val = sheet1.getRange(r, 1).getValue().toString();
    if (val.startsWith("- Quy trình")) {
      sheet1.getRange(r, 1).setFontWeight("bold").setFontColor(COLOR_HEADER).setFontSize(11);
    } else if (val.startsWith("- QUY TRÌNH")) {
      sheet1.getRange(r, 1).setFontWeight("bold").setFontColor(COLOR_HEADER).setFontSize(12);
    } else {
      sheet1.getRange(r, 1).setFontColor("#1F2937").setFontSize(10);
    }
  }

  sheet1.setColumnWidth(1, 130);
  sheet1.setColumnWidth(2, 230);
  sheet1.setColumnWidth(3, 580);
  sheet1.setColumnWidth(4, 110);
  sheet1.setColumnWidth(5, 420);

  // =======================================================================================
  // SHEET 2: SƠ ĐỒ LIÊN KẾT ERD (MŨI TÊN CHỈ MỐI QUAN HỆ & BẢN SỐ)
  // =======================================================================================
  const sheetERD = getOrCreateSheet("SƠ ĐỒ LIÊN KẾT ERD");
  sheetERD.setTabColor(COLOR_ARROW);

  // Vẽ sơ đồ khối ASCII Diagram trực quan
  const asciiDiagram = [
    ["SƠ ĐỒ TRỰC QUAN MỐI LIÊN KẾT VÀ QUAN HỆ GIỮA 11 BẢNG CƠ SỞ DỮ LIỆU CINEMAX AI", "", "", "", "", "", "", "", ""],
    ["Ký hiệu: [Bảng Dữ Liệu] ──(Bản số: 1:N / 1:1)──► [Bảng Tham Chiếu Khóa Ngoại]", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["┌────────────────────────┐                   ┌────────────────────────┐                   ┌────────────────────────┐", "", "", "", "", "", "", "", ""],
    ["│   cinemas (Cụm Rạp)    │──( 1 : N )───────►│  rooms (Phòng Chiếu)   │──( 1 : N )───────►│ seat_layouts (102 Ghế) │", "", "", "", "", "", "", "", ""],
    ["│   PK: id               │                   │  PK: id, FK: cinema_id │                   │  PK: seat_id           │", "", "", "", "", "", "", "", ""],
    ["└──────────┬─────────────┘                   └──────────┬─────────────┘                   │  FK: room_id           │", "", "", "", "", "", "", "", ""],
    ["           │                                            │                                 └────────────────────────┘", "", "", "", "", "", "", "", ""],
    ["        ( 1 : N )                                    ( 1 : N )", "", "", "", "", "", "", "", ""],
    ["           │                                            │", "", "", "", "", "", "", "", ""],
    ["           ▼                                            ▼", "", "", "", "", "", "", "", ""],
    ["┌────────────────────────┐                   ┌────────────────────────┐                   ┌────────────────────────┐", "", "", "", "", "", "", "", ""],
    ["│  movies (Phim Chiếu)   │──( 1 : N )───────►│ showtimes (Suất Chiếu) │──( 1 : N )───────►│ seat_holds (Giữ 300s)  │", "", "", "", "", "", "", "", ""],
    ["│  PK: id                │                   │  PK: id                │                   │  PK: hold_id           │", "", "", "", "", "", "", "", ""],
    ["└──────────┬─────────────┘                   │  FK: movie_id, room_id │                   │  FK: showtime_id       │", "", "", "", "", "", "", "", ""],
    ["           │                                 └──────────┬─────────────┘                   └────────────────────────┘", "", "", "", "", "", "", "", ""],
    ["           │                                            │", "", "", "", "", "", "", "", ""],
    ["           │                                         ( 1 : N )", "", "", "", "", "", "", "", ""],
    ["           │                                            │", "", "", "", "", "", "", "", ""],
    ["           │    ┌────────────────────────┐              ▼", "", "", "", "", "", "", "", ""],
    ["           │    │  users (Khách / Phone) │──( 1 : N )──►┌────────────────────────┐                   ┌────────────────────────┐", "", "", "", "", "", "", "", ""],
    ["           │    │  PK: id, phone         │              │ bookings (Đơn Đặt Vé)  │──( 1 : 1 )───────►│  tickets (Mã QR HMAC)  │", "", "", "", "", "", "", "", ""],
    ["           │    └────────────────────────┘              │  PK: booking_id        │  [CHẶT CHẼ]       │  PK,FK: booking_id     │", "", "", "", "", "", "", "", ""],
    ["           │    ┌────────────────────────┐              │  FK: showtime_id, phone│                   │  qr_token (HMAC-SHA256)│", "", "", "", "", "", "", "", ""],
    ["           │    │  vouchers (Khuyến Mãi) │──( 1 : N )──►│  FK: voucher_code      │                   └────────────────────────┘", "", "", "", "", "", "", "", ""],
    ["           │    │  PK: code              │              └──────────┬─────────────┘", "", "", "", "", "", "", "", ""],
    ["           │    └────────────────────────┘                         │", "", "", "", "", "", "", "", ""],
    ["           │                                                    ( 1 : 1 ) [Verified Review]", "", "", "", "", "", "", "", ""],
    ["        ( 1 : N )                                                  │", "", "", "", "", "", "", "", ""],
    ["           │                                                       ▼", "", "", "", "", "", "", "", ""],
    ["           └────────────────────────────────────────────►┌────────────────────────┐", "", "", "", "", "", "", "", ""],
    ["                                                         │ reviews (Đánh Giá Phim)│", "", "", "", "", "", "", "", ""],
    ["                                                         │  PK: id                │", "", "", "", "", "", "", "", ""],
    ["                                                         │  FK: movie_id, booking │", "", "", "", "", "", "", "", ""],
    ["                                                         └────────────────────────┘", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""]
  ];

  sheetERD.getRange(1, 1, asciiDiagram.length, 9).setValues(asciiDiagram);
  sheetERD.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheetERD.getRange("A2").setFontSize(10).setFontItalic(true).setFontColor("#555555");
  sheetERD.getRange("A4:A35").setFontFamily("Consolas").setFontSize(9.5).setFontColor("#0F172A");

  // Bảng ánh xạ quan hệ chi tiết (Dòng 37 trở đi)
  const dataERDTable = [
  [
    "SƠ ĐỒ QUAN HỆ & BẢNG ÁNH XẠ MỐI LIÊN KẾT CƠ SỞ DỮ LIỆU (ERD)"
  ],
  [
    "Đặc tả trực quan 11 bảng dữ liệu, khóa chính (PK), khóa ngoại (FK), mũi tên liên kết và bản số (Cardinality 1:N, 1:1)"
  ],
  [
    "BẢNG QUAN HỆ & RÀNG BUỘC TOÀN VẸN KHÓA NGOẠI (FOREIGN KEY MAPPING MATRIX)"
  ],
  [
    "Chi tiết các đường liên kết giữa các thực thể, bản số và quy tắc toàn vẹn dữ liệu"
  ],
  [
    "STT",
    "Bảng Nguồn (Parent)",
    "Khóa Chính (PK)",
    "Bản Số",
    "Mũi Tên Liên Kết (Relationship)",
    "Bảng Đích (Child)",
    "Khóa Ngoại (FK)",
    "Ràng Buộc (Cascade/Restrict)",
    "Ý Nghĩa Nghiệp Vụ Cốt Lõi"
  ],
  [
    "1",
    "cinemas",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "rooms",
    "cinema_id",
    "CASCADE",
    "Một cụm rạp quản lý nhiều phòng chiếu (Phòng Standard, IMAX Laser, ScreenX). Xóa rạp thì xóa phòng."
  ],
  [
    "2",
    "cinemas",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "showtimes",
    "cinema_id",
    "RESTRICT",
    "Một cụm rạp tổ chức nhiều suất chiếu. Không được xóa rạp nếu đang có suất chiếu tương lai."
  ],
  [
    "3",
    "rooms",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "seat_layouts",
    "room_id",
    "CASCADE",
    "Một phòng chiếu sở hữu cấu hình sơ đồ 102 ghế cố định (A1-H12, K1-K6)."
  ],
  [
    "4",
    "rooms",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "showtimes",
    "room_id",
    "RESTRICT",
    "Một phòng chiếu tổ chức nhiều suất chiếu. Showtime Collision Engine kiểm tra không trùng giờ trên cùng 1 room_id."
  ],
  [
    "5",
    "movies",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "showtimes",
    "movie_id",
    "RESTRICT",
    "Một bộ phim được xếp lịch chiếu tại nhiều khung giờ và rạp khác nhau. Dùng duration_minutes để tính thời lượng."
  ],
  [
    "6",
    "movies",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "reviews",
    "movie_id",
    "CASCADE",
    "Một bộ phim nhận được nhiều nhận xét đánh giá từ khán giả. Xóa phim sẽ xóa các đánh giá liên quan."
  ],
  [
    "7",
    "showtimes",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "seat_holds",
    "showtime_id",
    "CASCADE",
    "Một suất chiếu có nhiều phiên giữ ghế tạm thời. Redis Key: cinemax:{showtimeId}:hold:{holdId} với TTL 300s."
  ],
  [
    "8",
    "showtimes",
    "id",
    "1 : N",
    "────────(1 : N)────────►",
    "bookings",
    "showtime_id",
    "RESTRICT",
    "Một suất chiếu có nhiều đơn đặt vé đã thanh toán thành công. Không thể xóa suất chiếu nếu đã bán vé."
  ],
  [
    "9",
    "users",
    "id / phone",
    "1 : N",
    "────────(1 : N)────────►",
    "bookings",
    "customer_phone",
    "SET NULL",
    "Một tài khoản người dùng / số điện thoại thực hiện nhiều đơn đặt vé. Dùng để xem lịch sử vé tại /dashboard."
  ],
  [
    "10",
    "vouchers",
    "code",
    "1 : N",
    "────────(1 : N)────────►",
    "bookings",
    "voucher_code",
    "SET NULL",
    "Một mã khuyến mãi có thể được áp dụng cho nhiều đơn vé khác nhau cho đến khi hết hạn mức usage_limit."
  ],
  [
    "11",
    "bookings",
    "booking_id",
    "1 : 1",
    "────────(1 : 1)────────►",
    "tickets",
    "booking_id",
    "CASCADE",
    "Quan hệ 1-1 CHẶT CHẼ: Mỗi đơn đặt vé phát hành DUY NHẤT 1 vé điện tử chứa chuỗi mã QR ký số HMAC-SHA256."
  ],
  [
    "12",
    "bookings",
    "booking_id",
    "1 : 1",
    "────────(1 : 1)────────►",
    "reviews",
    "booking_id",
    "SET NULL",
    "Quan hệ 1-1 BẢO MẬT: Mỗi đơn vé chỉ được đánh giá phim 1 lần duy nhất (Verified Review chống đánh giá ảo)."
  ]
];
  if (dataERDTable.length > 0) {
    const startRowERD = 38;
    const maxColsERD = Math.max(...dataERDTable.map(r => r.length));
    sheetERD.getRange(startRowERD, 1, dataERDTable.length, maxColsERD).setValues(
      dataERDTable.map(r => {
        const newR = [...r];
        while (newR.length < maxColsERD) newR.push("");
        return newR;
      })
    );
    
    // Style table headers and data
    sheetERD.getRange(startRowERD + 2, 1, 1, 9).setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
    const dataRowsCount = dataERDTable.length - 3;
    if (dataRowsCount > 0) {
      const erdDataRange = sheetERD.getRange(startRowERD + 3, 1, dataRowsCount, 9);
      erdDataRange.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
      erdDataRange.setWrap(true).setVerticalAlignment("middle");

      for (let r = startRowERD + 3; r <= startRowERD + 2 + dataRowsCount; r++) {
        if (r % 2 === 0) {
          sheetERD.getRange(r, 1, 1, 9).setBackground(COLOR_ZEBRA);
        }
        sheetERD.getRange(r, 1).setHorizontalAlignment("center").setFontWeight("bold");
        sheetERD.getRange(r, 2).setHorizontalAlignment("center").setFontWeight("bold");
        sheetERD.getRange(r, 3).setHorizontalAlignment("center").setFontColor("#B91C1C").setFontWeight("bold");
        sheetERD.getRange(r, 4).setHorizontalAlignment("center").setFontWeight("bold");
        sheetERD.getRange(r, 5).setHorizontalAlignment("center").setFontFamily("Consolas").setFontColor(COLOR_ARROW).setFontWeight("bold");
        sheetERD.getRange(r, 6).setHorizontalAlignment("center").setFontWeight("bold");
        sheetERD.getRange(r, 7).setHorizontalAlignment("center").setFontColor("#047857").setFontWeight("bold");
        sheetERD.getRange(r, 8).setHorizontalAlignment("center").setFontWeight("bold");
      }
    }
  }

  sheetERD.setColumnWidth(1, 60);
  sheetERD.setColumnWidth(2, 160);
  sheetERD.setColumnWidth(3, 130);
  sheetERD.setColumnWidth(4, 90);
  sheetERD.setColumnWidth(5, 230);
  sheetERD.setColumnWidth(6, 160);
  sheetERD.setColumnWidth(7, 140);
  sheetERD.setColumnWidth(8, 140);
  sheetERD.setColumnWidth(9, 450);

  // =======================================================================================
  // SHEET 3: DATABASE (11 BẢNG CSDL CHI TIẾT)
  // =======================================================================================
  const sheet2 = getOrCreateSheet("DATABASE (11 BẢNG)");
  sheet2.setTabColor("#0284C7");

  const data2 = [
  [
    "DATABASE DỰ ÁN CINEMAX AI — TỪ ĐIỂN DỮ LIỆU CHI TIẾT (11 BẢNG)"
  ],
  [
    "Hệ thống lưu trữ cơ sở dữ liệu Upstash Redis REST KV kết hợp Relational Schema cho 11 bảng cốt lõi"
  ],
  [
    "Tên Bảng",
    "Tên Cột (Field)",
    "Kiểu Dữ Liệu",
    "Độ Dài",
    "Khóa (Key)",
    "Null?",
    "Giá Trị Mặc Định",
    "Mô Tả Nghiệp Vụ & Ràng Buộc Toàn Vẹn"
  ],
  [
    "BẢNG DỮ LIỆU: USERS"
  ],
  [
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
    "users",
    "role",
    "TINYINT",
    "1",
    "",
    "No",
    "0",
    "Phân quyền: 0=Khách hàng, 1=Nhân viên, 2=Admin"
  ],
  [
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
    "BẢNG DỮ LIỆU: CINEMAS"
  ],
  [
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
    "BẢNG DỮ LIỆU: ROOMS"
  ],
  [
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
    "BẢNG DỮ LIỆU: MOVIES"
  ],
  [
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
    "BẢNG DỮ LIỆU: SHOWTIMES"
  ],
  [
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
    "BẢNG DỮ LIỆU: SEAT_LAYOUTS"
  ],
  [
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
    "BẢNG DỮ LIỆU: SEAT_HOLDS"
  ],
  [
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
    "BẢNG DỮ LIỆU: BOOKINGS"
  ],
  [
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
    "BẢNG DỮ LIỆU: TICKETS"
  ],
  [
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
    "BẢNG DỮ LIỆU: VOUCHERS"
  ],
  [
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
    "BẢNG DỮ LIỆU: REVIEWS"
  ],
  [
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

  sheet2.getRange("A2").setFontSize(14).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet2.getRange("A3").setFontSize(11).setFontItalic(true).setFontColor("#555555");
  sheet2.getRange("A5:H5").setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet2.setFrozenRows(5);

  const numRows2 = data2.length;
  if (numRows2 >= 6) {
    const dbRange = sheet2.getRange(6, 1, numRows2 - 5, 8);
    dbRange.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
    dbRange.setWrap(true).setVerticalAlignment("middle");

    for (let r = 6; r <= numRows2; r++) {
      const firstVal = sheet2.getRange(r, 1).getValue().toString();
      if (firstVal.startsWith("BẢNG DỮ LIỆU")) {
        sheet2.getRange(r, 1, 1, 8).setBackground(COLOR_SUBHEADER).setFontWeight("bold").setFontColor(COLOR_HEADER);
      } else {
        if (r % 2 === 0) {
          sheet2.getRange(r, 1, 1, 8).setBackground(COLOR_ZEBRA);
        }
        const keyCell = sheet2.getRange(r, 5);
        if (keyCell.getValue().toString().includes("PK")) {
          keyCell.setFontColor("#B91C1C").setFontWeight("bold");
        } else if (keyCell.getValue().toString().includes("FK")) {
          keyCell.setFontColor("#047857").setFontWeight("bold");
        }
      }
    }
  }

  sheet2.setColumnWidth(1, 130);
  sheet2.setColumnWidth(2, 170);
  sheet2.setColumnWidth(3, 110);
  sheet2.setColumnWidth(4, 120);
  sheet2.setColumnWidth(5, 90);
  sheet2.setColumnWidth(6, 70);
  sheet2.setColumnWidth(7, 160);
  sheet2.setColumnWidth(8, 420);

  // =======================================================================================
  // SHEET 4: THÀNH VIÊN DỰ ÁN (4 NGƯỜI)
  // =======================================================================================
  const sheet3 = getOrCreateSheet("THÀNH VIÊN DỰ ÁN");
  sheet3.setTabColor("#047857");

  const data3 = [
  [
    "DANH SÁCH THÀNH VIÊN VÀ PHÂN CÔNG TRÁCH NHIỆM"
  ],
  [
    "Dự án CineMax AI — 4 Thành viên (Không bao gồm Đặng Quốc Toản)"
  ],
  [
    "STT",
    "Họ và Tên",
    "Vai Trò / Vị Trí",
    "Tên Viết Tắt (Trong bảng)",
    "Phân Hệ Phụ Trách",
    "Nhiệm Vụ Cụ Thể Trong Dự Án"
  ],
  [
    "1",
    "Nguyễn Chí Dũng",
    "Trưởng Nhóm / Fullstack Lead & AI Integration",
    "Dũng",
    "Toàn hệ thống & AI Engine",
    "Quản lý mã nguồn (Git Repo), Kiến trúc tổng thể hệ thống, Tích hợp TMDB API & Groq AI Chatbot, Xây dựng Semantic Search RAG, Tối ưu hóa UI/UX Home & Booking Modal, Quản lý phim & Đánh giá."
  ],
  [
    "2",
    "Nguyễn Hải Đăng",
    "Database Architect & Backend Engineer",
    "Đăng",
    "Cơ Sở Dữ Liệu & Concurrency",
    "Thiết kế cấu trúc CSDL Upstash Redis (Hash, Set, Key patterns), Viết các kịch bản Lua Script giữ ghế nguyên tử (hold/commit 300s), Quản lý phân tán khóa phòng chiếu (Distributed Mutex), Thu hồi ghế khi hủy suất."
  ],
  [
    "3",
    "Nguyễn Văn Tuấn",
    "Backend Services & Business Logic Engineer",
    "Tuấn",
    "Engine Nghiệp Vụ & Báo Cáo",
    "Xây dựng Showtime Collision Engine (xử lý va chạm lịch chiếu), Thuật toán Orphan Seat Rule (chống ghế mồ côi), Module F&B Upsell & Pricing Engine, API Thống kê doanh thu rạp, Quản lý Voucher."
  ],
  [
    "4",
    "Đào Duy Minh",
    "Frontend Lead & Security Engineer",
    "Minh",
    "Giao Diện, Auth & Scanner",
    "Phát triển Cổng Quản trị Admin (/admin), Xây dựng Cổng Nhân viên Soát vé (/scanner), Bảo mật vé với chữ ký số HMAC-SHA256, Cơ chế phiên đăng nhập Admin HttpOnly Cookie, Dashboard khách hàng."
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

  sheet3.getRange("A2").setFontSize(14).setFontWeight("bold").setFontColor(COLOR_HEADER);
  sheet3.getRange("A3").setFontSize(11).setFontItalic(true).setFontColor("#555555");
  sheet3.getRange("A5:F5").setBackground(COLOR_HEADER).setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
  sheet3.getRange("A6:F9").setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID).setWrap(true).setVerticalAlignment("middle");

  sheet3.setColumnWidth(1, 60);
  sheet3.setColumnWidth(2, 180);
  sheet3.setColumnWidth(3, 260);
  sheet3.setColumnWidth(4, 120);
  sheet3.setColumnWidth(5, 200);
  sheet3.setColumnWidth(6, 450);

  // Xóa sheet mặc định nếu còn
  const defaultSheets = ["Sheet1", "Trang tính 1", "Sheet"];
  defaultSheets.forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 4) {
      ss.deleteSheet(s);
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Đã tạo bảng tính CineMax AI với Sơ đồ ERD thành công!", "Hoàn tất 100%", 5);
}
