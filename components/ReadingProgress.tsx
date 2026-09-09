"use client";

import { useEffect, useState } from "react";

/** A horizon line filling across the top as the piece is read. */
export default function ReadingProgress({ target }: { target: string }) {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;
      const el = document.getElementById(target);
      if (!el) return;
      const start = el.offsetTop;
      const span = el.offsetHeight - window.innerHeight * 0.65;
      if (span <= 0) return setP(1);
      const done = (window.scrollY - start) / span;
      setP(Math.min(1, Math.max(0, done)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <div
        className="h-full origin-left bg-accent"
        style={{ transform: `scaleX(${p})`, transition: "transform 90ms linear" }}
      />
    </div>
  );
}
