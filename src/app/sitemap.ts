import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const [products, pages] = await Promise.all([
    prisma.product.findMany({ where: { active: true, type: "BOTTLE" }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/eshop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/kontakt`, priority: 0.5 },
    ...products.map((p) => ({ url: `${base}/produkt/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, priority: 0.3 })),
  ];
}
