# UI/UX Rules & Guidelines: Modal & Flow Design

Tuân thủ nghiêm ngặt các quy tắc UI/UX sau khi viết code giao diện cho dự án CineMax AI:

1. **Cấm tuyệt đối Nested Modals (Modal đè lên Modal)**:
   - Không bao giờ mở một hộp thoại mới đè lên một hộp thoại đang mở.
   - Không mở modal nối tiếp liên tiếp nhau gây giật màn hình hoặc cảm giác bị nhốt trong popups.

2. **Không nhồi nhét danh sách lớn vào Modal**:
   - Không dùng Modal/Popup để hiển thị lưới sản phẩm, danh sách phim dài có thanh cuộn dọc (scrollable) và thanh tìm kiếm/bộ lọc phức tạp.
   - Hãy hiển thị trực tiếp trên mặt trang (Inline Section) với cuộn mượt (Smooth Scroll) hoặc chuyển hướng sang trang riêng (Dedicated Route).

3. **Khi nào được dùng Modal**:
   - Chỉ dùng Modal cho các xác nhận ngắn gọn (Confirm Dialog), thông báo nhanh, xem trailer/chi tiết phim, hoặc biểu mẫu ngắn (dưới 3 trường thông tin).
   - Với quy trình đặt vé, `BookingModal` chỉ mở khi người dùng ĐÃ chọn 1 phim cụ thể để thực hiện chọn suất chiếu, ghế, và thanh toán.

4. **Giải pháp thay thế cho luồng nhiều bước**:
   - Với các luồng (như Chọn Combo -> Chọn Phim -> Chọn Suất chiếu -> Chọn Ghế):
     - Bước Chọn Phim: Sử dụng giao diện trực tiếp trên mặt trang (Inline Section) kèm dải thông báo ưu đãi đang kích hoạt (Inline Offer Bar) ngay trên danh mục phim.
     - Khi bấm vào phim: Mở trực tiếp màn hình đặt vé của đúng phim đó và tự động gắn mã ưu đãi/combo.
