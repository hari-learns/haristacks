import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import PixelHorizon from "./PixelHorizon";

export default function SiteFooter() {
  return (
    <footer className="relative mt-[var(--band)] overflow-hidden border-t border-line">
      <PixelHorizon
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        horizon={0.62}
        detail="strip"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--ground) 30%, transparent) 0%, color-mix(in oklab, var(--ground) 88%, transparent) 55%, var(--ground) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="wrap relative z-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-32">
        <p className="max-w-[22ch] text-[clamp(1.3rem,1.1rem+1.1vw,1.85rem)] leading-[1.28] tracking-[-0.02em]">
          Hari writes <em className="italic">life, tech, finance, sport</em> and{" "}
          <em className="italic">feelings</em>.
        </p>

        <nav aria-label="Footer" className="taplist mt-10 flex flex-wrap gap-x-7 gap-y-1">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="t-pixel text-muted transition-colors duration-200 hover:text-ink">
              {c.label}
            </Link>
          ))}
          <a
            href="/rss.xml"
            className="t-pixel text-muted transition-colors duration-200 hover:text-ink"
          >
            RSS
          </a>
        </nav>

        <p className="t-pixel mt-10 text-faint">
          {SITE.name} — written by {SITE.author}
        </p>
      </div>
    </footer>
  );
}
