import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/pedido/", "/checkout"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
