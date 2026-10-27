import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/env";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl()}/`, changeFrequency: "daily", priority: 1 }];
}
