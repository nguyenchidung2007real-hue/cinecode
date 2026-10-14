import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteMetadata, siteViewport, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-[#fdfcf0] text-[#1c1c1c] min-h-screen antialiased selection:bg-[#e71a0f] selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
