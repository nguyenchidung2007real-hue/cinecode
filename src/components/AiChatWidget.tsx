"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Trash2, Zap, Film, Armchair, Ticket, ArrowRight } from "lucide-react";
import { ChatMessage, Movie } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";

interface AiChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectMovieForBooking?: (movie: Movie, suggestedSeats?: string[]) => void;
  movies?: Movie[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Chào bạn! Tôi là **CineBot AI** 🤖🎬. Kể cho mình nghe tâm trạng hôm nay của bạn (áp lực, buồn, muốn cảm giác mạnh, hẹn hò...) hoặc số người đi xem, mình sẽ gợi ý phim hợp gu và chọn sẵn ghế đẹp nhất nhé!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const SUGGESTIONS = [
  "🔥 Mình đang stress quá, cần phim xả hơi",
  "🍿 Tư vấn vị trí ghế đẹp nhất phòng IMAX",
  "👻 Thích cảm giác mạnh, rùng rợn giật gân",
  "💕 Đi xem phim với người yêu thì ngồi đâu?",
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  isOpen,
  onToggle,
  onSelectMovieForBooking,
  movies = MOCK_MOVIES,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
              const rec = parsed.recommendation || (parsed.type === "recommendation" ? parsed.data : null);
              if (rec) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, recommendation: rec } : msg
                  )
                );
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
  };

  return (
    <>
      {/* Nút bấm nổi kích hoạt Chatbot ở góc dưới màn hình */}
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Mở Trợ lý AI"
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 p-3.5 sm:px-4 sm:py-3.5 rounded-full bg-gradient-to-r from-accent-red to-orange-600 text-white font-bold text-xs shadow-2xl shadow-accent-red/50 hover:shadow-accent-red/80 transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-cyan rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline">Hỏi Trợ Lý AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-accent-cyan border border-accent-cyan/30 flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> Siêu tốc
          </span>
        </button>
      )}

      {/* Khung cửa sổ Chat */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[430px] h-[580px] max-h-[85vh] glass-panel border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header Cửa sổ Chat */}
          <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-red to-accent-cyan flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white">CineBot AI</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40">
                    Llama 3.3
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gợi ý tâm trạng & Ghế chuẩn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Xóa lịch sử chat"
                className="w-7 h-7 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                title="Đóng chat"
                className="w-7 h-7 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex gap-2.5 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-accent-red/20 text-accent-red border border-accent-red/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-accent-red text-white font-medium rounded-tr-none"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content || "..."}</p>
                    <span className="block text-[9px] text-neutral-400/80 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* THẺ GỢI Ý ĐẶT VÉ NHANH (QUICK-BOOKING CARD) */}
                {msg.role === "assistant" && msg.recommendation && (
                  <div className="mt-2.5 ml-8 max-w-[85%] p-3 rounded-xl bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-accent-red/10 border border-accent-red/40 shadow-xl shadow-black/50 backdrop-blur-md space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-2.5">
                      {msg.recommendation.posterPath ? (
                        <img
                          src={msg.recommendation.posterPath}
                          alt={msg.recommendation.movieTitle}
                          className="w-12 h-16 object-cover rounded-lg shadow-md border border-neutral-700/60 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-5 h-5 text-accent-red" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red border border-accent-red/30">
                          <Sparkles className="w-2.5 h-2.5" /> Gợi ý chuẩn gu
                        </span>
                        <h5 className="font-extrabold text-white text-xs mt-1 truncate">
                          {msg.recommendation.movieTitle}
                        </h5>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {msg.recommendation.reason}
                        </p>
                      </div>
                    </div>

                    {/* Vị trí ghế gợi ý */}
                    {msg.recommendation.suggestedSeats && msg.recommendation.suggestedSeats.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-accent-cyan" /> Ghế Sweet Spot:
                        </span>
                        <span className="font-mono font-bold text-accent-cyan tracking-wider">
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
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-accent-red to-orange-600 hover:from-accent-redHover hover:to-orange-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-accent-red/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Đặt vé nhanh ngay
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Gợi ý câu hỏi nhanh theo tâm trạng */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-neutral-400 mb-2">Hỏi nhanh theo tâm trạng:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item)}
                      className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
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
          <div className="p-3 bg-neutral-900/95 border-t border-neutral-800">
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
                placeholder="Chia sẻ tâm trạng hoặc hỏi vị trí ghế..."
                disabled={isStreaming}
                className="flex-1 bg-neutral-950 text-xs text-white placeholder-neutral-500 px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-accent-cyan transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-accent-red hover:bg-accent-redHover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md flex-shrink-0"
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
