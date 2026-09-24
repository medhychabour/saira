import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/products";
import { getPosts } from "@/lib/blog";

// Home, the blog, and every post; new posts are picked up at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const latest = posts[0]?.date ? new Date(posts[0].date) : new Date();
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : latest,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
