import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: SITE.url, lastModified: new Date(), priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE.url}/${c.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${SITE.url}/${p.category}/${p.slug}`,
      lastModified: new Date(p.date),
      priority: 0.9,
    })),
  ];
}
