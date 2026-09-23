"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Trash2, Zap } from "lucide-react";
import { ChatMessage } from "@/types";

interface AiChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Chào bạn! Tôi là **CineBot AI** 🤖🎬. Tôi có thể giúp bạn tìm phim hợp gu, chọn suất chiếu và tư vấn vị trí ghế ngồi đẹp nhất trong rạp. Bạn cần tôi hỗ trợ gì hôm nay?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const SUGGESTIONS = [
  "🎬 Gợi ý phim viễn tưởng / hành động hay nhất",
  "🍿 Tư vấn vị trí ghế phòng IMAX Landmark 81",
  "👻 Phim kinh dị nào đang hot tuần này?",
  "👨‍👩‍👧‍👦 Phim hoạt hình phù hợp cho gia đình",
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ isOpen, onToggle }) => {
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
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, content: accumulated } : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON parse errors in stream
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
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[550px] max-h-[85vh] glass-panel border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
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
                    Groq LPU
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng phản hồi tức thì
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
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-accent-red/20 text-accent-red border border-accent-red/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
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
            ))}

            {/* Gợi ý câu hỏi nhanh */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-neutral-400 mb-2">Câu hỏi nhanh:</p>
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
                placeholder="Hỏi về phim, rạp hoặc vị trí ghế ngồi..."
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
