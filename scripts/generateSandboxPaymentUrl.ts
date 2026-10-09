import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const showtimeId = "st-beta-2";
  const seats = ["E5", "E6"];
  const customer = {
    name: "Nguyen Van A",
    phone: "0901234567",
    email: "nguyenvana@gmail.com",
  };

  console.log(`Connecting to server: ${baseUrl}...`);

  // 1. Giữ ghế qua HTTP API để ghi trực tiếp vào bộ nhớ / redis của server
  const holdRes = await fetch(`${baseUrl}/api/seats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ showtimeId, seats }),
  });

  if (!holdRes.ok) {
    const err = await holdRes.text();
    console.error("Lỗi khi giữ ghế:", holdRes.status, err);
    console.error("LƯU Ý: Đảm bảo máy chủ Next.js đã được khởi động với 'npm run dev' tại port 3000!");
    process.exit(1);
  }

  const holdData = (await holdRes.json()) as { holdId: string; quote: { total: number } };
  const holdId = holdData.holdId;

  // 2. Gọi endpoint tạo giao dịch VNPay
  const createRes = await fetch(`${baseUrl}/api/payment/vnpay/create-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({
      showtimeId,
      holdId,
      customer,
      concessions: [],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error("Lỗi khi tạo URL VNPay:", createRes.status, err);
    process.exit(1);
  }

  const createData = (await createRes.json()) as {
    success: boolean;
    paymentUrl: string;
    bookingId: string;
    txnRef: string;
    expireAt: string;
  };

  console.log("\n========================================================");
  console.log("🎟️ ĐÃ TẠO PHIÊN GIỮ GHẾ & ĐƠN PENDING THÀNH CÔNG (TẠI SERVER DEV)");
  console.log(`- Booking ID:  ${createData.bookingId}`);
  console.log(`- TxnRef:      ${createData.txnRef}`);
  console.log(`- Ghế:         ${seats.join(", ")}`);
  console.log(`- Hết hạn lúc: ${createData.expireAt}`);
  console.log("========================================================");
  console.log("\n👉 COPY ĐƯỜNG DẪN DƯỚI ĐÂY MỞ TRÊN TRÌNH DUYỆT ĐỂ THANH TOÁN:\n");
  console.log(createData.paymentUrl);
  console.log("\n========================================================\n");
}

main().catch((err) => {
  console.error("Lỗi script:", err);
  process.exit(1);
});
