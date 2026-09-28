/**
 * CineMax AI - Upstash/Vercel KV REST helper dùng chung cho seatStore & rateLimit.
 * (ticketStore.ts / showtimeStore.ts hiện vẫn có bản sao riêng; có thể gom về đây ở một PR dọn nợ kỹ thuật
 *  riêng để không dính rủi ro hồi quy vào code đã kiểm thử.)
 */

export interface KvConfig {
  readonly url: string;
  readonly token: string;
}

export function getKvConfig(): KvConfig | null {
  const url = (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

interface UpstashResponse {
  result: unknown;
  error?: string;
}

function isUpstashResponse(value: unknown): value is UpstashResponse {
  return typeof value === "object" && value !== null && "result" in value;
}

/** Gọi Upstash REST theo kiểu "command trong body". Ném lỗi nếu HTTP/Redis báo lỗi. */
export async function kvCommand(config: KvConfig, command: readonly string[]): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash REST trả về HTTP ${response.status}`);

  const json: unknown = await response.json();
  if (!isUpstashResponse(json)) throw new Error("Phản hồi Upstash không đúng định dạng");
  if (json.error) throw new Error(`Upstash báo lỗi lệnh: ${json.error}`);
  return json.result;
}
