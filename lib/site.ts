export const SITE = {
  name: "haristacks",
  author: "Hariharan",
  tagline: "Hari writes life, tech, finance, sport and feelings.",
  description:
    "Essays on life, tech, finance, sport and feelings by Hariharan. Long reads, written slowly.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://haristacks.vercel.app",
  /** the words that cycle in the hero line */
  hero: ["life", "tech", "finance", "sport", "feelings"] as const,
};
