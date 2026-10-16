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
      <body className="bg-[#0B0C10] text-white min-h-screen antialiased selection:bg-[#E50914] selection:text-white">
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
