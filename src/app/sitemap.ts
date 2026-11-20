import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/play`, priority: 0.9 },
    { url: `${SITE_URL}/about`, priority: 0.4 },
  ];
}
