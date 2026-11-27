import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const pages = ["", "/about", "/services", "/classes", "/blog", "/faq", "/contact"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const }));
  const posts = (await listPublishedPosts(500)).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at }));
  return [...pages, ...posts];
}
