# VNPay Sandbox Test Evidence

Bộ tài liệu minh chứng kiểm thử cổng thanh toán VNPay Sandbox thực tế.

## 1. Kịch bản kiểm thử (Test Scenario)
- **Mã đơn / Suất chiếu**: Ghế A1 (Standard: 55.000đ) + Combo Couple (89.000đ).
- **Tổng tiền**: 144.000 VNĐ (`vnp_Amount = 14400000`).
- **Thẻ test NCB**:
  - Số thẻ: `9704198526191432198`
  - Tên chủ thẻ: `NGUYEN VAN A`
  - Ngày phát hành: `07/15`
  - OTP: `123456`
- **Môi trường**: Sandbox VNPay thực tế (`https://sandbox.vnpayment.vn`) tự động hóa thông qua Playwright (Microsoft Edge).

## 2. Danh mục ảnh chụp màn hình
1. `vnpay_sandbox_checkout.png` - Màn hình chọn phương thức thanh toán VNPay Sandbox.
2. `vnpay_step1_methods.png` - Chọn danh mục Thẻ nội địa & tài khoản ngân hàng.
3. `vnpay_step2_search_ncb.png` - Tìm kiếm và chọn ngân hàng Quốc Dân (NCB).
4. `vnpay_ncb_direct_form.png` - Form nhập thông tin thẻ ngân hàng NCB.
5. `vnpay_ncb_filled.png` - Điền thông tin thẻ test thành công.
6. `vnpay_ncb_otp_screen.png` - Màn hình xác thực OTP và Modal điều khoản.
7. `vnpay_ncb_otp_filled.png` - Nhập mã OTP `123456`.
8. `vnpay_final_result.png` - Phản hồi thành công từ VNPay và chuyển hướng về hệ thống.

## 3. Cách chạy lại kiểm thử
```bash
# Kiểm thử đơn vị & xử lý IPN giả lập
npx tsx scripts/testVnpaySuite.ts
npx tsx scripts/verifyRealIpnPayload.ts

# Kiểm thử luồng trình duyệt sandbox thực tế
npx tsx scripts/testRealBrowserVnpay.ts
```
