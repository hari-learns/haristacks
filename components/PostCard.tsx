import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";
import { getCategory } from "@/lib/categories";

export default function PostCard({
  post,
  showCategory = true,
}: {
  post: Post;
  showCategory?: boolean;
}) {
  const cat = getCategory(post.category);

  return (
    <article data-accent={post.category} className="group border-t border-line">
      <Link
        href={`/${post.category}/${post.slug}`}
        className="block py-7 transition-colors duration-300 sm:py-9"
      >
        {showCategory && cat ? <span className="chip">{cat.label}</span> : null}

        <h3 className="mt-3 text-[clamp(1.35rem,1.1rem+1.2vw,1.95rem)] leading-[1.15] tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent-ink">
          {post.title}
        </h3>

        {post.subtitle ? (
          <p className="mt-2 max-w-[46ch] text-[1.02rem] italic leading-[1.5] text-muted">
            {post.subtitle}
          </p>
        ) : null}

        <p className="t-pixel mt-4 text-faint">
          {formatDate(post.date)} &nbsp;·&nbsp; {post.readingMinutes} min
        </p>
      </Link>
    </article>
  );
}
