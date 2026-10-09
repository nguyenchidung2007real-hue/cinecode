import { createHmac } from "node:crypto";
import { buildVnpaySignData } from "../src/lib/vnpay";
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
  const rawQuery = process.argv[2];
  if (!rawQuery) {
    console.error("Cách dùng: npx tsx scripts/verifyRealIpnPayload.ts \"<toàn_bộ_query_string_vnpay>\"");
    process.exit(1);
  }

  const cleanQuery = rawQuery.startsWith("?") ? rawQuery.slice(1) : rawQuery;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const secretKey = process.env.VNPAY_HASH_SECRET || "RAOCTAVTGKUXNZODZAGCMSRAUQWBIDIU";

  console.log("=== BẮT ĐẦU KIỂM TRA ĐỐI SOÁT PAYLOAD THỰC TẾ ===\n");

  // 1. Gửi nguyên bản payload thật sang IPN
  console.log("1. Kiểm tra 1: Gửi Payload Thật Sang /api/payment/vnpay/ipn");
  const res1 = await fetch(`${baseUrl}/api/payment/vnpay/ipn?${cleanQuery}`);
  const json1 = await res1.json();
  console.log("   -> Kết quả IPN:", json1);
  if (json1.RspCode !== "00") {
    console.error("   ❌ THẤT BẠI ở lần gọi đầu:", json1);
  } else {
    console.log("   ✅ PASSED: Chữ ký số thật và dữ liệu gốc hợp lệ 100% (Vé chuyển valid)!\n");
  }

  // 2. Kiểm tra Idempotency (gọi lại cùng payload)
  console.log("2. Kiểm tra 2: Thử Nghiệm Idempotency (gọi lại lần 2)");
  const res2 = await fetch(`${baseUrl}/api/payment/vnpay/ipn?${cleanQuery}`);
  const json2 = await res2.json();
  console.log("   -> Kết quả IPN:", json2);
  if (json2.RspCode === "00" && json2.Message === "Order already confirmed") {
    console.log("   ✅ PASSED: Idempotency chặn thành công lần gọi lặp!\n");
  } else {
    console.log("   ℹ️ Kết quả:", json2);
  }

  // 3. Kiểm tra Tamper 1: Sửa dữ liệu không ký lại (kỳ vọng 97 - Invalid Checksum)
  console.log("3. Kiểm tra 3: Sửa Dữ Liệu Nhưng Không Ký Lại (Tamper Data)");
  const params3 = new URLSearchParams(cleanQuery);
  const originalAmount = params3.get("vnp_Amount") || "1000000";
  params3.set("vnp_Amount", String(Number(originalAmount) + 100000)); // sửa số tiền
  const res3 = await fetch(`${baseUrl}/api/payment/vnpay/ipn?${params3.toString()}`);
  const json3 = await res3.json();
  console.log("   -> Kết quả IPN:", json3);
  if (json3.RspCode === "97") {
    console.log("   ✅ PASSED: Phát hiện dữ liệu bị sửa đổi (Invalid Checksum)!\n");
  } else {
    console.error("   ❌ LỖI: Không chặn được dữ liệu bị sửa đổi:", json3);
  }

  // 4. Kiểm tra Tamper 2: Server Authority (Sửa số tiền và ký lại đúng chuẩn)
  // LƯU Ý QUAN TRỌNG: Phải dùng đơn vé MỚI ở trạng thái pending (không dùng lại vé Ca 1 đã valid)
  console.log("4. Kiểm tra 4: Server Authority trên Vé Pending Mới (Sửa số tiền và tự ký lại)");
  try {
    const showtimeId = "st-beta-2";
    const seats2 = ["F1", "F2"];
    
    // Tạo hold mới qua API
    const holdRes2 = await fetch(`${baseUrl}/api/seats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showtimeId, seats: seats2 }),
    });
    const holdData2 = await holdRes2.json();
    
    // Tạo đơn pending mới qua API
    const createRes2 = await fetch(`${baseUrl}/api/payment/vnpay/create-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        showtimeId,
        holdId: holdData2.holdId,
        customer: { name: "Test Tamper", phone: "0909999999" },
        concessions: [],
      }),
    });
    const createData2 = await createRes2.json();

    // Dựng params IPN với txnRef của vé pending mới, nhưng số tiền sai (9.999đ)
    const params4 = new URLSearchParams(cleanQuery);
    params4.set("vnp_TxnRef", createData2.txnRef);
    params4.set("vnp_Amount", "999900"); // 9.999 VNĐ (sai lệch so với giá vé 110.000đ)
    params4.delete("vnp_SecureHash");
    params4.delete("vnp_SecureHashType");

    const dict4: Record<string, string> = {};
    params4.forEach((val, key) => {
      dict4[key] = val;
    });
    const { signData } = buildVnpaySignData(dict4);
    const hash4 = createHmac("sha512", secretKey).update(Buffer.from(signData, "utf-8")).digest("hex");
    params4.set("vnp_SecureHash", hash4);

    const res4 = await fetch(`${baseUrl}/api/payment/vnpay/ipn?${params4.toString()}`);
    const json4 = await res4.json();
    console.log("   -> Kết quả IPN:", json4);
    if (json4.RspCode === "04") {
      console.log("   ✅ PASSED: Server Authority chặn thành công số tiền lệch giá vé (RspCode: 04)!\n");
    } else {
      console.error("   ❌ LỖI: Không phát hiện được số tiền lệch:", json4);
    }
  } catch (err) {
    console.error("   ❌ Lỗi khi chạy Ca 4:", err);
  }

  console.log("=== HOÀN TẤT BỘ KIỂM TRA ĐỐI SOÁT PAYLOAD THỰC TẾ ===");
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
