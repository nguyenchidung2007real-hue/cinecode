import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineMax AI - Đặt Vé Xem Phim & Trợ Lý AI Siêu Tốc",
  description:
    "Hệ thống đặt vé xem phim điện ảnh hiện đại, tích hợp sơ đồ chọn ghế thông minh, kho phim TMDB và trợ lý AI Groq LPU phản hồi tức thì.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-background text-neutral-100 min-h-screen antialiased selection:bg-accent-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
