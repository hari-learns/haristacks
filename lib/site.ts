export const SITE = {
  name: "haristacks",
  author: "Hariharan",
  tagline: "Hari writes tech, finance, feelings, sport and life.",
  description:
    "Essays on tech, finance, feelings, sport and life by Hariharan. Long reads, written slowly.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://haristacks.vercel.app",
  /** the words that cycle in the hero line */
  hero: ["tech", "finance", "feelings", "sport", "life"] as const,
};
