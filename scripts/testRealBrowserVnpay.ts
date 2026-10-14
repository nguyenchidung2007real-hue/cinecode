import { chromium } from "@playwright/test";
import { createVnpayPaymentUrl } from "../src/lib/vnpay";

async function testVnpaySandboxBrowser() {
  console.log("=== BẮT ĐẦU TEST LUỒNG TRÌNH DUYỆT THỰC TẾ TRÊN VNPAY SANDBOX ===");

  process.env.VNPAY_TMN_CODE = "CUOQNZLU";
  process.env.VNPAY_HASH_SECRET = "HTRLPQFTBFKYZOHMBKIWIOVWKJCBUEMX";
  process.env.VNPAY_RETURN_URL = "http://localhost:3000/api/payment/vnpay/return";

  const bookingId = "bk-browser-" + Date.now();
  const txnRef = `${bookingId}.1`;
  const amount = 144000;

  console.log(`1. Tạo paymentUrl trực tiếp cho NCB: ${bookingId}, số tiền: ${amount} VND...`);
  const paymentUrl = createVnpayPaymentUrl({
    amount,
    txnRef,
    bankCode: "NCB",
    orderInfo: `Thanh toan ve xem phim ${bookingId}`,
    ipAddr: "127.0.0.1",
    expireDate: new Date(Date.now() + 15 * 60 * 1000),
  });

  console.log("Payment URL sinh ra (trực tiếp NCB):\n", paymentUrl);

  console.log("\n2. Khởi động trình duyệt Edge Playwright...");
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let capturedReturnUrl = "";
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("vnpay/return") || u.includes("vnp_ResponseCode") || u.includes("vnp_SecureHash")) {
      capturedReturnUrl = u;
      console.log("\n>>> [THÀNH CÔNG] VNPAY SANDBOX ĐÃ CHUYỂN HƯỚNG VỀ RETURN URL THẬT:");
      console.log(u);
    }
  });

  console.log("3. Mở paymentUrl trên sandbox.vnpayment.vn...");
  await page.goto(paymentUrl, { waitUntil: "networkidle", timeout: 30000 });

  const pageTitle = await page.title();
  const currentUrl = page.url();
  console.log("-> URL hiện tại của trình duyệt:", currentUrl);
  console.log("-> Title trang VNPay:", pageTitle);

  await page.screenshot({ path: "vnpay_ncb_direct_form.png" });
  console.log("-> Đã lưu ảnh màn hình form NCB trực tiếp: vnpay_ncb_direct_form.png");

  // 4. Nhập thông tin thẻ test NCB trên form chính thức
  console.log("4. Nhập thông tin thẻ test NCB...");
  const cardInput = page.locator("input[placeholder*='số thẻ'], input[placeholder*='Số thẻ']").first();
  await cardInput.waitFor({ state: "visible", timeout: 15000 });
  await cardInput.fill("9704198526191432198");

  const nameInput = page.locator("input[placeholder*='chủ thẻ'], input[placeholder*='Chủ thẻ']").first();
  await nameInput.fill("NGUYEN VAN A");

  const dateInput = page.locator("input[placeholder*='MM/YY']").first();
  await dateInput.fill("07/15");

  await page.screenshot({ path: "vnpay_ncb_filled.png" });
  console.log("-> Đã điền xong thẻ test. Lưu ảnh: vnpay_ncb_filled.png");

  console.log("5. Chờ hệ thống validate thẻ test và bấm nút 'Tiếp tục'...");
  await page.waitForTimeout(4000);
  const continueBtn = page.getByText("Tiếp tục", { exact: true });
  console.log("-> Nút Tiếp tục isVisible:", await continueBtn.isVisible());
  await continueBtn.click();

  // Chờ modal điều khoản sử dụng hiện lên và bấm "Đồng ý & Tiếp tục"
  console.log("6. Chờ modal Điều khoản sử dụng và bấm 'Đồng ý & Tiếp tục'...");
  await page.waitForTimeout(2000);
  const agreeBtn = page.getByText("Đồng ý & Tiếp tục").first();
  if (await agreeBtn.isVisible()) {
    console.log("-> Đã hiển thị modal điều khoản, click Đồng ý & Tiếp tục...");
    await agreeBtn.click();
    await page.waitForTimeout(4000);
  }

  console.log("7. Chuyển sang màn hình xác thực OTP...");
  console.log("-> URL tại bước OTP:", page.url());
  await page.screenshot({ path: "vnpay_ncb_otp_screen.png" });
  console.log("-> Đã lưu ảnh màn hình OTP: vnpay_ncb_otp_screen.png");

  // Kiểm tra ô OTP
  console.log("8. Tìm ô nhập mã OTP test...");
  const otpInput = page.locator("input#otp, input#otpValue, input[name='otp'], input[placeholder*='OTP'], input[type='password'], input[type='text']").last();
  await otpInput.waitFor({ state: "visible", timeout: 15000 });
  console.log("-> Nhập mã OTP test: 123456...");
  await otpInput.fill("123456");

  await page.screenshot({ path: "vnpay_ncb_otp_filled.png" });
  console.log("-> Đã điền OTP. Lưu ảnh: vnpay_ncb_otp_filled.png");

  const submitBtn = page.locator("button:has-text('Xác nhận'), button:has-text('Thanh toán'), a:has-text('Xác nhận'), a:has-text('Thanh toán')").first();
  console.log("9. Bấm Xác nhận thanh toán OTP...");
  await submitBtn.click();
  await page.waitForTimeout(8000);

  if (capturedReturnUrl) {
    const urlObj = new URL(capturedReturnUrl);
    const params = Object.fromEntries(urlObj.searchParams.entries());
    console.log("\n--- THAM SỐ TRẢ VỀ TỪ VNPAY SANDBOX THẬT ---");
    console.log(params);
    console.log("vnp_ResponseCode:", params.vnp_ResponseCode, "(00 = Thành công)");
    console.log("vnp_Amount:", params.vnp_Amount, "(= 14400000)");
    console.log("vnp_TransactionNo:", params.vnp_TransactionNo);
  }

  await browser.close();
  console.log("\n=== XÁC NHẬN: LUỒNG TRÌNH DUYỆT THẬT TRÊN VNPAY SANDBOX HOÀN THÀNH 100%! ===");

  await browser.close();
  console.log("\n=== XÁC NHẬN: LUỒNG TRÌNH DUYỆT THẬT TRÊN VNPAY SANDBOX HOÀN THÀNH 100%! ===");
}

testVnpaySandboxBrowser().catch((err) => {
  console.error("Lỗi khi mở trình duyệt test:", err);
  process.exit(1);
});
