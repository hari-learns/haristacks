import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-[color-mix(in_oklab,var(--ground)_82%,transparent)] backdrop-blur-md">
      <div className="wrap flex flex-wrap items-center justify-between gap-y-1 py-2.5">
        <Link
          href="/"
          className="t-pixel flex min-h-11 items-center text-ink"
          aria-label={`${SITE.name}, home`}
        >
          <span className="mr-2 inline-block h-[7px] w-[7px] bg-accent align-middle" aria-hidden="true" />
          {SITE.name}
        </Link>

        <nav
          aria-label="Sections"
          className="order-3 -mx-[var(--gut)] w-[calc(100%+var(--gut)*2)] overflow-x-auto px-[var(--gut)] sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0"
        >
          <ul className="flex items-center gap-5 pb-1 sm:gap-6 sm:pb-0">
            {CATEGORIES.map((c) => (
              <li key={c.slug} data-accent={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  aria-current={active === c.slug ? "page" : undefined}
                  className={`t-pixel flex min-h-11 items-center whitespace-nowrap transition-colors duration-200 ${
                    active === c.slug ? "text-accent-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
