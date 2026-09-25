import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { getMovies } from "@/lib/movieService";
import { buildRagContext } from "@/lib/hfRagService";
import { detectMoodAndMovie, type MoodAnalysisResult } from "@/lib/moodDetector";
import { recommendSeats, extractPartySize } from "@/lib/seatRecommender";
import type { Movie } from "@/types";

/**
 * POST /api/chat
 * body: { messages: { role: "user" | "assistant"; content: string }[] }
 *       (hoặc: { message: string })
 *
 * Trả về Server-Sent Events:
 *   data: {"content":"...", "text":"..."}     -> từng đoạn văn bản
 *   data: {"recommendation":{...}, "type":"recommendation", "data":{...}} -> thẻ Quick-Book
 *   data: [DONE]                              -> kết thúc
 *
 * Header phụ: X-Rag-Mode = hybrid-embedding | lexical | off
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Hằng số & kiểu dữ liệu
// ---------------------------------------------------------------------------

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_RAG_CONTEXT_CHARS = 6000;
const MAX_CATALOG_ITEMS = 30;

type ChatRole = "user" | "assistant";

interface IncomingMessage {
  role: ChatRole;
  content: string;
}

interface MoodInfo {
  label: string | null;
  suggestedMovieId?: string | number;
  reason?: string;
}

type RagContextResult = Awaited<ReturnType<typeof buildRagContext>>;

interface RecommendationPayload {
  movieId: string | number;
  movieTitle: string;
  posterPath?: string;
  reason: string;
  suggestedSeats?: string[];
}

type PickSource = "rag" | "mood";

interface MoviePick {
  movie: Movie;
  source: PickSource;
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// Dữ liệu phim
// ---------------------------------------------------------------------------

async function getMovieCatalog(): Promise<Movie[]> {
  try {
    return await getMovies("all");
  } catch (error) {
    console.error("[/api/chat] Không lấy được danh mục phim:", error);
    return [];
  }
}

function statusLabel(status: Movie["status"]): string {
  switch (status) {
    case "now_playing":
      return "đang chiếu";
    case "upcoming":
      return "sắp chiếu";
    case "trending":
      return "thịnh hành";
    default:
      return String(status);
  }
}

function summarizeCatalog(movies: readonly Movie[]): string {
  if (movies.length === 0) return "(Danh mục phim hiện chưa tải được.)";
  return [...movies]
    .sort((a, b) => b.voteAverage - a.voteAverage)
    .slice(0, MAX_CATALOG_ITEMS)
    .map(
      (m) =>
        `- ${m.title} | ${m.genres.join(", ")} | ${m.voteAverage.toFixed(1)}/10 | ${m.durationMinutes} phút | ${statusLabel(m.status)}`
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Tin nhắn đầu vào
// ---------------------------------------------------------------------------

function sanitizeMessages(body: unknown): IncomingMessage[] {
  if (!body || typeof body !== "object") return [];
  const record = body as { messages?: unknown; message?: unknown };

  if (typeof record.message === "string" && !Array.isArray(record.messages)) {
    const content = record.message.trim().slice(0, MAX_MESSAGE_LENGTH);
    return content ? [{ role: "user", content }] : [];
  }

  if (!Array.isArray(record.messages)) return [];

  const cleaned: IncomingMessage[] = [];
  for (const item of record.messages) {
    if (!item || typeof item !== "object") continue;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (text) cleaned.push({ role, content: text });
  }
  return cleaned.slice(-MAX_HISTORY_MESSAGES);
}

// ---------------------------------------------------------------------------
// Phát hiện tâm trạng (Goal 4) + ý định gợi ý phim
// ---------------------------------------------------------------------------

function readMood(text: string, movies: Movie[]): MoodInfo {
  try {
    const result: MoodAnalysisResult = detectMoodAndMovie(text, movies);
    if (result && result.mood !== "neutral" && result.confidence >= 0.4) {
      return {
        label: result.moodLabel,
        suggestedMovieId: result.suggestedMovieId,
        reason: result.reason,
      };
    }
  } catch (error) {
    console.warn("[/api/chat] detectMoodAndMovie lỗi:", error);
  }
  return { label: null };
}

const RECOMMEND_INTENT =
  /\b(dat ve|mua ve|chon ghe|lay ve|book ve|goi y|de xuat|tu van|nen xem|phim gi hay|phim nao hay|tim giup|co phim gi|co phim nao)\b/i;

function wantsRecommendation(text: string): boolean {
  return RECOMMEND_INTENT.test(stripDiacritics(text));
}

function hitToMovie(hit: unknown, catalog: readonly Movie[]): Movie | null {
  if (!hit || typeof hit !== "object") return null;
  const record = hit as Record<string, unknown>;
  const candidate = (record.movie && typeof record.movie === "object" ? record.movie : record) as Partial<Movie>;

  const id = candidate.id ?? (record.movieId as string | number | undefined);
  if (id !== undefined) {
    const found = catalog.find((m) => String(m.id) === String(id));
    if (found) return found;
  }
  if (candidate.id !== undefined && typeof candidate.title === "string") {
    return candidate as Movie;
  }
  return null;
}

function choosePick(
  userText: string,
  movies: readonly Movie[],
  rag: RagContextResult | null,
  mood: MoodInfo
): MoviePick | null {
  const intent = wantsRecommendation(userText);

  // 1) Có tâm trạng rõ ràng -> chọn phim gợi ý từ moodDetector
  if (mood.label && mood.suggestedMovieId) {
    const moodMovie = movies.find((m) => String(m.id) === String(mood.suggestedMovieId));
    if (moodMovie) return { movie: moodMovie, source: "mood" };
  }

  // 2) Người dùng hỏi phim cụ thể hoặc tìm kiếm nội dung (chỉ khi có ý định rõ ràng)
  if (rag && rag.hits.length > 0 && intent) {
    const ragMovie = hitToMovie(rag.hits[0], movies);
    if (ragMovie) return { movie: ragMovie, source: "rag" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Gợi ý ghế (Goal 4)
// ---------------------------------------------------------------------------

function detectPartySize(text: string, mood?: MoodInfo): number {
  const extracted = extractPartySize(text);
  if (extracted !== null && extracted !== undefined) return extracted;
  // Mặc định 1 người, chỉ thành 2 nếu tâm trạng lãng mạn
  if (mood?.label === "romantic") return 2;
  return 1;
}

function suggestSeats(userText: string, mood?: MoodInfo, format = "2D Phụ Đề"): string[] {
  const partySize = detectPartySize(userText, mood);
  try {
    const rec = recommendSeats(format, partySize);
    if (rec.recommendedSeats && rec.recommendedSeats.length > 0) {
      return rec.recommendedSeats;
    }
  } catch (error) {
    console.warn("[/api/chat] recommendSeats lỗi:", error);
  }
  const start = Math.max(1, 7 - Math.floor(partySize / 2));
  return Array.from({ length: partySize }, (_, i) => `F${start + i}`);
}

function buildRecommendation(
  pick: MoviePick,
  mood: MoodInfo,
  seats: string[]
): RecommendationPayload {
  const genres = pick.movie.genres.slice(0, 3).join(", ");
  const reason =
    pick.source === "rag"
      ? `Khớp nhất với nội dung bạn tìm kiếm${genres ? ` (${genres})` : ""}`
      : mood.reason || `Hợp với tâm trạng "${mood.label ?? "hiện tại"}" của bạn${genres ? ` (${genres})` : ""}`;

  return {
    movieId: pick.movie.id,
    movieTitle: pick.movie.title,
    posterPath: pick.movie.posterPath || undefined,
    reason,
    suggestedSeats: seats,
  };
}

// ---------------------------------------------------------------------------
// System prompt (có chèn RAG context)
// ---------------------------------------------------------------------------

function buildSystemPrompt(params: {
  movies: readonly Movie[];
  ragContextText: string;
  mood: MoodInfo;
  pick: MoviePick | null;
}): string {
  const { movies, ragContextText, mood, pick } = params;

  const sections: string[] = [
    "Bạn là CineMax AI, trợ lý tư vấn phim và đặt vé thông minh của rạp chiếu CineMax.",
    "",
    "## Quy tắc trả lời",
    "- Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa khoảng 120 từ), không dùng markdown nặng.",
    "- Chỉ gợi ý phim có trong danh mục CineMax bên dưới; ghi đúng tên phim.",
    "- Không bịa suất chiếu, giá vé hay thông tin không có trong dữ liệu.",
    "- Khi gợi ý phim, nêu lý do ngắn gọn và mời người dùng bấm nút Đặt vé nhanh / chọn ghế.",
    "",
    "## Danh mục phim CineMax (tên | thể loại | điểm | thời lượng | trạng thái)",
    summarizeCatalog(movies),
  ];

  if (ragContextText) {
    sections.push(
      "",
      "## Context tri thức phim truy xuất được từ RAG (Hugging Face Semantic Retrieval)",
      "Đây là DỮ LIỆU THAM KHẢO về cốt truyện, đạo diễn, diễn viên và điểm đánh giá thực tế. " +
        "Hãy dựa vào đó để trả lời chính xác:",
      "<rag_context>",
      truncate(ragContextText.replace(/<\/rag_context>/gi, ""), MAX_RAG_CONTEXT_CHARS),
      "</rag_context>"
    );
  }

  if (mood.label) {
    sections.push("", `## Tâm trạng phát hiện được: ${mood.label}`, "Hãy đồng cảm nhẹ nhàng trước khi gợi ý.");
  }

  if (pick) {
    sections.push(
      "",
      "## Phim ưu tiên gợi ý",
      `Ứng viên phù hợp nhất hiện tại là "${pick.movie.title}". Hãy giới thiệu phim này nếu hợp ngữ cảnh; ` +
        "giao diện sẽ tự động hiển thị thẻ Đặt vé nhanh cho phim này."
    );
  }

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Phản hồi mock (khi thiếu GROQ_API_KEY hoặc Groq lỗi)
// ---------------------------------------------------------------------------

function buildMockReply(
  movies: readonly Movie[],
  pick: MoviePick | null,
  mood: MoodInfo
): string {
  if (pick) {
    const m = pick.movie;
    const intro = mood.label
      ? `Mình hiểu bạn đang cảm thấy "${mood.label}". `
      : "Dựa trên mô tả của bạn, ";
    const overview = m.overview ? ` ${truncate(m.overview, 180)}` : "";
    const director = m.director ? `, đạo diễn ${m.director}` : "";
    return (
      `${intro}mình gợi ý xem "${m.title}" (${m.genres.slice(0, 3).join(", ")}${director}), ` +
      `điểm đánh giá ${m.voteAverage.toFixed(1)}/10.${overview} ` +
      'Bạn có thể bấm vào thẻ "Đặt vé nhanh" bên dưới để giữ ghế đẹp ngay nhé! 🍿'
    );
  }

  const top = [...movies].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, 3);
  if (top.length === 0) {
    return "Mình là CineMax AI. Hiện danh mục phim chưa tải được, bạn thử lại sau ít phút nhé!";
  }
  const list = top.map((m) => `"${m.title}" (${m.voteAverage.toFixed(1)}/10)`).join(", ");
  return (
    `Mình có thể gợi ý phim theo tâm trạng hoặc tìm kiếm nội dung bạn thích nhờ AI RAG. ` +
    `Hiện rạp đang chiếu rất hot: ${list}. Bạn thích thể loại nào, hay đang cảm thấy thế nào hôm nay?`
  );
}

function splitIntoChunks(text: string, wordsPerChunk = 3): string[] {
  const words = text.split(/(\s+)/);
  const chunks: string[] = [];
  let buffer = "";
  let count = 0;
  for (const part of words) {
    buffer += part;
    if (part.trim()) count += 1;
    if (count >= wordsPerChunk) {
      chunks.push(buffer);
      buffer = "";
      count = 0;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body phải là JSON hợp lệ.", 400);
  }

  const messages = sanitizeMessages(body);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return jsonError("Thiếu nội dung tin nhắn của người dùng.", 400);
  }
  const userText = lastUser.content;

  // 1) Dữ liệu phim + RAG + tâm trạng (chạy song song)
  const movies = await getMovieCatalog();

  const [ragContext, mood] = await Promise.all([
    (async (): Promise<RagContextResult | null> => {
      try {
        return await buildRagContext(userText, movies);
      } catch (error) {
        console.error("[/api/chat] buildRagContext lỗi, chạy không RAG:", error);
        return null;
      }
    })(),
    Promise.resolve(readMood(userText, movies)),
  ]);

  const ragContextText =
    ragContext && typeof ragContext.contextText === "string" ? ragContext.contextText.trim() : "";

  // 2) Chọn phim gợi ý + ghế
  const pick = choosePick(userText, movies, ragContext, mood);
  const recommendation = pick
    ? buildRecommendation(pick, mood, suggestSeats(userText, mood))
    : null;

  // 3) Chuẩn bị prompt
  const systemPrompt = buildSystemPrompt({ movies, ragContextText, mood, pick });
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const useGroq = Boolean(apiKey) && !apiKey?.includes("your_groq_key_here");

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown): void => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        let produced = false;

        if (useGroq && apiKey) {
          const groq = new Groq({ apiKey });
          const modelsToTry = [
            process.env.GROQ_MODEL,
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b",
          ].filter(Boolean) as string[];

          for (const modelName of modelsToTry) {
            try {
              const completion = await groq.chat.completions.create({
                model: modelName,
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                temperature: 0.6,
                max_tokens: 700,
                stream: true,
              });

              for await (const chunk of completion) {
                if (closed) break;
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                  send({ content: delta, text: delta });
                  produced = true;
                }
              }

              if (produced) break;
            } catch (error) {
              console.warn(`[/api/chat] Groq lỗi với model ${modelName}, thử model tiếp theo:`, error);
              if (produced) break; // Đã gửi một phần phản hồi thì dừng lại, tránh lặp lại câu trả lời
            }
          }
        }

        if (!produced && !closed) {
          for (const piece of splitIntoChunks(buildMockReply(movies, pick, mood))) {
            if (closed) break;
            send({ content: piece, text: piece });
            await sleep(18);
          }
        }

        if (recommendation) {
          // Hỗ trợ cả { recommendation } và { type: "recommendation", data: recommendation }
          send({
            recommendation,
            type: "recommendation",
            data: recommendation,
          });
        }
        if (!closed) controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("[/api/chat] Lỗi khi stream:", error);
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Rag-Mode": ragContext ? String(ragContext.mode) : "off",
    },
  });
}
