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

const GROQ_MODEL = "qwen/qwen3.8-27b";
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

export interface BookingDraftPayload {
  movieId?: string;
  movieTitle: string;
  cinemaName?: string;
  showtimeId?: string;
  showtimeLabel?: string;
  format?: string;
  seatType: "standard" | "vip" | "couple";
  seatCount: number;
  suggestedSeatIds: string[];
  comboName?: string;
  comboQuantity?: number;
  autoExecute?: boolean;
}

export interface WebActionPayload {
  action:
    | "auto_book"
    | "scroll_to_showtimes"
    | "scroll_to_movies"
    | "open_my_tickets"
    | "open_search"
    | "filter_mood"
    | "navigate_page";
  targetSection?: string;
  moodId?: string;
  message?: string;
  data?: unknown;
}

const BOOKING_TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "prepare_booking_draft",
      description:
        "Chuẩn bị bản nháp đặt vé rạp và gợi ý ghế cho phim. CHỈ đặt autoExecute: true khi và chỉ khi trong tin nhắn HIỆN TẠI (mới nhất) của người dùng có mệnh lệnh yêu cầu đặt vé hộ trực tiếp ('đặt hộ', 'mua hộ', 'book hộ', 'chọn ghế hộ'). Nếu tin nhắn hiện tại chỉ hỏi thông tin, hỏi giá, chào hỏi, đổi phim, hỏi lịch chiếu hoặc trò chuyện: BẮT BUỘC đặt autoExecute: false.",
      parameters: {
        type: "object",
        properties: {
          movieId: { type: "string", description: "ID của bộ phim" },
          movieTitle: { type: "string", description: "Tên bộ phim khách muốn xem" },
          cinemaName: { type: "string", description: "Tên rạp chiếu (VD: CineMax Vincom Bà Triệu)" },
          showtimeId: { type: "string", description: "ID suất chiếu nếu có" },
          showtimeLabel: { type: "string", description: "Giờ chiếu (VD: 19:30 - Hôm nay)" },
          format: { type: "string", enum: ["2D", "IMAX Laser", "3D"], description: "Định dạng phòng chiếu" },
          seatType: {
            type: "string",
            enum: ["standard", "vip", "couple"],
            description: "Hạng ghế ('standard' | 'vip' | 'couple')",
          },
          seatCount: { type: "number", description: "Số lượng ghế muốn đặt (1-8). Dựa trên tin nhắn hiện tại, mặc định 1 nếu không nói rõ." },
          suggestedSeatIds: {
            type: "array",
            items: { type: "string" },
            description: "Mã ghế gợi ý theo hạng ghế (VD: ['F6', 'F7'] cho vip, ['D5', 'D6'] cho standard, ['K1', 'K2'] cho couple Sweetbox)",
          },
          comboName: { type: "string", description: "Tên combo bắp nước nếu khách nhắc tới" },
          comboQuantity: { type: "number", description: "Số lượng combo bắp nước" },
          autoExecute: {
            type: "boolean",
            description: "CHỈ đặt true nếu tin nhắn HIỆN TẠI của người dùng ra lệnh 'đặt hộ', 'mua hộ', 'book ngay'. Nếu người dùng chỉ đang trò chuyện, hỏi thông tin, hoặc đổi phim, BẮT BUỘC đặt false.",
          },
        },
        required: ["movieTitle", "seatType", "seatCount", "suggestedSeatIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "control_website",
      description:
        "Điều khiển trực tiếp giao diện website theo yêu cầu người dùng: cuộn đến bảng lịch chiếu, danh sách phim đang chiếu, mở ví vé của tôi, mở công cụ tìm kiếm, hoặc lọc phim theo tâm trạng.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "auto_book",
              "scroll_to_showtimes",
              "scroll_to_movies",
              "open_my_tickets",
              "open_search",
              "filter_mood",
              "navigate_page",
            ],
            description: "Loại hành động điều khiển trang web muốn thực thi",
          },
          targetSection: {
            type: "string",
            description: "ID phần tử trên trang (matrix-section, commercial-tabs) hoặc URL điều hướng (/dashboard, /staff)",
          },
          moodId: {
            type: "string",
            enum: ["all", "blockbuster", "mindblown", "chill", "emotional"],
            description: "ID tâm trạng nếu action là filter_mood",
          },
          message: {
            type: "string",
            description: "Thông báo ngắn gọn cho người dùng biết AI đang điều khiển web làm gì",
          },
        },
        required: ["action"],
      },
    },
  },
];

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
    "## Quy tắc trả lời & Điều khiển hệ thống",
    "- Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa khoảng 120 từ), không dùng markdown nặng.",
    "- Chỉ gợi ý phim có trong danh mục CineMax bên dưới; ghi đúng tên phim.",
    "- Không bịa suất chiếu, giá vé hay thông tin không có trong dữ liệu.",
    "- QUY TẮC ĐẶT VÉ VÀ AUTO-EXECUTE (TUYỆT ĐỐI TUÂN THỦ):",
    "  + CHỈ gọi tool prepare_booking_draft với autoExecute: true KHI VÀ CHỈ KHI tin nhắn MỚI NHẤT của người dùng (tin nhắn hiện tại) có mệnh lệnh yêu cầu đặt hộ trực tiếp (như 'đặt hộ', 'mua hộ', 'book hộ', 'chọn ghế hộ', 'mua vé hộ', 'đặt cho tôi').",
    "  + Nếu tin nhắn mới nhất của người dùng là câu hỏi thông tin, hỏi lịch chiếu, hỏi giá vé, chào hỏi, đổi phim, hỏi ý kiến hoặc trò chuyện bình thường (ví dụ: 'đổi sang phim lật mặt 7', 'phim này có hay không', 'giá vé bao nhiêu', 'chiếu lúc mấy giờ', 'chào bạn'): TUYỆT ĐỐI KHÔNG được đặt autoExecute: true và KHÔNG được tự động chuyển vào phần đặt vé. Hãy trả lời câu hỏi và chỉ đề xuất thẻ phim bằng tin nhắn trong cửa sổ chat.",
    "  + Về số lượng vé (seatCount): Phải bóc tách số lượng theo tin nhắn MỚI NHẤT của người dùng (VD: '1 vé', '2 vé', '3 vé'). Nếu tin nhắn hiện tại không nói rõ số vé, mặc định là 1 vé (hoặc 2 vé nếu nói đi đôi/hẹn hò). KHÔNG tự ý giữ nguyên 2 vé từ yêu cầu cũ của các lượt chat trước nếu ở lượt này người dùng không yêu cầu đặt tiếp.",
    "- Khi người dùng muốn xem lịch chiếu, mở ví vé, tìm kiếm phim hoặc lọc tâm trạng, hãy gọi tool control_website để trực tiếp điều khiển giao diện trang web (cuộn trang, mở modal tương ứng).",
    "- Khi gợi ý phim, nêu lý do ngắn gọn và mời người dùng trải nghiệm.",
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
          const modelsToTry = Array.from(
            new Set([
              process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
              "qwen/qwen3.8-27b",
              "openai/gpt-oss-120b",
              "openai/gpt-oss-20b",
              "llama-3.3-70b-versatile",
            ])
          ).filter(Boolean) as string[];

          let toolCallName = "";
          let toolCallArgs = "";

          for (const modelName of modelsToTry) {
            try {
              const completion = await groq.chat.completions.create({
                model: modelName,
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                temperature: 0.6,
                max_tokens: 700,
                tools: BOOKING_TOOLS,
                tool_choice: "auto",
                stream: true,
              });

              for await (const chunk of completion) {
                if (closed) break;
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                  send({ content: delta, text: delta });
                  produced = true;
                }
                const tc = chunk.choices[0]?.delta?.tool_calls?.[0];
                if (tc?.function?.name) toolCallName = tc.function.name;
                if (tc?.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                  produced = true;
                }
              }

              if (produced) break;
            } catch (error) {
              console.warn(`[/api/chat] Groq lỗi với model ${modelName}, thử model tiếp theo:`, error);
              if (produced) break; // Đã gửi một phần phản hồi thì dừng lại, tránh lặp lại câu trả lời
            }
          }

          if (toolCallName === "prepare_booking_draft" && toolCallArgs) {
            try {
              const draft = JSON.parse(toolCallArgs) as BookingDraftPayload;
              const lowerUser = stripDiacritics(userText);

              // KIỂM TRA CHẶT CHẼ: Auto-book CHỈ được kích hoạt khi tin nhắn HIỆN TẠI (userText) có lệnh đặt hộ
              const hasExplicitBookingCommand =
                lowerUser.includes("dat ho") ||
                lowerUser.includes("mua ho") ||
                lowerUser.includes("book ho") ||
                lowerUser.includes("dat giup") ||
                lowerUser.includes("mua giup") ||
                lowerUser.includes("book giup") ||
                lowerUser.includes("dat cho toi") ||
                lowerUser.includes("mua cho toi") ||
                lowerUser.includes("chon ghe ho") ||
                lowerUser.includes("mua ve ho") ||
                lowerUser.includes("dat luon") ||
                lowerUser.includes("mua luon");

              // Nếu tin nhắn hiện tại không có lệnh đặt hộ rõ ràng, tuyệt đối KHÔNG tự động chuyển modal
              draft.autoExecute = Boolean(draft.autoExecute && hasExplicitBookingCommand);

              // Bóc tách chính xác số vé theo tin nhắn HIỆN TẠI của người dùng
              const currentPartySize = extractPartySize(userText);
              if (currentPartySize !== null && currentPartySize > 0) {
                draft.seatCount = currentPartySize;
                draft.suggestedSeatIds = suggestSeats(userText, mood);
              } else if (!hasExplicitBookingCommand && draft.seatCount > 1) {
                // Nếu người dùng không hề yêu cầu đặt vé ở lượt này, không giữ 2 ghế của lượt trước
                draft.seatCount = 1;
                draft.suggestedSeatIds = suggestSeats(userText, mood);
              }

              send({
                type: "booking_draft",
                draft,
                payload: draft,
              });

              if (draft.autoExecute) {
                send({
                  type: "web_action",
                  action: {
                    action: "auto_book",
                    message: `🤖 CineBot AI đang đặt vé hộ bạn: Tự động mở màn hình đặt vé phim "${draft.movieTitle}" và chọn sẵn ghế đẹp...`,
                    data: draft,
                  },
                });
              }
            } catch {
              // Bỏ qua nếu parse JSON bị lỗi
            }
          } else if (toolCallName === "control_website" && toolCallArgs) {
            try {
              const action = JSON.parse(toolCallArgs) as WebActionPayload;
              send({
                type: "web_action",
                action,
                payload: action,
              });
            } catch {
              // Bỏ qua nếu parse JSON bị lỗi
            }
          }
        }

        if (!produced && !closed) {
          for (const piece of splitIntoChunks(buildMockReply(movies, pick, mood))) {
            if (closed) break;
            send({ content: piece, text: piece });
            await sleep(18);
          }

          // Smart Mock Agent Fallback: Tự động điều khiển web hoặc sinh booking_draft
          const lowerUser = stripDiacritics(userText);
          const isExplicitAutoBook =
            lowerUser.includes("dat ho") ||
            lowerUser.includes("mua ho") ||
            lowerUser.includes("book ho") ||
            lowerUser.includes("dat giup") ||
            lowerUser.includes("dat cho toi") ||
            lowerUser.includes("dat luon") ||
            lowerUser.includes("mua luon") ||
            lowerUser.includes("mua ve ho");

          const isBookingIntent =
            isExplicitAutoBook ||
            lowerUser.includes("dat") ||
            lowerUser.includes("mua") ||
            lowerUser.includes("ve") ||
            lowerUser.includes("ghe") ||
            lowerUser.includes("book");

          const isShowtimesIntent =
            lowerUser.includes("lich chieu") ||
            lowerUser.includes("suat chieu") ||
            lowerUser.includes("may gio chieu") ||
            lowerUser.includes("xem lich") ||
            lowerUser.includes("bang lich");

          const isTicketsIntent =
            lowerUser.includes("vi ve") ||
            lowerUser.includes("ve cua toi") ||
            lowerUser.includes("ve da mua") ||
            lowerUser.includes("kiem tra ve") ||
            lowerUser.includes("ma ve");

          const isSearchIntent =
            lowerUser.includes("tim kiem") ||
            lowerUser.includes("search") ||
            lowerUser.includes("tim phim");

          if (isShowtimesIntent) {
            send({
              type: "web_action",
              action: {
                action: "scroll_to_showtimes",
                targetSection: "matrix-section",
                message: "🤖 AI Agent đang cuộn màn hình xuống Bảng Lịch Chiếu rạp Beta Xuân Thủy cho bạn...",
              },
            });
          } else if (isTicketsIntent) {
            send({
              type: "web_action",
              action: {
                action: "open_my_tickets",
                message: "🤖 AI Agent đang mở Ví Vé Điện Tử của bạn...",
              },
            });
          } else if (isSearchIntent) {
            send({
              type: "web_action",
              action: {
                action: "open_search",
                message: "🤖 AI Agent đang mở công cụ Tìm Kiếm Phim Thông Minh...",
              },
            });
          } else if (pick && isBookingIntent) {
            const seats = suggestSeats(userText, mood);
            const isCouple = seats.length > 0 && seats[0].startsWith("K");
            const isVip =
              seats.length > 0 &&
              (seats[0].startsWith("E") || seats[0].startsWith("F") || seats[0].startsWith("G"));
            const seatType = isCouple ? "couple" : isVip ? "vip" : "standard";
            const draft: BookingDraftPayload = {
              movieId: String(pick.movie.id),
              movieTitle: pick.movie.title,
              cinemaName: "CineMax Vincom Bà Triệu",
              showtimeLabel: "19:30 - Hôm nay",
              format: "2D",
              seatType,
              seatCount: seats.length,
              suggestedSeatIds: seats,
              autoExecute: isExplicitAutoBook,
            };
            send({
              type: "booking_draft",
              draft,
              payload: draft,
            });

            if (isExplicitAutoBook) {
              send({
                type: "web_action",
                action: {
                  action: "auto_book",
                  message: `🤖 CineBot AI đang đặt vé hộ bạn: Tự động mở màn hình đặt vé và chọn ghế [${seats.join(", ")}]...`,
                  data: draft,
                },
              });
            }
          } else if (mood.label) {
            let targetMoodId = "all";
            if (mood.label === "stressed" || mood.label === "chill") targetMoodId = "chill";
            else if (mood.label === "sad" || mood.label === "emotional") targetMoodId = "emotional";
            else if (mood.label === "excited") targetMoodId = "blockbuster";
            else if (mood.label === "romantic") targetMoodId = "emotional";

            send({
              type: "web_action",
              action: {
                action: "filter_mood",
                moodId: targetMoodId,
                message: `🤖 AI Agent đã kích hoạt bộ lọc tâm trạng "${mood.label}" trên trang chủ!`,
              },
            });
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
