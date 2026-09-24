import type { Movie } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type MoodType =
  | "stressed"
  | "sad"
  | "thrill_seeking"
  | "excited"
  | "romantic"
  | "neutral";

type ActiveMood = Exclude<MoodType, "neutral">;

export interface MoodAnalysisResult {
  mood: MoodType;
  moodLabel: string;
  suggestedMovieId: string | number;
  reason: string;
  /** 0 → 1. Dưới 0.5 nên coi là "chưa chắc chắn". */
  confidence: number;
  /** Các từ khóa (đã bỏ dấu) làm căn cứ phát hiện tâm trạng. */
  matchedKeywords: string[];
  /** Gợi ý số người đi xem (vd: romantic → 2). */
  preferredPartySize?: number;
  /** Gợi ý khung giờ chiếu (vd: romantic → suất tối). */
  preferredTimeSlot?: "evening";
}

interface Keyword {
  readonly phrase: string;
  readonly weight: number;
}

interface MoodProfile {
  readonly label: string;
  readonly keywords: readonly Keyword[];
  /** Cụm từ (đã bỏ dấu) xuất hiện trong tên phim → ưu tiên cao nhất. */
  readonly preferredTitles: readonly string[];
  /** Thể loại (đã bỏ dấu) phù hợp tâm trạng. */
  readonly preferredGenres: readonly string[];
  /** Lý do gợi ý, KHÔNG chứa tên phim để thẻ UI hiển thị gọn. */
  readonly reason: string;
  readonly partySize?: number;
  readonly timeSlot?: "evening";
}

/* -------------------------------------------------------------------------- */
/*  Text helpers (được dùng lại ở API route)                                  */
/* -------------------------------------------------------------------------- */

/** Chữ thường, bỏ dấu tiếng Việt, bỏ ký tự đặc biệt, gọn khoảng trắng. */
export function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kiểm tra `phrase` xuất hiện như một cụm từ nguyên vẹn trong `text`.
 * Cả hai phải đã qua normalizeVietnamese. Tránh lỗi kiểu "ghe" ⊂ "nghe".
 */
export function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

/* -------------------------------------------------------------------------- */
/*  Cấu hình từ khóa & hồ sơ tâm trạng                                        */
/* -------------------------------------------------------------------------- */

const NEGATIONS: ReadonlySet<string> = new Set(["khong", "chua", "dung"]);

/** "buồn ngủ", "buồn cười" không phải buồn thật sự. */
const EXCLUDE_FOLLOWING: Readonly<Record<string, readonly string[]>> = {
  buon: ["ngu", "cuoi", "non", "tieu"],
};

function kw(weight: number, phrases: readonly string[]): Keyword[] {
  return phrases.map((phrase) => ({ phrase, weight }));
}

const MOOD_ORDER: readonly ActiveMood[] = [
  "stressed",
  "sad",
  "thrill_seeking",
  "excited",
  "romantic",
];

const MOOD_PROFILES: Readonly<Record<ActiveMood, MoodProfile>> = {
  stressed: {
    label: "Áp lực / Mệt mỏi",
    keywords: [
      ...kw(2, [
        "stress",
        "stressed",
        "ap luc",
        "cang thang",
        "met moi",
        "kiet suc",
        "deadline",
        "qua tai",
        "burnout",
        "met qua",
        "xa stress",
      ]),
      ...kw(1, ["met", "giai toa", "thu gian", "dau dau", "nhieu viec"]),
    ],
    preferredTitles: ["inside out", "manh ghep cam xuc"],
    preferredGenres: ["hai", "hai huoc", "hoat hinh", "gia dinh", "comedy", "animation"],
    reason:
      "Bạn đang cần xả hơi. Một bộ phim hài hước, nhẹ nhàng và chữa lành sẽ giúp bạn gác deadline sang một bên và được cười thật thoải mái.",
  },
  sad: {
    label: "Buồn / Cô đơn",
    keywords: [
      ...kw(3, ["that tinh", "chia tay", "tram cam"]),
      ...kw(2, [
        "buon",
        "co don",
        "co doc",
        "khoc",
        "tui than",
        "that vong",
        "nho nguoi cu",
        "muon khoc",
      ]),
      ...kw(1, ["nuoc mat", "cam dong", "tram lang", "lac long", "trong trong"]),
    ],
    preferredTitles: ["inside out", "coco", "wall e", "soul", "luca", "elemental"],
    preferredGenres: ["hoat hinh", "chinh kich", "tam ly", "gia dinh", "cam dong", "drama", "animation"],
    reason:
      "Những lúc buồn, một câu chuyện ấm áp và cảm động sẽ cho bạn được khóc, được cười và thấy lòng nhẹ đi rất nhiều.",
  },
  thrill_seeking: {
    label: "Thích cảm giác mạnh",
    keywords: [
      ...kw(3, ["cam giac manh", "kinh di", "phim ma", "ron gai oc"]),
      ...kw(2, [
        "hoi hop",
        "giat gan",
        "ly ky",
        "so hai",
        "rung ron",
        "ron nguoi",
        "thrill",
        "horror",
        "gay can",
        "hu hon",
        "ma quy",
        "tam linh",
      ]),
      ...kw(1, ["suspense", "scary", "kich thich"]),
    ],
    preferredTitles: ["quat mo trung ma", "exhuma"],
    preferredGenres: ["kinh di", "giat gan", "ly ky", "bi an", "horror", "thriller"],
    reason:
      "Bạn đang khát cảm giác mạnh. Bộ phim rùng rợn, căng thẳng từng phút này sẽ khiến tim bạn đập thình thịch, nhất là với âm thanh vòm trong phòng chiếu.",
  },
  excited: {
    label: "Hào hứng / Bùng nổ",
    keywords: [
      ...kw(3, ["chay het minh", "chay qua", "chay thoi", "chay nao", "chay bong", "bung no"]),
      ...kw(2, [
        "hao hung",
        "phan khich",
        "hung phan",
        "cuong nhiet",
        "bom tan",
        "hanh dong",
        "sci fi",
        "khoa hoc vien tuong",
        "sieu anh hung",
        "no tung",
      ]),
      ...kw(1, ["phieu luu", "vu tru", "sung suong", "hoanh trang"]),
    ],
    preferredTitles: ["dune", "deadpool", "mad max", "furiosa", "godzilla"],
    preferredGenres: [
      "hanh dong",
      "khoa hoc vien tuong",
      "sci fi",
      "phieu luu",
      "sieu anh hung",
      "action",
      "adventure",
      "science fiction",
    ],
    reason:
      "Năng lượng của bạn đang bùng nổ. Bom tấn hành động với hiệu ứng mãn nhãn là cách hoàn hảo để xả hết adrenaline trên màn ảnh lớn.",
  },
  romantic: {
    label: "Lãng mạn / Hẹn hò",
    keywords: [
      ...kw(4, ["di voi nguoi yeu", "di cung nguoi yeu"]),
      ...kw(3, ["hen ho", "cau hon", "valentine"]),
      ...kw(2, ["lang man", "cap doi", "vo chong", "ban gai", "ban trai", "ky niem yeu"]),
      ...kw(1, ["nguoi yeu", "tinh yeu", "date"]),
    ],
    preferredTitles: [],
    preferredGenres: ["tinh cam", "lang man", "romance"],
    reason:
      "Để buổi hẹn hò thêm đáng nhớ, hãy chọn một bộ phim tình cảm, lãng mạn và ưu tiên suất chiếu tối để có không khí trọn vẹn bên người ấy.",
    partySize: 2,
    timeSlot: "evening",
  },
};

const NEUTRAL_LABEL = "Chưa rõ tâm trạng";

/* -------------------------------------------------------------------------- */
/*  Chấm điểm tâm trạng                                                       */
/* -------------------------------------------------------------------------- */

function hasValidOccurrence(paddedText: string, phrase: string): boolean {
  const needle = ` ${phrase} `;
  let index = paddedText.indexOf(needle);

  while (index !== -1) {
    const before = paddedText
      .slice(0, index)
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(-2);
    const after = paddedText.slice(index + needle.length).trim().split(" ")[0] ?? "";

    const negated = before.some((token) => NEGATIONS.has(token));
    const excluded = EXCLUDE_FOLLOWING[phrase]?.includes(after) ?? false;

    if (!negated && !excluded) return true;
    index = paddedText.indexOf(needle, index + 1);
  }

  return false;
}

function scoreMood(
  paddedText: string,
  keywords: readonly Keyword[],
): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];

  for (const { phrase, weight } of keywords) {
    if (hasValidOccurrence(paddedText, phrase)) {
      score += weight;
      matched.push(phrase);
    }
  }

  return { score, matched };
}

/* -------------------------------------------------------------------------- */
/*  Chọn phim                                                                 */
/* -------------------------------------------------------------------------- */

/** Chỉ gợi ý phim có thể đặt vé; nếu không có thì dùng toàn bộ danh sách. */
function getPlayableMovies(movies: readonly Movie[]): Movie[] {
  const playable = movies.filter((movie) => movie.status !== "upcoming");
  return playable.length > 0 ? playable : [...movies];
}

function matchesAnyGenre(genre: string, preferred: readonly string[]): boolean {
  const normalized = normalizeVietnamese(genre);
  return preferred.some(
    (item) => containsPhrase(normalized, item) || containsPhrase(item, normalized),
  );
}

function pickTopRated(candidates: readonly Movie[]): Movie {
  let best: Movie | null = null;
  for (const movie of candidates) {
    if (best === null || movie.voteAverage > best.voteAverage) best = movie;
  }
  if (best === null) throw new Error("pickTopRated: danh sách phim rỗng");
  return best;
}

function pickMovieForMood(
  profile: MoodProfile,
  candidates: readonly Movie[],
): { movie: Movie; fit: boolean } {
  let best: Movie | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestFit = false;

  for (const movie of candidates) {
    const title = normalizeVietnamese(movie.title);
    const original = movie.originalTitle ? normalizeVietnamese(movie.originalTitle) : "";

    const titleHit = profile.preferredTitles.some(
      (item) => containsPhrase(title, item) || (original !== "" && containsPhrase(original, item)),
    );
    const genreHits = movie.genres.filter((genre) =>
      matchesAnyGenre(genre, profile.preferredGenres),
    ).length;

    const score =
      (titleHit ? 100 : 0) +
      genreHits * 10 +
      (movie.status === "now_playing" ? 3 : 0) +
      movie.voteAverage * 0.5;

    if (score > bestScore) {
      best = movie;
      bestScore = score;
      bestFit = titleHit || genreHits > 0;
    }
  }

  if (best === null) throw new Error("pickMovieForMood: danh sách phim rỗng");
  return { movie: best, fit: bestFit };
}

/* -------------------------------------------------------------------------- */
/*  API chính                                                                 */
/* -------------------------------------------------------------------------- */

export function detectMoodAndMovie(userMessage: string, movies: Movie[]): MoodAnalysisResult {
  if (movies.length === 0) {
    return {
      mood: "neutral",
      moodLabel: NEUTRAL_LABEL,
      suggestedMovieId: "",
      reason: "Hiện chưa có phim để gợi ý.",
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const paddedText = ` ${normalizeVietnamese(userMessage)} `;
  const candidates = getPlayableMovies(movies);

  let bestMood: ActiveMood | null = null;
  let bestScore = 0;
  let secondScore = 0;
  let bestMatched: string[] = [];

  for (const mood of MOOD_ORDER) {
    const { score, matched } = scoreMood(paddedText, MOOD_PROFILES[mood].keywords);
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestMood = mood;
      bestMatched = matched;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (bestMood === null) {
    const top = pickTopRated(candidates);
    return {
      mood: "neutral",
      moodLabel: NEUTRAL_LABEL,
      suggestedMovieId: top.id,
      reason: `Phim đang chiếu được khán giả đánh giá cao nhất (${top.voteAverage.toFixed(1)}/10).`,
      confidence: 0.3,
      matchedKeywords: [],
    };
  }

  const profile = MOOD_PROFILES[bestMood];
  const { movie, fit } = pickMovieForMood(profile, candidates);

  let confidence = 0.45 + 0.15 * bestScore;
  if (secondScore === bestScore) confidence -= 0.1; // hai tâm trạng ngang nhau → kém chắc chắn
  if (!fit) confidence *= 0.75;
  confidence = Math.round(Math.min(0.95, Math.max(0.05, confidence)) * 100) / 100;

  const reason = fit
    ? profile.reason
    : `Hiện chưa có phim thật sự khớp tâm trạng này, nên mình chọn phim đang chiếu được đánh giá cao nhất (${movie.voteAverage.toFixed(1)}/10).`;

  const result: MoodAnalysisResult = {
    mood: bestMood,
    moodLabel: profile.label,
    suggestedMovieId: movie.id,
    reason,
    confidence,
    matchedKeywords: bestMatched,
  };
  if (profile.partySize !== undefined) result.preferredPartySize = profile.partySize;
  if (profile.timeSlot !== undefined) result.preferredTimeSlot = profile.timeSlot;

  return result;
}
