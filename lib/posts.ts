import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { CATEGORIES, type CategorySlug } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Post = {
  slug: string;
  category: CategorySlug;
  title: string;
  subtitle: string;
  date: string; // ISO
  excerpt: string;
  readingMinutes: number;
  /** original home, if the piece was published elsewhere first */
  canonical?: string;
  body: string;
};

function readCategory(category: CategorySlug): Post[] {
  const dir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const stats = readingTime(content);

      return {
        slug: file.replace(/\.mdx$/, ""),
        category,
        title: String(data.title ?? "Untitled"),
        subtitle: String(data.subtitle ?? ""),
        date: new Date(data.date ?? Date.now()).toISOString(),
        excerpt: String(data.excerpt ?? ""),
        readingMinutes: Math.max(1, Math.round(stats.minutes)),
        canonical: data.canonical ? String(data.canonical) : undefined,
        body: content,
      } satisfies Post;
    });
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  // In development the tree is read every time, so adding or editing a post
  // shows up on the next refresh instead of needing a server restart.
  if (cache && process.env.NODE_ENV === "production") return cache;

  const all = CATEGORIES.flatMap((c) => readCategory(c.slug));
  all.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  cache = all;
  return all;
}

export function getPostsByCategory(category: CategorySlug): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPost(category: string, slug: string): Post | undefined {
  return getAllPosts().find((p) => p.category === category && p.slug === slug);
}

/** Previous and next within the same section, newest-first order. */
export function getNeighbours(post: Post): { prev?: Post; next?: Post } {
  const list = getPostsByCategory(post.category);
  const i = list.findIndex((p) => p.slug === post.slug);
  return { prev: list[i + 1], next: list[i - 1] };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
