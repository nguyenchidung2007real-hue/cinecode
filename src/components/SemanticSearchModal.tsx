"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Loader2,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import type { Movie } from "@/types";

/**
 * SemanticSearchModal - Spotlight AI Search (Ctrl/Cmd + K)
 *
 * Gọi GET /api/search?q=...&limit=8 (Goal 5) và hiển thị kết quả RAG.
 * Component tự lắng nghe Ctrl/Cmd+K: cha chỉ cần giữ state `open`.
 *
 * <SemanticSearchModal
 *   open={searchOpen}
 *   onOpenChange={setSearchOpen}
 *   onBookMovie={(movie) => openBooking(movie)}
 *   onSelectMovie={(movie) => openMovieDetail(movie)}   // tùy chọn
 * />
 */

export interface SemanticSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bấm "Đặt vé nhanh" hoặc Ctrl/Cmd+Enter. */
  onBookMovie: (movie: Movie) => void;
  /** Bấm vào card hoặc Enter. Mặc định dùng onBookMovie. */
  onSelectMovie?: (movie: Movie) => void;
}

// ---------------------------------------------------------------------------
// Hằng số
// ---------------------------------------------------------------------------

const SEARCH_LIMIT = 8;
const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

const PLACEHOLDERS = [
  "Phim về một AI học cách yêu thương…",
  "Tối nay buồn, cần một phim chữa lành…",
  "Kinh dị tâm lý, twist cực gắt…",
  "Phim hài nhẹ nhàng xem cùng cả nhà…",
  "Hẹn hò lần đầu nên xem phim gì?",
  "Hành động mãn nhãn, âm thanh IMAX…",
];

interface MoodPill {
  emoji: string;
  label: string;
  prompt: string;
  hue: number;
}

const MOODS: readonly MoodPill[] = [
  { emoji: "😢", label: "Buồn, cần chữa lành", prompt: "phim cảm động nhẹ nhàng giúp chữa lành khi buồn", hue: 210 },
  { emoji: "😂", label: "Cười thả ga", prompt: "phim hài vui nhộn để cười thả ga", hue: 48 },
  { emoji: "💕", label: "Lãng mạn cặp đôi", prompt: "phim tình cảm lãng mạn cho cặp đôi đi hẹn hò", hue: 335 },
  { emoji: "😱", label: "Rùng rợn", prompt: "phim kinh dị rùng rợn căng thẳng", hue: 0 },
  { emoji: "🚀", label: "Hành động mãn nhãn", prompt: "phim hành động mãn nhãn với hiệu ứng hoành tráng", hue: 24 },
  { emoji: "🧠", label: "Đánh đố, twist", prompt: "phim tâm lý đánh đố có cú twist bất ngờ", hue: 265 },
  { emoji: "👨👩👧", label: "Cả nhà cùng xem", prompt: "phim gia đình phù hợp mọi lứa tuổi", hue: 140 },
  { emoji: "😌", label: "Thư giãn", prompt: "phim nhẹ nhàng thư giãn cuối tuần", hue: 175 },
];

// ---------------------------------------------------------------------------
// Kiểu & hàm xử lý dữ liệu trả về từ /api/search
// ---------------------------------------------------------------------------

type SearchStatus = "idle" | "loading" | "success" | "error";

interface ResultItem {
  key: string;
  movie: Movie;
  rawScore: number | null;
  reason: string | null;
  matchPercent: number | null;
}

function readScore(hit: Record<string, unknown>): number | null {
  for (const key of ["score", "similarity", "finalScore", "matchScore", "relevance"]) {
    const value = hit[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function readReason(hit: Record<string, unknown>): string | null {
  for (const key of ["reason", "explanation", "why"]) {
    const value = hit[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  for (const key of ["matchedTerms", "matchedConcepts", "matches"]) {
    const value = hit[key];
    if (Array.isArray(value)) {
      const terms = value.filter((v): v is string => typeof v === "string").slice(0, 4);
      if (terms.length > 0) return `Khớp các ý: ${terms.join(", ")}`;
    }
  }
  return null;
}

/**
 * Đổi điểm số của hit thành % khớp. Nếu mọi điểm nằm trong [0,1] thì nhân 100,
 * ngược lại chuẩn hóa theo điểm cao nhất (dùng cho điểm BM25 không có trần).
 * Chỉnh công thức tại đây nếu muốn hiệu chỉnh lại.
 */
function toMatchPercents(scores: readonly (number | null)[]): (number | null)[] {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return scores.map(() => null);
  const max = Math.max(...valid);
  const inUnitRange = valid.every((s) => s >= 0 && s <= 1);
  return scores.map((s) => {
    if (s === null) return null;
    const pct = inUnitRange ? s * 100 : max > 0 ? (s / max) * 100 : 0;
    return Math.min(99, Math.max(1, Math.round(pct)));
  });
}

function parseHits(rawHits: readonly unknown[]): ResultItem[] {
  const parsed: Omit<ResultItem, "matchPercent">[] = [];

  rawHits.forEach((hit, index) => {
    if (!hit || typeof hit !== "object") return;
    const record = hit as Record<string, unknown>;
    const candidate = (record.movie && typeof record.movie === "object" ? record.movie : record) as Partial<Movie>;
    if (candidate.id === undefined || typeof candidate.title !== "string") return;

    parsed.push({
      key: `${String(candidate.id)}-${index}`,
      movie: candidate as Movie,
      rawScore: readScore(record),
      reason: readReason(record),
    });
  });

  const percents = toMatchPercents(parsed.map((p) => p.rawScore));
  return parsed.map((item, i) => ({ ...item, matchPercent: percents[i] }));
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}g ${m.toString().padStart(2, "0")}p` : `${m}p`;
}

function fallbackReason(movie: Movie): string {
  const genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 2).join(", ") : "";
  const overview = movie.overview ? truncate(movie.overview, 110) : "";
  const head = genres ? `Thể loại ${genres}. ` : "";
  return `${head}${overview}`.trim() || "Nội dung phù hợp với mô tả của bạn.";
}

// ---------------------------------------------------------------------------
// Component con
// ---------------------------------------------------------------------------

function PosterImage({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3a1019] to-[#14151B] p-2 text-center text-[10px] font-semibold leading-tight text-white/70">
        {title}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Poster ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

interface ResultCardProps {
  item: ResultItem;
  index: number;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  onBook: () => void;
}

function ResultCard({ item, index, active, onHover, onSelect, onBook }: ResultCardProps) {
  const { movie, matchPercent, reason } = item;
  const genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 3) : [];
  const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : "";
  const duration = formatDuration(movie.durationMinutes);
  const meta = [year, duration, movie.ageRating].filter(Boolean).join(" · ");
  const rating = Number.isFinite(movie.voteAverage) ? movie.voteAverage.toFixed(1) : null;

  return (
    <li
      id={`sp-opt-${index}`}
      role="option"
      aria-selected={active}
      data-index={index}
      data-active={active}
      onMouseMove={() => {
        if (!active) onHover();
      }}
      onClick={onSelect}
      className="sp-card relative flex cursor-pointer gap-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md"
    >
      {/* Poster 3D */}
      <div className="sp-stage shrink-0">
        <div className="sp-poster h-[132px] w-[88px] overflow-hidden rounded-lg border border-white/15 bg-[#14151B]">
          <PosterImage src={movie.posterPath} title={movie.title} />
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-base font-semibold text-white">{movie.title}</h3>
          {matchPercent !== null && (
            <span className="sp-match shrink-0 rounded-full border border-rose-400/30 bg-gradient-to-r from-fuchsia-500/25 to-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-100">
              ✨ {matchPercent}% Match
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
          {rating && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FFD700]/10 px-1.5 py-0.5 font-bold text-[#FFD700]">
              <Star className="h-3 w-3 fill-[#FFD700]" aria-hidden="true" />
              {rating}
              <span className="text-[9px] font-semibold tracking-wide text-[#FFD700]/70">IMDb</span>
            </span>
          )}
          {meta && <span>{meta}</span>}
        </div>

        {genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs leading-relaxed text-white/70">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#FF2E4C]" aria-hidden="true" />
          <span className="sp-clamp2">
            <span className="font-semibold text-white/85">AI chọn vì: </span>
            {reason ?? fallbackReason(movie)}
          </span>
        </div>

        <div className="mt-3 flex justify-end">
          <span className="sp-ticket-wrap">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onBook();
              }}
              className="sp-ticket"
              aria-label={`Đặt vé nhanh phim ${movie.title}`}
            >
              <span className="sp-ticket-stub" aria-hidden="true">
                🎬
              </span>
              <span className="sp-ticket-label">Đặt vé nhanh</span>
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}

function SkeletonCard() {
  return (
    <li className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-3" aria-hidden="true">
      <div className="sp-shimmer h-[132px] w-[88px] rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="sp-shimmer h-4 w-2/3 rounded" />
        <div className="sp-shimmer h-3 w-1/3 rounded" />
        <div className="sp-shimmer mt-2 h-10 w-full rounded-lg" />
        <div className="sp-shimmer ml-auto mt-auto h-8 w-32 rounded" />
      </div>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------

export default function SemanticSearchModal({
  open,
  onOpenChange,
  onBookMovie,
  onSelectMovie,
}: SemanticSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [mode, setMode] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchedRef = useRef("");

  // -- Gọi API ---------------------------------------------------------------
  const runSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastSearchedRef.current = q;
    setStatus("loading");

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${SEARCH_LIMIT}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: unknown = await response.json();
      const record = (data && typeof data === "object" ? data : {}) as {
        results?: unknown;
        mode?: unknown;
        fallbackReason?: unknown;
      };

      setResults(parseHits(Array.isArray(record.results) ? record.results : []));
      setMode(typeof record.mode === "string" ? record.mode : null);
      setFallbackNote(typeof record.fallbackReason === "string" ? record.fallbackReason : null);
      setActiveIndex(0);
      setStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[SemanticSearchModal] Tìm kiếm lỗi:", error);
      lastSearchedRef.current = "";
      setStatus("error");
    }
  }, []);

  // -- Chọn / đặt vé ---------------------------------------------------------
  const handleSelect = useCallback(
    (movie: Movie) => {
      onOpenChange(false);
      (onSelectMovie ?? onBookMovie)(movie);
    },
    [onOpenChange, onSelectMovie, onBookMovie]
  );

  const handleBook = useCallback(
    (movie: Movie) => {
      onOpenChange(false);
      onBookMovie(movie);
    },
    [onOpenChange, onBookMovie]
  );

  const applyPrompt = useCallback(
    (prompt: string) => {
      setQuery(prompt);
      void runSearch(prompt);
      inputRef.current?.focus();
    },
    [runSearch]
  );

  // -- Reset + khóa cuộn khi mở ---------------------------------------------
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      return;
    }
    setQuery("");
    setResults([]);
    setStatus("idle");
    setMode(null);
    setFallbackNote(null);
    setActiveIndex(0);
    lastSearchedRef.current = "";

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // -- Placeholder đổi động --------------------------------------------------
  useEffect(() => {
    if (!open || query) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [open, query]);

  // -- Tìm kiếm có debounce --------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const q = query.trim();

    if (q.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      lastSearchedRef.current = "";
      setResults([]);
      setStatus("idle");
      return;
    }
    if (q === lastSearchedRef.current) return;

    const timer = window.setTimeout(() => void runSearch(q), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, open, runSearch]);

  // -- Phím tắt --------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (results.length === 0) return;
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((i) => (i + step + results.length) % results.length);
        return;
      }

      if (event.key === "Enter") {
        if (event.isComposing) return; // đang gõ tiếng Việt (IME)
        const target = event.target as HTMLElement | null;
        if (target && target.tagName === "BUTTON") return; // để nút tự xử lý

        const q = query.trim();
        const item = results[activeIndex];
        const fresh = Boolean(item) && lastSearchedRef.current === q;

        if (event.ctrlKey || event.metaKey) {
          if (fresh && item) {
            event.preventDefault();
            handleBook(item.movie);
          }
          return;
        }

        event.preventDefault();
        if (fresh && item) handleSelect(item.movie);
        else if (q.length >= MIN_QUERY_LENGTH) void runSearch(q);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, query, results, activeIndex, onOpenChange, handleSelect, handleBook, runSearch]);

  // -- Cuộn phim đang chọn vào khung nhìn -----------------------------------
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, results]);

  if (!open) return null;

  // Viền neon đổi màu theo độ dài câu đang gõ.
  const hue = 350 + Math.min(query.length, 40) * 22;
  const panelStyle = { "--sp-hue": hue } as CSSProperties;
  const isLoading = status === "loading";
  const trimmed = query.trim();
  const isLexical = mode?.toLowerCase().includes("lex") ?? false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[9vh] sm:pt-[12vh]"
      role="presentation"
    >
      <style>{STYLES}</style>

      {/* Backdrop */}
      <div
        className="sp-backdrop absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm phim bằng AI"
        style={panelStyle}
        className="sp-panel relative w-full max-w-2xl"
      >
        <div className="sp-neon rounded-2xl p-[1.5px]" data-loading={isLoading}>
          <div className="overflow-hidden rounded-[15px] bg-[#0B0C10]/95 backdrop-blur-xl">
            {/* Ô nhập */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              {isLoading ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#FF2E4C]" aria-hidden="true" />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
              )}

              <div className="relative min-w-0 flex-1">
                {!query && (
                  <span
                    key={placeholderIndex}
                    className="sp-ph pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-lg font-light tracking-wide text-white/35 sm:text-xl"
                    aria-hidden="true"
                  >
                    {PLACEHOLDERS[placeholderIndex]}
                  </span>
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="text"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="sp-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={results.length > 0 ? `sp-opt-${activeIndex}` : undefined}
                  aria-label="Mô tả phim bạn muốn xem"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={300}
                  className="w-full bg-transparent text-lg font-light tracking-wide text-white caret-[#FF2E4C] outline-none sm:text-xl"
                />
              </div>

              <Kbd>Esc</Kbd>
            </div>

            {/* Thân */}
            {status === "idle" && (
              <div className="px-5 pb-5 pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Bạn đang cảm thấy thế nào?
                </p>
                <MoodPills onPick={applyPrompt} />
                <p className="mt-5 flex items-center gap-2 text-xs text-white/35">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF2E4C]" aria-hidden="true" />
                  Hãy mô tả nội dung, cảm xúc hay cốt truyện, AI sẽ hiểu ý bạn, không cần nhớ tên phim.
                </p>
              </div>
            )}

            {status === "loading" && results.length === 0 && (
              <ul className="space-y-2 p-3" aria-busy="true" aria-label="Đang tìm kiếm">
                <SkeletonCard />
                <SkeletonCard />
              </ul>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <AlertTriangle className="h-8 w-8 text-[#FF2E4C]" aria-hidden="true" />
                <p className="text-sm text-white/70">Chưa kết nối được tìm kiếm AI. Bạn kiểm tra mạng rồi thử lại nhé.</p>
                <button
                  type="button"
                  onClick={() => void runSearch(trimmed)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Thử lại
                </button>
              </div>
            )}

            {status === "success" && results.length === 0 && (
              <div className="px-5 pb-5 pt-8 text-center">
                <p className="text-sm text-white/70">Chưa tìm thấy phim khớp với mô tả này.</p>
                <p className="mb-4 mt-1 text-xs text-white/40">Thử mô tả khác hoặc chọn một tâm trạng:</p>
                <div className="flex justify-center">
                  <MoodPills onPick={applyPrompt} />
                </div>
              </div>
            )}

            {results.length > 0 && status !== "error" && (
              <>
                <p className="px-5 pt-3 text-[11px] text-white/40" aria-live="polite">
                  {isLoading ? "Đang cập nhật…" : `${results.length} phim phù hợp nhất với "${truncate(trimmed, 48)}"`}
                </p>
                <ul
                  ref={listRef}
                  id="sp-listbox"
                  role="listbox"
                  aria-label="Kết quả tìm kiếm"
                  className={`sp-scroll max-h-[52vh] space-y-2 overflow-y-auto p-3 transition-opacity ${
                    isLoading ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {results.map((item, index) => (
                    <ResultCard
                      key={item.key}
                      item={item}
                      index={index}
                      active={index === activeIndex}
                      onHover={() => setActiveIndex(index)}
                      onSelect={() => handleSelect(item.movie)}
                      onBook={() => handleBook(item.movie)}
                    />
                  ))}
                </ul>
              </>
            )}

            {/* Chân: phím tắt + chế độ */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-2.5 text-[11px] text-white/45">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Kbd>
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  </Kbd>
                  <Kbd>
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  </Kbd>
                  Di chuyển
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>
                    <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                  </Kbd>
                  Chọn
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>
                    <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                  </Kbd>
                  Đặt vé
                </span>
              </div>
              {mode && (
                <span
                  className="inline-flex items-center gap-1 text-white/50"
                  title={fallbackNote ?? undefined}
                >
                  <Sparkles className="h-3 w-3 text-[#FF2E4C]" aria-hidden="true" />
                  {isLexical ? "Từ khóa (dự phòng)" : "AI ngữ nghĩa"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoodPills({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.label}
          type="button"
          onClick={() => onPick(mood.prompt)}
          style={{ "--pill-h": mood.hue } as CSSProperties}
          className="sp-pill rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/80"
        >
          <span className="mr-1.5" aria-hidden="true">
            {mood.emoji}
          </span>
          {mood.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSS (đóng gói trong component để không phải sửa globals.css)
// ---------------------------------------------------------------------------

const STYLES = `
@property --sp-hue { syntax: "<number>"; inherits: true; initial-value: 350; }

.sp-panel { transition: --sp-hue 0.6s ease; animation: sp-pop 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.15) both; }
.sp-backdrop { animation: sp-fade 0.2s ease both; }

.sp-neon {
  background: linear-gradient(115deg,
    hsl(var(--sp-hue) 95% 55%),
    hsl(calc(var(--sp-hue) + 70) 95% 60%),
    hsl(calc(var(--sp-hue) + 150) 90% 55%),
    hsl(var(--sp-hue) 95% 55%));
  background-size: 200% 100%;
  animation: sp-flow 6s linear infinite;
  box-shadow:
    0 0 0 1px hsl(var(--sp-hue) 90% 60% / 0.25),
    0 0 70px -12px hsl(var(--sp-hue) 95% 55% / 0.55),
    0 30px 80px -20px rgba(0, 0, 0, 0.9);
}
.sp-neon[data-loading="true"] { animation-duration: 1.6s; }

.sp-ph { animation: sp-ph-in 0.5s ease both; max-width: 100%; }

.sp-pill { transition: box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease, color 0.2s ease; }
.sp-pill:hover, .sp-pill:focus-visible {
  outline: none;
  color: #fff;
  background: hsl(var(--pill-h) 90% 60% / 0.14);
  box-shadow: 0 0 0 1px hsl(var(--pill-h) 90% 65% / 0.7), 0 0 22px -2px hsl(var(--pill-h) 95% 60% / 0.55);
  transform: translateY(-1px);
}

.sp-card { transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
.sp-card[data-active="true"] {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 46, 76, 0.55);
  box-shadow: 0 0 0 1px rgba(255, 46, 76, 0.25), 0 10px 30px -12px rgba(229, 9, 20, 0.5);
  transform: translateX(2px);
}

.sp-stage { perspective: 700px; }
.sp-poster {
  transform: rotateY(-12deg) rotateX(2deg);
  transform-origin: center;
  box-shadow: 10px 14px 24px -6px rgba(0, 0, 0, 0.85), 0 0 0 rgba(229, 9, 20, 0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.sp-card[data-active="true"] .sp-poster {
  transform: rotateY(-4deg) rotateX(1deg) scale(1.05);
  box-shadow: 12px 18px 30px -6px rgba(0, 0, 0, 0.9), 0 0 26px rgba(229, 9, 20, 0.4);
}

.sp-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sp-match { box-shadow: 0 0 16px -4px rgba(255, 46, 76, 0.6); }

.sp-ticket-wrap {
  display: inline-block;
  filter: drop-shadow(0 6px 14px hsl(352 95% 45% / 0.45));
  transition: filter 0.25s ease, transform 0.2s ease;
}
.sp-ticket-wrap:hover { filter: drop-shadow(0 8px 22px hsl(352 100% 55% / 0.8)); transform: translateY(-1px); }
.sp-ticket-wrap:active { transform: translateY(0) scale(0.98); }
.sp-ticket {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  border: 0;
  cursor: pointer;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #E50914 0%, #FF2E4C 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  -webkit-mask:
    radial-gradient(circle at 0 50%, #0000 6px, #000 6.5px) left / 51% 100% no-repeat,
    radial-gradient(circle at 100% 50%, #0000 6px, #000 6.5px) right / 51% 100% no-repeat;
  mask:
    radial-gradient(circle at 0 50%, #0000 6px, #000 6.5px) left / 51% 100% no-repeat,
    radial-gradient(circle at 100% 50%, #0000 6px, #000 6.5px) right / 51% 100% no-repeat;
}
.sp-ticket:focus-visible { outline: 2px solid #FFD700; outline-offset: 2px; }
.sp-ticket-stub { display: flex; align-items: center; padding: 8px 10px 8px 16px; font-size: 15px; }
.sp-ticket-label {
  display: flex;
  align-items: center;
  padding: 8px 18px 8px 12px;
  border-left: 2px dashed rgba(255, 255, 255, 0.5);
}
.sp-ticket::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: -60%;
  width: 40%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}
.sp-ticket:hover::after { left: 130%; }

.sp-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: sp-shimmer 1.4s linear infinite;
}

.sp-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }

@keyframes sp-flow { to { background-position: 200% 0; } }
@keyframes sp-pop { from { opacity: 0; transform: translateY(-10px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes sp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sp-ph-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes sp-shimmer { to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .sp-neon, .sp-panel, .sp-backdrop, .sp-ph, .sp-shimmer { animation: none !important; }
  .sp-pill, .sp-card, .sp-poster, .sp-ticket-wrap { transition: none !important; }
}
`;
