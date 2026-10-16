import type { Metadata, Viewport } from "next";
import { Oswald, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { siteMetadata, siteViewport, websiteJsonLd } from "@/lib/seo";

const oswald = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${oswald.variable} ${beVietnamPro.variable} font-sans bg-[#0B0C10] text-white min-h-screen antialiased selection:bg-[#E50914] selection:text-white`}>
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
