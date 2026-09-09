import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import PixelHorizon from "@/components/PixelHorizon";
import ReadingProgress from "@/components/ReadingProgress";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getCategory, isCategorySlug } from "@/lib/categories";
import { formatDate, getAllPosts, getNeighbours, getPost } from "@/lib/posts";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ category: p.category, slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) return {};
  const description = post.excerpt || post.subtitle || SITE.description;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/${post.category}/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/${post.category}/${post.slug}`,
      publishedTime: post.date,
      authors: [SITE.author],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) notFound();

  const post = getPost(category, slug);
  if (!post) notFound();

  const cat = getCategory(category)!;
  const { prev, next } = getNeighbours(post);

  return (
    <div data-accent={cat.slug}>
      <ReadingProgress target="article-body" />
      <SiteHeader active={cat.slug} />

      <main id="main" className="flex-1">
        <article>
          <header className="relative overflow-hidden">
            <PixelHorizon
              className="pointer-events-none absolute inset-x-0 top-0 h-52 sm:h-64"
              horizon={0.7}
              detail="strip"
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-52 sm:h-64"
              style={{
                background:
                  "linear-gradient(to bottom, color-mix(in oklab, var(--ground) 30%, transparent) 0%, color-mix(in oklab, var(--ground) 88%, transparent) 60%, var(--ground) 100%)",
              }}
              aria-hidden="true"
            />

            <div className="wrap-read relative z-10 pb-2 pt-36 sm:pt-44">
              <Link href={`/${cat.slug}`} className="chip">
                {cat.label}
              </Link>

              <h1 className="t-title mt-5">{post.title}</h1>

              {post.subtitle ? <p className="t-lede mt-4">{post.subtitle}</p> : null}

              <p className="t-pixel mt-7 text-faint">
                {formatDate(post.date)} &nbsp;·&nbsp; {post.readingMinutes} min read
              </p>

              <hr className="rule mt-8" />
            </div>
          </header>

          <div id="article-body" className="wrap-read pt-10">
            <div className="prose">
              <MDXRemote source={post.body} />
            </div>

            <p className="t-pixel mt-14 text-faint">
              Written by {SITE.author}
              {post.canonical ? (
                <>
                  {" · "}
                  <a href={post.canonical} rel="noopener" className="taplink underline underline-offset-4">
                    first published on substack
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </article>

        {prev || next ? (
          <nav aria-label="More in this section" className="wrap-read mt-[var(--band)]">
            <p className="t-pixel text-faint">More in {cat.label}</p>
            <div className="taplist mt-4">
              {next ? (
                <Link
                  href={`/${next.category}/${next.slug}`}
                  className="group block border-t border-line py-6"
                >
                  <span className="t-pixel text-faint">Newer</span>
                  <span className="mt-2 block text-[1.3rem] leading-tight tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent-ink">
                    {next.title}
                  </span>
                </Link>
              ) : null}
              {prev ? (
                <Link
                  href={`/${prev.category}/${prev.slug}`}
                  className="group block border-t border-line py-6"
                >
                  <span className="t-pixel text-faint">Older</span>
                  <span className="mt-2 block text-[1.3rem] leading-tight tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent-ink">
                    {prev.title}
                  </span>
                </Link>
              ) : null}
              <div className="border-t border-line" />
            </div>
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
