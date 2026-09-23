import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { MOCK_MOVIES } from "@/lib/mockData";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Bạn là CineBot - Trợ lý AI tư vấn phim và đặt vé thông minh hàng đầu của CineMax AI.
Phong cách trò chuyện: Thân thiện, hào hứng, am hiểu sâu sắc về điện ảnh, nói tiếng Việt tự nhiên và súc tích.
Bạn nắm rõ danh sách phim đang chiếu và rạp:
- Phim đang hot: Dune: Phần Hai (Denis Villeneuve, IMAX Laser), Quật Mộ Trùng Ma (Exhuma - Kinh dị Hàn Quốc), Inside Out 2 (Gia đình/Hoạt hình), Deadpool & Wolverine, Oppenheimer.
- Bạn có thể gợi ý phim theo tâm trạng, thể loại, độ tuổi, và tư vấn vị trí ghế ngồi đẹp nhất trong rạp (thường là hàng ghế E, F, G, H ở vị trí chính giữa màn hình).
- Luôn giữ câu trả lời ngắn gọn, trực diện, trình bày đẹp mắt với các gạch đầu dòng và emoji sinh động.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;

    // Chế độ 1: Nếu có Groq API Key thật -> Stream tốc độ ánh sáng ~500 tokens/s
    if (apiKey && apiKey.trim() !== "") {
      const groq = new Groq({ apiKey });

      const stream = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Chế độ 2: Mock AI Streaming thông minh khi chưa nhập API Key (trải nghiệm mượt mà không lỗi)
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let simulatedReply = "";

    if (lastUserMessage.includes("ghế") || lastUserMessage.includes("vị trí") || lastUserMessage.includes("chỗ")) {
      simulatedReply = `🍿 **Tư vấn vị trí ghế ngồi hoàn hảo nhất:**\n\n- **Phòng chiếu 2D / 3D tiêu chuẩn**: Vị trí đắc địa nhất là **hàng F hoặc G (ghế 6 đến 11)**. Đây là khu vực "Sweet Spot" nơi âm thanh vòm hội tụ chuẩn xác nhất và mắt không bị mỏi khi xem 2 tiếng.\n- **Phòng IMAX Laser**: Hãy chọn **hàng H hoặc I**. Màn hình IMAX rất cao nên ngồi từ giữa lùi về sau sẽ bao quát trọn vẹn khung hình mà không phải ngước cổ.\n- **Đi cùng người yêu**: Các ghế **Couple (Sweetbox) ở hàng cuối (K hoặc L)** sẽ mang lại không gian riêng tư và thoải mái nhất!`;
    } else if (lastUserMessage.includes("kinh dị") || lastUserMessage.includes("ma") || lastUserMessage.includes("quật mộ")) {
      simulatedReply = `👻 **Gợi ý phim Kinh dị đỉnh nhất:**\n\nBạn nhất định không thể bỏ qua **"Quật Mộ Trùng Ma (Exhuma)"**!\n- **Điểm nổi bật**: Hiện tượng phòng vé châu Á với sự tham gia của Choi Min-sik và Kim Go-eun. Phim kết hợp yếu tố tâm linh phong thủy cổ truyền và giật gân hồi hộp nghẹt thở.\n- **Suất chiếu khuyên dùng**: 20:00 tối nay tại rạp CGV để cảm nhận trọn vẹn không khí rùng rợn!`;
    } else if (lastUserMessage.includes("hài") || lastUserMessage.includes("gia đình") || lastUserMessage.includes("hoạt hình")) {
      simulatedReply = `🎈 **Gợi ý phim Vui vẻ & Ấm áp:**\n\n- **Inside Out 2 (Những Mảnh Ghép Cảm Xúc 2)**: Cực kỳ hài hước và ý nghĩa cho cả gia đình lẫn bạn bè. Nhân vật Lo Âu (Anxiety) chắc chắn sẽ khiến bạn vừa cười vừa đồng cảm!\n- **Deadpool & Wolverine**: Nếu bạn thích phong cách hài bựa, hành động cháy nổ mãn nhãn của vũ trụ Marvel.`;
    } else if (lastUserMessage.includes("dune") || lastUserMessage.includes("khoa học") || lastUserMessage.includes("hành động")) {
      simulatedReply = `🚀 **Siêu phẩm Hành động & Viễn tưởng:**\n\n- **Dune: Phần Hai**: Tuyệt tác điện ảnh của Denis Villeneuve. Hình ảnh sa mạc cát Arrakis và âm thanh của Hans Zimmer sẽ bùng nổ tốt nhất nếu bạn đặt vé tại **Phòng IMAX Laser (Vincom Landmark 81)**!\n- Điểm đánh giá: 8.8/10 trên IMDb.`;
    } else {
      simulatedReply = `Chào bạn! Tôi là **CineBot AI** 🤖🎬\n\nHiện tại rạp đang có những tựa phim cực hot:\n1. 🏜️ **Dune: Phần Hai** (Sci-Fi, Hành động mãn nhãn)\n2. ⚰️ **Quật Mộ Trùng Ma** (Kinh dị, Bí ẩn giật gân)\n3. 🧠 **Inside Out 2** (Hoạt hình hài hước, Chữa lành)\n4. ⚔️ **Deadpool & Wolverine** (Hài hước, Siêu anh hùng)\n\n👉 Bạn muốn tìm phim theo thể loại nào, hay cần tư vấn suất chiếu và chọn ghế đẹp nhất rạp? Cứ hỏi tôi nhé! *(Mẹo: Thêm GROQ_API_KEY vào .env.local để mở khóa trí tuệ toàn năng của Llama 3.3)*`;
    }

    // Stream từng từ giả lập để tạo trải nghiệm typing tốc độ cao
    const words = simulatedReply.split(" ");
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 25)); // 25ms per word (~40 words/sec)
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Lỗi API Chat:", error);
    return new Response(JSON.stringify({ error: "Lỗi kết nối AI" }), { status: 500 });
  }
}
