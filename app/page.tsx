import Link from "next/link";
import Hero from "@/components/Hero";
import PixelMotif from "@/components/PixelMotif";
import PostCard from "@/components/PostCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CATEGORIES } from "@/lib/categories";
import { getAllPosts, getPostsByCategory } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />

        <section
          id="sections"
          aria-labelledby="sections-heading"
          className="wrap scroll-mt-16 pt-[var(--band)]"
        >
          <h2 id="sections-heading" className="t-pixel text-faint">
            Four ways in
          </h2>

          <div className="mt-9 grid gap-px bg-line sm:grid-cols-2">
            {CATEGORIES.map((c, i) => {
              const n = getPostsByCategory(c.slug).length;
              return (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  data-accent={c.slug}
                  className="reveal group relative flex min-h-[9.5rem] flex-col justify-between bg-ground p-7 transition-colors duration-500 hover:bg-surface sm:min-h-[12rem] sm:p-9"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[clamp(1.5rem,1.2rem+1.5vw,2.1rem)] leading-none tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent-ink">
                        {c.label}
                      </h3>
                    </div>
                    <PixelMotif
                      motif={c.motif}
                      size={64}
                      className="mt-1 flex-none opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  </div>
                  <p className="t-pixel mt-8 text-faint">
                    {n === 0 ? "nothing yet" : n === 1 ? "1 piece" : `${n} pieces`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {posts.length > 0 ? (
          <section aria-labelledby="latest-heading" className="wrap pt-[var(--band)]">
            <h2 id="latest-heading" className="t-pixel text-faint">
              Latest
            </h2>
            <div className="mt-4">
              {posts.slice(0, 8).map((p) => (
                <div key={`${p.category}/${p.slug}`} className="reveal">
                  <PostCard post={p} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
