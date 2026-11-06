import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  // Vývojová verze: zakázat indexování celého webu
  if (process.env.DEV_NOINDEX === "true" || process.env.DEV_BASIC_AUTH) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/objednavka", "/kosik", "/pokladna", "/platba-test", "/preview"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
