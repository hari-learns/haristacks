"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PixelHorizon from "./PixelHorizon";
import type { PhaseName } from "@/lib/scene";
import { SITE } from "@/lib/site";

const WORDS = SITE.hero;
const HOLD_MS = 2000;
const FADE_MS = 300;

export default function Hero() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(true);
  const [phase, setPhase] = useState<PhaseName | null>(null);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion still cycles — it is content, not decoration — but it
    // cuts rather than fades, and it dwells longer.
    const hold = reduceRef.current ? HOLD_MS * 2 : HOLD_MS;
    let outTimer: ReturnType<typeof setTimeout>;

    const tick = setInterval(() => {
      if (reduceRef.current) {
        setI((n) => (n + 1) % WORDS.length);
        return;
      }
      setShown(false);
      outTimer = setTimeout(() => {
        setI((n) => (n + 1) % WORDS.length);
        setShown(true);
      }, FADE_MS);
    }, hold);

    return () => {
      clearInterval(tick);
      clearTimeout(outTimer);
    };
  }, []);

  const word = WORDS[i];

  return (
    <section
      data-accent={word === "sport" ? "sports" : word}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-0 py-28"
    >
      <PixelHorizon
        className="absolute inset-0"
        horizon={0.30}
        onPhase={setPhase}
      />

      {/* the accent of the live word, breathed over the scene */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-700"
        style={{
          background: "var(--accent)",
          opacity: 0.12,
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />

      {/* the horizon dissolving into the page, so the words are legible
          against every one of the four palettes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 27%, color-mix(in oklab, var(--ground) 45%, transparent) 32%, color-mix(in oklab, var(--ground) 88%, transparent) 38%, color-mix(in oklab, var(--ground) 99%, transparent) 44%, var(--ground) 49%)",
        }}
        aria-hidden="true"
      />

      <div className="wrap relative z-10 text-center">
        {phase ? (
          <p className="t-pixel mb-6 text-faint">
            <span className="text-accent-ink">{phase}</span> where you are
          </p>
        ) : (
          <p className="t-pixel mb-6 text-faint">&nbsp;</p>
        )}

        <h1 className="t-display mx-auto max-w-[16ch]">
          {/* the whole sentence, for anything that reads rather than watches */}
          <span className="sr-only">{SITE.tagline}</span>
          <span aria-hidden="true">
            Hari writes{" "}
            <span className="relative inline-block align-baseline">
              <span
                className="inline-block italic text-accent-ink"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "translateY(0)" : "translateY(6px)",
                  transition: `opacity ${FADE_MS}ms var(--ease), transform ${FADE_MS}ms var(--ease)`,
                }}
              >
                {word}
              </span>
            </span>
          </span>
        </h1>

        <p className="t-lede mx-auto mt-7 max-w-[34ch]">
          Long reads, written slowly. Nothing here is in a hurry.
        </p>

        <div className="mt-10">
          <Link href="#sections" className="pill">
            Read
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2"
        aria-hidden="true"
      >
        <svg viewBox="0 0 9 6" width="18" height="12" className="breathe" fill="var(--faint)" shapeRendering="crispEdges">
          <rect x="0" y="0" width="1" height="1" />
          <rect x="1" y="1" width="1" height="1" />
          <rect x="2" y="2" width="1" height="1" />
          <rect x="3" y="3" width="3" height="1" />
          <rect x="6" y="2" width="1" height="1" />
          <rect x="7" y="1" width="1" height="1" />
          <rect x="8" y="0" width="1" height="1" />
        </svg>
      </div>
    </section>
  );
}
