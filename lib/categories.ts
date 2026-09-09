/**
 * The sections. Adding one — tech, finance — is a single entry here plus a
 * matching folder under content/. Nothing else in the app hardcodes a slug.
 */

export type CategorySlug = "life" | "sports" | "people" | "stories";

export type Category = {
  slug: CategorySlug;
  label: string;
  /** shown under the section heading and in card previews */
  blurb: string;
  /** the pixel motif drawn on the card, see components/PixelMotif.tsx */
  motif: "fern" | "floodlight" | "figures" | "campfire";
};

export const CATEGORIES: Category[] = [
  {
    slug: "life",
    label: "Life",
    blurb: "How to carry things, and when to put them down.",
    motif: "fern",
  },
  {
    slug: "sports",
    label: "Sports",
    blurb: "Ninety minutes, and everything they do to a person.",
    motif: "floodlight",
  },
  {
    slug: "people",
    label: "People",
    blurb: "The ones who shaped a day without meaning to.",
    motif: "figures",
  },
  {
    slug: "stories",
    label: "Stories",
    blurb: "Things that happened, told the long way round.",
    motif: "campfire",
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return CATEGORY_SLUGS.includes(slug as CategorySlug);
}
