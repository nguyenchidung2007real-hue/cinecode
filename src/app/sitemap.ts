import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Hiện site là một trang chủ duy nhất (phim mở bằng modal), nên sitemap chỉ có "/".
 * Khi bổ sung trang chi tiết phim (vd: /movies/[id]), thêm các URL đó vào đây.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
