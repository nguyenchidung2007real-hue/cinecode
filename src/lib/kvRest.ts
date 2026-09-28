/**
 * CineMax AI - Upstash/Vercel KV REST helper dùng chung toàn hệ thống.
 * Hỗ trợ timeout 4000ms mặc định và opt-in retry 1 lần cho các lệnh idempotent.
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

export interface KvCommandOptions {
  /** Chỉ retry 1 lần nếu idempotent === true và gặp lỗi mạng/timeout */
  idempotent?: boolean;
  timeoutMs?: number;
}

/** Gọi Upstash REST theo kiểu "command trong body". Ném lỗi nếu HTTP/Redis báo lỗi. */
export async function kvCommand(
  config: KvConfig,
  command: readonly string[],
  options?: KvCommandOptions
): Promise<unknown> {
  const timeoutMs = options?.timeoutMs ?? 4000;
  const isIdempotent = options?.idempotent ?? false;

  async function executeOnce(): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Upstash REST trả về HTTP ${response.status}`);

      const json: unknown = await response.json();
      if (!isUpstashResponse(json)) throw new Error("Phản hồi Upstash không đúng định dạng");
      if (json.error) throw new Error(`Upstash báo lỗi lệnh: ${json.error}`);
      return json.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  try {
    return await executeOnce();
  } catch (error) {
    if (isIdempotent) {
      // Chỉ retry duy nhất 1 lần cho lệnh idempotent khi gặp sự cố mạng hoặc timeout
      return await executeOnce();
    }
    throw error;
  }
}
