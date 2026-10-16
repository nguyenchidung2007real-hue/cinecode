"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Headphones, User, Trash2, Film, Armchair, Ticket, ArrowRight, Compass, MessageSquare } from "lucide-react";
import { ChatMessage, Movie } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";
import { useBookingStore } from "@/store/useBookingStore";

interface AiChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectMovieForBooking?: (movie: Movie, suggestedSeats?: string[], showtimeId?: string) => void;
  movies?: Movie[];
  onOpenMyTickets?: () => void;
  onOpenSearch?: () => void;
  onSelectMood?: (moodId: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Xin chào quý khách! Tôi là **CineMax Concierge** 🎬.\nTôi có thể hỗ trợ quý khách **tra cứu lịch chiếu, tư vấn chọn phim** và **đặt vé nhanh vào thẳng sơ đồ ghế**. Quý khách có thể nhắn: *\"Đặt giúp 2 vé phim Dune tối nay\"*, *\"Xem lịch chiếu rạp CineMax\"*, hoặc *\"Mở ví vé của tôi\"*!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const SUGGESTIONS = [
  "🎟️ Đặt giúp tôi 2 vé phim Dune tối nay",
  "📅 Xem lịch chiếu rạp CineMax hôm nay",
  "🎫 Mở ví vé của tôi",
  "🔥 Gợi ý phim hành động bom tấn cuối tuần",
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  isOpen,
  onToggle,
  onSelectMovieForBooking,
  movies = MOCK_MOVIES,
  onOpenMyTickets,
  onOpenSearch,
  onSelectMood,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeActionBanner, setActiveActionBanner] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Bộ điều khiển Web-Action: Tự động hỗ trợ chuyển màn hình đặt vé
  const executeWebAction = (actionObj: any) => {
    const actType = actionObj.action;
    const bannerMsg = actionObj.message || "🎬 Đang chuẩn bị màn hình đặt vé...";
    setActiveActionBanner(bannerMsg);

    if (actType === "auto_book") {
      const draft = actionObj.data || actionObj.draft;
      if (draft) {
        useBookingStore.getState().prefillFromAiTool({
          movieId: draft.movieId || "dune-2",
          movieTitle: draft.movieTitle,
          cinemaName: draft.cinemaName || "CineMax Vincom Bà Triệu",
          showtimeId: draft.showtimeId || "st-cinemax-today-1",
          showtimeLabel: draft.showtimeLabel || "19:00",
          format: draft.format || "2D",
          suggestedSeats: draft.suggestedSeatIds.map((id: string) => ({
            id,
            type: draft.seatType,
          })),
          suggestedCombos: draft.comboName
            ? [{ id: "cinema-combo", name: draft.comboName, quantity: draft.comboQuantity || 1 }]
            : [],
        });

        const foundMovie =
          movies.find((m) => m.title.toLowerCase().includes(draft.movieTitle.toLowerCase())) ||
          movies[0];

        setTimeout(() => {
          if (onSelectMovieForBooking && foundMovie) {
            onSelectMovieForBooking(foundMovie, draft.suggestedSeatIds, draft.showtimeId);
          }
          setActiveActionBanner(null);
          onToggle(); // Tự động đóng chat để người dùng nhìn thấy BookingModal mở ra
        }, 800);
      }
    } else if (actType === "scroll_to_showtimes") {
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        setTimeout(() => {
          document.getElementById("matrix-section")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }, 700);
    } else if (actType === "scroll_to_movies") {
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        setTimeout(() => {
          document.getElementById("commercial-tabs")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }, 700);
    } else if (actType === "open_my_tickets") {
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        if (onOpenMyTickets) onOpenMyTickets();
      }, 700);
    } else if (actType === "open_search") {
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        if (onOpenSearch) onOpenSearch();
      }, 700);
    } else if (actType === "filter_mood") {
      const moodId = actionObj.data?.moodId || actionObj.moodId;
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        if (onSelectMood && moodId) {
          onSelectMood(moodId);
        }
      }, 700);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsStreaming(true);

    const botMsgId = (Date.now() + 1).toString();
    const botMsgPlaceholder: ChatMessage = {
      id: botMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, botMsgPlaceholder]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Phản hồi mạng không hợp lệ");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          let cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine.startsWith("data:")) {
            cleanLine = cleanLine.slice(5).trim();
          }
          if (!cleanLine || cleanLine === "[DONE]") continue;

          try {
            const data = JSON.parse(cleanLine);
            const contentPiece = data.content ?? data.text;

            if (contentPiece && (data.type === "text" || !data.type)) {
              accumulated += contentPiece;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, content: accumulated } : msg
                )
              );
            } else if ((data.type === "recommendation" || data.recommendation) && (data.movie || data.recommendation)) {
              const r = data.recommendation || data;
              const movieObj = r.movie || r;
              const rec = {
                movieId: r.movieId || movieObj.id,
                movieTitle: r.movieTitle || movieObj.title,
                posterPath: r.posterPath || movieObj.posterPath,
                reason: r.reason || movieObj.overview,
                suggestedSeats: r.suggestedSeats || ["E5", "E6"],
              };
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, recommendation: rec } : msg
                )
              );
            } else if ((data.type === "booking_draft" || data.draft) && (data.draft || data.payload)) {
              const draft = data.draft || data.payload;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, bookingDraft: draft } : msg
                )
              );
            } else if ((data.type === "action" || data.type === "web_action") && (data.action || data.payload)) {
              const act = data.action || data.payload;
              executeWebAction({
                action: act.action || act,
                data: act.data || data.data,
                message: act.message || `🎬 Đang mở màn hình đặt vé phim "${act.data?.movieTitle || 'Dune'}" và chọn sẵn ghế đẹp...`,
              });
            }
          } catch {
            // Bỏ qua dòng không phải JSON chuẩn
          }
        }
      }
    } catch (err) {
      console.error("Lỗi gọi trợ lý hỗ trợ:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, content: "Hệ thống hỗ trợ trực tuyến đang bận, quý khách vui lòng thử lại sau giây lát!" }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    setActiveActionBanner(null);
    useBookingStore.getState().resetBooking();
  };

  return (
    <>
      {/* Nút bấm nổi hỗ trợ trực tuyến CineMax Concierge ở góc dưới */}
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Hỗ trợ trực tuyến CineMax"
          title="Hỗ trợ đặt vé 24/7"
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 h-13 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white shadow-2xl shadow-red-600/50 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
        >
          <Headphones className="w-5 h-5 text-white" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider hidden sm:inline">
            Hỗ Trợ 24/7
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Khung cửa sổ CineMax Concierge (Dark Mode Cinematic) */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[430px] h-[580px] max-h-[85vh] bg-[#161922] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-white">
          {/* Header Cửa sổ Hỗ Trợ */}
          <div className="px-4 py-3 bg-[#12141C] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#E50914] to-amber-600 flex items-center justify-center text-white shadow-md">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-sm text-white tracking-wide uppercase">CineMax Concierge</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                    24/7
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Trực tuyến • Hỗ trợ đặt vé & lịch chiếu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Xóa lịch sử trao đổi"
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                title="Đóng cửa sổ"
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner thông báo khi đang thực hiện thao tác */}
          {activeActionBanner && (
            <div className="px-3.5 py-2 bg-[#E50914]/20 border-b border-[#E50914]/30 text-white text-xs font-bold flex items-center gap-2 animate-pulse">
              <Film className="w-4 h-4 text-[#E50914] shrink-0" />
              <span className="truncate">{activeActionBanner}</span>
            </div>
          )}

          {/* Danh sách tin nhắn */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex gap-2.5 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#12141C] text-[#E50914] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#E50914] text-white font-medium rounded-tr-none"
                        : "bg-[#1E222D] border border-white/10 text-neutral-100 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content || "..."}</p>
                    <span className="block text-[9px] text-white/40 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* THẺ GỢI Ý ĐẶT VÉ NHANH (QUICK-BOOKING CARD) */}
                {msg.role === "assistant" && msg.recommendation && (
                  <div className="mt-2.5 ml-9 max-w-[85%] p-3 rounded-xl bg-[#12141C] border border-white/10 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-2.5">
                      {msg.recommendation.posterPath ? (
                        <img
                          src={msg.recommendation.posterPath}
                          alt={msg.recommendation.movieTitle}
                          className="w-12 h-16 object-cover rounded-lg shadow-sm border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-[#161922] rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                          <Film className="w-5 h-5 text-[#E50914]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[9px] font-heading font-bold px-1.5 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 uppercase">
                          GỢI Ý PHÙ HỢP
                        </span>
                        <h5 className="font-heading font-bold text-white text-xs mt-1 truncate uppercase">
                          {msg.recommendation.movieTitle}
                        </h5>
                        <p className="text-[10px] text-[#9CA3AF] line-clamp-2 mt-0.5 leading-relaxed">
                          {msg.recommendation.reason}
                        </p>
                      </div>
                    </div>

                    {/* Vị trí ghế gợi ý */}
                    {msg.recommendation.suggestedSeats && msg.recommendation.suggestedSeats.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-lg bg-[#161922] border border-white/10">
                        <span className="text-[#9CA3AF] flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-[#E50914]" /> Ghế đẹp gợi ý:
                        </span>
                        <span className="font-mono font-bold text-[#F5C518] tracking-wider">
                          {msg.recommendation.suggestedSeats.join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Nút Đặt Vé Nhanh */}
                    <button
                      onClick={() => {
                        const targetId = msg.recommendation?.movieId;
                        const foundMovie = movies.find(
                          (m) => String(m.id) === String(targetId)
                        );
                        if (foundMovie && onSelectMovieForBooking) {
                          onSelectMovieForBooking(foundMovie, msg.recommendation?.suggestedSeats);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-heading font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Đặt vé ngay
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}

                {/* THẺ ĐỀ XUẤT ĐẶT VÉ TỰ ĐỘNG */}
                {msg.role === "assistant" && msg.bookingDraft && (
                  <div className="mt-2.5 ml-9 max-w-[85%] p-3.5 rounded-xl bg-[#12141C] border border-[#E50914]/30 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#E50914] font-bold">
                      <Film className="w-3 h-3" />
                      <span>Thông tin đặt vé đề xuất</span>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-sm text-white uppercase">{msg.bookingDraft.movieTitle}</h4>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        📍 {msg.bookingDraft.cinemaName || "CineMax Vincom Bà Triệu"} • 🕒 {msg.bookingDraft.showtimeLabel || "19:00"} ({msg.bookingDraft.format || "2D"})
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-[#161922] border border-white/10 text-white font-medium">
                        Ghế ({msg.bookingDraft.seatType}): {msg.bookingDraft.suggestedSeatIds.join(", ")}
                      </span>
                      {msg.bookingDraft.comboName && (
                        <span className="px-2 py-0.5 rounded bg-[#161922] border border-white/10 text-[#F5C518] font-medium">
                          🍿 {msg.bookingDraft.comboQuantity || 1}x {msg.bookingDraft.comboName}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const draft = msg.bookingDraft!;
                        executeWebAction({ action: "auto_book", draft });
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-heading font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all duration-200 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Xác nhận & Đi đến đặt vé →
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Gợi ý yêu cầu nhanh */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Yêu cầu nhanh:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item)}
                      className="text-left text-[11px] px-3 py-2 rounded-lg bg-[#12141C] hover:bg-[#1E222D] text-neutral-200 border border-white/10 hover:border-[#E50914] transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-3 bg-[#12141C] border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhắn yêu cầu: 'Đặt 2 vé Dune tối nay', 'Lịch chiếu'..."
                disabled={isStreaming}
                className="flex-1 bg-[#0B0C10] text-xs text-white placeholder-[#9CA3AF] px-3.5 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#E50914] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-lg bg-[#E50914] hover:bg-[#b80710] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-red-600/30 flex-shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
