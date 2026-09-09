"use client";

import { useEffect } from "react";

/**
 * Mounted once. Reveals every .reveal on the page.
 *
 * The sweep deliberately has no lower bound — the classic
 * `top < vh && bottom > 0` test strands anything the reader has already
 * scrolled past after an anchor jump or a bfcache restore.
 */
export default function Reveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    if (reduce) {
      nodes().forEach((n) => n.classList.add("is-in"));
      return;
    }

    const sweep = () => {
      const vh = window.innerHeight;
      nodes().forEach((n) => {
        if (n.getBoundingClientRect().top < vh * 0.96) n.classList.add("is-in");
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -4% 0px" }
    );
    nodes().forEach((n) => io.observe(n));

    sweep();
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep);
    window.addEventListener("load", sweep);
    window.addEventListener("pageshow", sweep);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", sweep);
      window.removeEventListener("resize", sweep);
      window.removeEventListener("load", sweep);
      window.removeEventListener("pageshow", sweep);
    };
  }, []);

  return null;
}
