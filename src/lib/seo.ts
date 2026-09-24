import type { Metadata, Viewport } from "next";

/**
 * Cấu hình SEO tập trung cho CineMax AI (Next.js 14 Metadata API).
 * layout.tsx chỉ cần:
 *   export const metadata = siteMetadata;
 *   export const viewport = siteViewport;
 */

function resolveSiteUrl(): string {
  // 1) Ưu tiên biến do bạn tự đặt (domain thật).
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // 2) Vercel tự cấp domain production (không có "https://").
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction}`;

  // 3) Chạy local.
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "CineMax AI";

const TITLE = "CineMax AI - Đặt vé xem phim & gợi ý phim theo tâm trạng";
const DESCRIPTION =
  "Tìm phim bằng AI theo tâm trạng hoặc mô tả nội dung, trò chuyện với trợ lý phim, chọn ghế đẹp và đặt vé rạp chiếu nhanh chóng với vé điện tử QR.";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "đặt vé xem phim",
    "phim đang chiếu",
    "phim sắp chiếu",
    "gợi ý phim theo tâm trạng",
    "tìm phim bằng AI",
    "trợ lý phim AI",
    "vé điện tử QR",
    "CineMax AI",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  category: "entertainment",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0C10",
  colorScheme: "dark",
};

/** Dữ liệu có cấu trúc schema.org cho toàn site. */
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "vi-VN",
  description: DESCRIPTION,
} as const;
