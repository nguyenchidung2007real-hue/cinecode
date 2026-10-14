"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Trash2, Film, Armchair, Ticket, ArrowRight, Compass } from "lucide-react";
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
    content: "Chào bạn! Tôi là **CineBot AI Agent** 🤖🎬.\nTôi có thể **trực tiếp điều khiển trang web** và **đặt vé hộ bạn**: Hãy thử bảo tôi: *\"Đặt hộ tôi 2 vé phim Dune tối nay\"*, *\"Xem lịch chiếu rạp Beta\"*, hoặc *\"Mở ví vé của tôi\"*!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const SUGGESTIONS = [
  "🎟️ Đặt hộ tôi 2 vé phim Dune tối nay",
  "📅 Cuộn xuống xem lịch chiếu rạp Beta hôm nay",
  "🎫 Mở ví vé của tôi",
  "🔥 Mình đang stress quá, cần phim xả hơi",
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

  // Bộ điều khiển Web-Action: AI Agent chủ động điều khiển trang web
  const executeWebAction = (actionObj: any) => {
    const actType = actionObj.action;
    const bannerMsg = actionObj.message || "🤖 AI Agent đang điều khiển trang web...";
    setActiveActionBanner(bannerMsg);

    if (actType === "auto_book") {
      const draft = actionObj.data || actionObj.draft;
      if (draft) {
        useBookingStore.getState().prefillFromAiTool({
          movieId: draft.movieId || "dune-2",
          movieTitle: draft.movieTitle,
          cinemaName: draft.cinemaName || "Beta Cinemas Xuân Thủy",
          showtimeId: draft.showtimeId || "st-beta-today-1",
          showtimeLabel: draft.showtimeLabel || "19:00",
          format: draft.format || "2D",
          suggestedSeats: draft.suggestedSeatIds.map((id: string) => ({
            id,
            type: draft.seatType,
          })),
          suggestedCombos: draft.comboName
            ? [{ id: "ai-combo", name: draft.comboName, quantity: draft.comboQuantity || 1 }]
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
        onOpenMyTickets?.();
      }, 700);
    } else if (actType === "open_search") {
      setTimeout(() => {
        onToggle();
        setActiveActionBanner(null);
        onOpenSearch?.();
      }, 700);
    } else if (actType === "filter_mood") {
      setTimeout(() => {
        if (actionObj.moodId) {
          onSelectMood?.(actionObj.moodId);
        }
        onToggle();
        setActiveActionBanner(null);
        setTimeout(() => {
          document.getElementById("commercial-tabs")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }, 700);
    } else if (actType === "navigate_page") {
      setTimeout(() => {
        setActiveActionBanner(null);
        if (actionObj.targetSection) {
          window.location.href = actionObj.targetSection;
        }
      }, 700);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const botMsgId = (Date.now() + 1).toString();
    const assistantMsgPlaceholder: ChatMessage = {
      id: botMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...newMessages, assistantMsgPlaceholder]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            recommendation: m.recommendation,
          })),
        }),
      });

      if (!response.body) throw new Error("Không thể kết nối luồng stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = parsed.content || parsed.text;
              if (textChunk) {
                accumulated += textChunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, content: accumulated } : msg
                  )
                );
              }

              // Nhận phản hồi điều khiển web (Web Action)
              const webAction =
                parsed.action || (parsed.type === "web_action" ? parsed.payload || parsed.action : null);
              if (webAction) {
                executeWebAction(webAction);
              }

              const rec = parsed.recommendation || (parsed.type === "recommendation" ? parsed.data : null);
              if (rec) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, recommendation: rec } : msg
                  )
                );
              }

              const draft = parsed.draft || (parsed.type === "booking_draft" ? parsed.payload : null);
              if (draft) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, bookingDraft: draft } : msg
                  )
                );

                // Nếu có cờ tự động thực thi (autoExecute) từ Agent
                if (draft.autoExecute && !webAction) {
                  executeWebAction({
                    action: "auto_book",
                    draft,
                    message: `🤖 AI Agent đang mở màn hình đặt vé phim "${draft.movieTitle}" và chọn sẵn ghế đẹp...`,
                  });
                }
              }
            } catch {
              // Bỏ qua lỗi parse từng chunk không hoàn chỉnh
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, content: "Xin lỗi, đã xảy ra lỗi kết nối với máy chủ AI. Vui lòng thử lại sau giây lát!" }
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
  };

  return (
    <>
      {/* Nút bấm nổi kích hoạt Chatbot ở góc dưới màn hình: Chỉ hiển thị hình icon robot */}
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Trợ lý"
          title="Trợ lý"
          className="fixed bottom-6 right-6 z-40 group flex items-center justify-center w-14 h-14 rounded-full bg-[#e71a0f] hover:bg-[#c81007] text-white shadow-xl shadow-red-600/40 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/80"
        >
          <Bot className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Khung cửa sổ Chat */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[430px] h-[580px] max-h-[85vh] bg-white border border-[#e5e0d8] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-slate-800">
          {/* Header Cửa sổ Chat */}
          <div className="px-4 py-3 bg-[#faf8f2] border-b border-[#e5e0d8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#e71a0f] flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-[#1c1c1c]">Trợ Lý Rạp Phim</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                    Cinema
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tư vấn & hỗ trợ đặt vé trực tuyến
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Xóa lịch sử chat"
                className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                title="Đóng chat"
                className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner thông báo khi đang thực hiện thao tác */}
          {activeActionBanner && (
            <div className="px-3.5 py-2 bg-red-50 border-b border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-pulse">
              <Bot className="w-4 h-4 text-[#e71a0f] shrink-0" />
              <span className="truncate">{activeActionBanner}</span>
            </div>
          )}

          {/* Danh sách tin nhắn */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex gap-2.5 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#e71a0f] text-white font-medium rounded-tr-none"
                        : "bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content || "..."}</p>
                    <span className="block text-[9px] text-neutral-400 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* THẺ GỢI Ý ĐẶT VÉ NHANH (QUICK-BOOKING CARD) */}
                {msg.role === "assistant" && msg.recommendation && (
                  <div className="mt-2.5 ml-8 max-w-[85%] p-3 rounded-xl bg-neutral-50 border border-[#e5e0d8] shadow-sm space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-2.5">
                      {msg.recommendation.posterPath ? (
                        <img
                          src={msg.recommendation.posterPath}
                          alt={msg.recommendation.movieTitle}
                          className="w-12 h-16 object-cover rounded-lg shadow-sm border border-neutral-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-neutral-200">
                          <Film className="w-5 h-5 text-[#e71a0f]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-[#e71a0f] border border-rose-200">
                          <Bot className="w-2.5 h-2.5" /> Gợi ý chuẩn gu
                        </span>
                        <h5 className="font-extrabold text-neutral-900 text-xs mt-1 truncate">
                          {msg.recommendation.movieTitle}
                        </h5>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {msg.recommendation.reason}
                        </p>
                      </div>
                    </div>

                    {/* Vị trí ghế gợi ý */}
                    {msg.recommendation.suggestedSeats && msg.recommendation.suggestedSeats.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-[#e5e0d8]">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-[#e71a0f]" /> Ghế Sweet Spot:
                        </span>
                        <span className="font-mono font-bold text-[#e71a0f] tracking-wider">
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
                      className="w-full py-2 px-3 rounded-lg bg-[#e71a0f] hover:bg-[#c81007] text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-[#e71a0f]/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Đặt vé nhanh ngay
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}

                {/* THẺ ĐỀ XUẤT ĐẶT VÉ TỰ ĐỘNG TỪ GROQ FUNCTION CALLING */}
                {msg.role === "assistant" && msg.bookingDraft && (
                  <div className="mt-2.5 ml-8 max-w-[85%] p-3.5 rounded-xl bg-neutral-50 border border-rose-200 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#e71a0f] font-bold">
                      <Bot className="w-3 h-3" />
                      <span>Đề xuất đặt vé thông minh</span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-neutral-900">{msg.bookingDraft.movieTitle}</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        📍 {msg.bookingDraft.cinemaName || "CGV Vincom Bà Triệu"} • 🕒 {msg.bookingDraft.showtimeLabel || "19:00"} ({msg.bookingDraft.format || "2D"})
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 font-medium">
                        Ghế ({msg.bookingDraft.seatType}): {msg.bookingDraft.suggestedSeatIds.join(", ")}
                      </span>
                      {msg.bookingDraft.comboName && (
                        <span className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-emerald-700 font-medium">
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
                      className="w-full py-2 px-3 rounded-lg bg-[#e71a0f] hover:bg-[#c81007] text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-[#e71a0f]/30 transition-all duration-200 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Giữ ghế trên Redis & Mở đặt vé →
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Gợi ý câu hỏi nhanh theo tâm trạng */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Thử ra lệnh cho AI Agent:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item)}
                      className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
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
          <div className="p-3 bg-slate-50 border-t border-slate-200">
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
                placeholder="Ra lệnh: 'Đặt hộ 2 vé Dune', 'Xem lịch chiếu'..."
                disabled={isStreaming}
                className="flex-1 bg-white text-xs text-slate-900 placeholder-slate-400 px-3.5 py-2.5 rounded-xl border border-[#e5e0d8] focus:outline-none focus:border-[#e71a0f] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-[#e71a0f] hover:bg-[#c81007] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-red-600/30 flex-shrink-0"
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
