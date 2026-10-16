"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Movie } from "@/types";
import {
  X,
  Star,
  Clock,
  Calendar,
  Ticket,
  User,
  Film,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBookTicket: (movie: Movie) => void;
}

interface ReviewItem {
  id: string;
  movieId: string;
  movieTitle: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  content: string;
  isVerifiedBuyer: boolean;
  likesCount: number;
  status: string;
  createdAt: string;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  onBookTicket,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorPhone, setAuthorPhone] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load reviews when movie changes or tab becomes reviews
  const fetchReviews = useCallback(async () => {
    if (!movie) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(
        `/api/reviews?movieId=${encodeURIComponent(String(movie.id))}&movieTitle=${encodeURIComponent(movie.title)}`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải bình luận:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [movie]);

  useEffect(() => {
    if (movie) {
      setActiveTab("info");
      setSubmitSuccess(null);
      setSubmitError(null);
      fetchReviews();
    }
  }, [movie, fetchReviews]);

  if (!movie) return null;

  // Xử lý trailer YouTube chuẩn xác & an toàn
  const rawTrailerId = movie.trailerYoutubeId?.trim();
  const hasSpecificTrailer = Boolean(rawTrailerId && rawTrailerId.length >= 8);
  const activeVideoId = hasSpecificTrailer ? rawTrailerId : "Way9Dexny3w";
  const iframeSrc = `https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`;

  const youtubeExternalUrl = hasSpecificTrailer
    ? `https://www.youtube.com/watch?v=${rawTrailerId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer chính thức")}`;

  // Thả tim đánh giá
  const handleLikeReview = async (id: string) => {
    if (likedReviews[id]) return;
    setLikedReviews((prev) => ({ ...prev, [id]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likesCount: r.likesCount + 1 } : r))
    );

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", id }),
      });
    } catch (err) {
      console.error("Lỗi like review:", err);
    }
  };

  // Gửi đánh giá mới
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);
    setSubmitError(null);

    if (!authorName.trim()) {
      setSubmitError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (authorPhone.trim().length < 9) {
      setSubmitError("Vui lòng nhập số điện thoại hợp lệ (từ 10 chữ số).");
      return;
    }
    if (reviewContent.trim().length < 5) {
      setSubmitError("Nội dung đánh giá tối thiểu 5 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: String(movie.id),
          movieTitle: movie.title,
          customerName: authorName.trim(),
          customerPhone: authorPhone.trim(),
          rating,
          content: reviewContent.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Không thể gửi đánh giá.");
      } else {
        setSubmitSuccess(
          data.message || "Cảm ơn bạn! Đánh giá đã được ghi nhận."
        );
        if (data.review) {
          setReviews((prev) => [data.review, ...prev]);
        }
        setReviewContent("");
      }
    } catch {
      setSubmitError("Lỗi kết nối máy chủ, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#fdfcf0] border border-[#e5e0d8] rounded-2xl overflow-hidden shadow-2xl my-auto text-[#1c1c1c]">
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#e71a0f] text-white flex items-center justify-center transition-colors border border-white/20 shadow-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung nhúng Trailer YouTube chuẩn */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={iframeSrc}
            title={`${movie.title} Trailer`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <a
            href={youtubeExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-[#e71a0f] text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-colors border border-white/20"
          >
            <span>Mở YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Header phim & Nút Đặt Vé Nhanh */}
        <div className="p-5 sm:p-6 pb-3 border-b border-[#e5e0d8] bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-[#e71a0f] text-white">
                  {movie.ageRating}
                </span>
                <span className="text-xs text-neutral-600 font-medium">
                  {movie.genres.join(" • ")}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {movie.voteAverage}/10 ({formatNumber(movie.voteCount)} vote)
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
                {movie.title}
              </h2>
              {movie.originalTitle && (
                <p className="text-sm text-neutral-500 italic mt-0.5 font-medium">
                  {movie.originalTitle}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onBookTicket(movie);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#e71a0f]/30 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>MUA VÉ NGAY</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 mt-5 border-b border-neutral-200 -mb-3">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === "info"
                  ? "border-[#e71a0f] text-[#e71a0f]"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Nội Dung & Trailer</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === "reviews"
                  ? "border-[#e71a0f] text-[#e71a0f]"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Đánh Giá & Bình Luận ({reviews.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Nội dung phim chi tiết */}
        {activeTab === "info" && (
          <div className="p-5 sm:p-7 space-y-5 bg-[#fdfcf0]">
            {/* Meta info bar */}
            <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-neutral-600 pb-3 border-b border-[#e5e0d8]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#e71a0f]" />
                <span className="font-semibold text-neutral-900">{movie.durationMinutes} phút</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#e71a0f]" />
                <span>Khởi chiếu: <strong className="text-neutral-900">{movie.releaseDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Bản quyền rạp chiếu CineMax</span>
              </div>
            </div>

            {/* Tóm tắt cốt truyện */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
                Tóm Tắt Nội Dung Phim
              </h4>
              <p className="text-sm text-neutral-700 leading-relaxed font-normal">
                {movie.overview}
              </p>
            </div>

            {/* Đạo diễn & Dàn diễn viên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2 bg-white p-4 rounded-xl border border-[#e5e0d8]">
              <div>
                <span className="text-neutral-400 font-bold block mb-1 uppercase text-[11px]">Đạo diễn:</span>
                <span className="font-bold text-neutral-900">{movie.director}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-bold block mb-1 uppercase text-[11px]">Diễn viên chính:</span>
                <span className="font-semibold text-neutral-800">{movie.cast.join(", ")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Đánh Giá & Bình Luận */}
        {activeTab === "reviews" && (
          <div className="p-5 sm:p-7 space-y-6 max-h-[500px] overflow-y-auto bg-[#fdfcf0]">
            {/* Form viết đánh giá mới */}
            <div className="p-5 rounded-2xl bg-white border border-[#e5e0d8] shadow-sm">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Đánh Giá Của Bạn Về Bộ Phim</span>
              </h3>

              {submitSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* Chọn số sao */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-600 font-bold">Số sao chấm điểm:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isFilled = (hoverRating ?? rating) >= s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(s)}
                          className="p-1 text-neutral-300 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              isFilled ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-amber-600">
                    {rating === 5
                      ? "Tuyệt đỉnh (5/5)"
                      : rating === 4
                      ? "Rất hay (4/5)"
                      : rating === 3
                      ? "Tạm ổn (3/5)"
                      : rating === 2
                      ? "Trung bình (2/5)"
                      : "Không hay (1/5)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn *"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e71a0f] focus:ring-1 focus:ring-[#e71a0f]"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Số điện thoại (dùng để xác nhận vé) *"
                      value={authorPhone}
                      onChange={(e) => setAuthorPhone(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e71a0f] focus:ring-1 focus:ring-[#e71a0f]"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Chia sẻ cảm xúc, diễn xuất, kỹ xảo hay điều bạn tâm đắc nhất sau khi xem phim..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e71a0f] focus:ring-1 focus:ring-[#e71a0f] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-neutral-400">
                    Khán giả từng mua vé tại rạp sẽ nhận huy hiệu tick xanh xác thực.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#e71a0f]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Đánh Giá</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Danh sách bình luận từ khán giả */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                <span>Khán Giả Nhận Xét ({reviews.length})</span>
                <span className="text-[11px] text-neutral-400 font-normal">Sắp xếp theo mới nhất</span>
              </h4>

              {isLoadingReviews ? (
                <div className="py-10 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#e71a0f]" />
                  <span>Đang tải bình luận khán giả...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center bg-white rounded-2xl border border-[#e5e0d8] p-6 text-neutral-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-xs font-semibold text-neutral-600">Chưa có bình luận nào cho bộ phim này.</p>
                  <p className="text-[11px]">Hãy là người đầu tiên chia sẻ cảm nhận của bạn sau khi xem phim!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => {
                    const isLiked = Boolean(likedReviews[r.id]);
                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-white border border-[#e5e0d8] shadow-sm hover:border-[#e71a0f]/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1c1c1c] text-[#fdfcf0] font-black text-xs flex items-center justify-center flex-shrink-0">
                              {r.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-neutral-900">
                                  {r.customerName}
                                </span>
                                {r.isVerifiedBuyer && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Đã xem tại rạp
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                {new Date(r.createdAt).toLocaleDateString("vi-VN", {
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Sao đánh giá */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-700 leading-relaxed font-normal pl-10">
                          {r.content}
                        </p>

                        <div className="mt-3 pl-10 flex items-center justify-between text-[11px] text-neutral-400">
                          <button
                            type="button"
                            onClick={() => handleLikeReview(r.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isLiked
                                ? "bg-rose-50 text-[#e71a0f]"
                                : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900"
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-[#e71a0f]" : ""}`} />
                            <span>Hữu ích ({r.likesCount})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
