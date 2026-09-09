import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PixelHorizon from "@/components/PixelHorizon";
import PixelMotif from "@/components/PixelMotif";
import PostCard from "@/components/PostCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CATEGORIES, getCategory, isCategorySlug } from "@/lib/categories";
import { getPostsByCategory } from "@/lib/posts";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: cat.label,
    description: cat.blurb,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: { title: cat.label, description: cat.blurb, url: `/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const cat = getCategory(category)!;
  const posts = getPostsByCategory(category);

  return (
    <div data-accent={cat.slug}>
      <SiteHeader active={cat.slug} />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <PixelHorizon
            className="pointer-events-none absolute inset-x-0 top-0 h-56 sm:h-72"
            horizon={0.66}
            detail="strip"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 sm:h-72"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--ground) 25%, transparent) 0%, color-mix(in oklab, var(--ground) 85%, transparent) 58%, var(--ground) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="wrap relative z-10 pb-4 pt-40 sm:pt-52">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="t-pixel text-faint">Section</p>
                <h1 className="t-title mt-4">{cat.label}</h1>
                <p className="t-lede mt-4 max-w-[34ch]">{cat.blurb}</p>
              </div>
              <PixelMotif motif={cat.motif} size={72} className="flex-none opacity-85 sm:h-[84px] sm:w-[84px]" />
            </div>
          </div>
        </section>

        <section className="wrap pt-10">
          {posts.length === 0 ? (
            <p className="border-t border-line py-14 text-muted italic">
              Nothing here yet. It is being written.
            </p>
          ) : (
            posts.map((p) => (
              <div key={p.slug} className="reveal">
                <PostCard post={p} showCategory={false} />
              </div>
            ))
          )}
          <div className="border-t border-line" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
