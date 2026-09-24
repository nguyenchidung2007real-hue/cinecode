import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Bản Preview / Development trên Vercel: không cho bot lập chỉ mục.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API là endpoint nội bộ (tốn quota Groq/HF), không cần bot truy cập.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
