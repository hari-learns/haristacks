"use client";

import { useEffect, useRef, useState } from "react";
import {
  PHASES,
  phaseForHour,
  type PhaseName,
  type ScenePalette,
} from "@/lib/scene";

/* ---------- module constants (declared above any use — no TDZ traps) ---- */

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const SKY_BANDS = 11;
const FPS = 12;
const FRAME_MS = 1000 / FPS;

type Rect = { x: number; y: number; w: number; h: number };
type Cloud = { x: number; y: number; speed: number; parts: Rect[]; tone: 0 | 1 | 2 };
type Star = { x: number; y: number; phase: number };
type Tuft = { x: number; w: number; h: number; phase: number; dark: boolean };

/* ---------- tiny seeded RNG so the scene is stable across renders -------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(
    a[1] + (b[1] - a[1]) * t
  )},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

/* ---------- shape builders --------------------------------------------- */

function buildCloud(rand: () => number, cols: number, tone: 0 | 1 | 2): Cloud {
  const w = 9 + Math.floor(rand() * 13);
  const parts: Rect[] = [];

  // flat bottom, narrower rows stacked above it — the classic pixel cloud
  parts.push({ x: 0, y: 0, w, h: 1 });

  const inL = 1 + Math.floor(rand() * 2);
  const inR = 1 + Math.floor(rand() * 3);
  if (w - inL - inR > 2) {
    parts.push({ x: inL, y: -1, w: w - inL - inR, h: 1 });
  }

  const bumpW = 3 + Math.floor(rand() * 4);
  const bumpX = 1 + Math.floor(rand() * Math.max(1, w - bumpW - 2));
  parts.push({ x: bumpX, y: -2, w: bumpW, h: 1 });

  if (rand() > 0.55 && bumpW > 3) {
    parts.push({ x: bumpX + 1, y: -3, w: bumpW - 2, h: 1 });
  }

  return { x: rand() * cols, y: 0, speed: 0, parts, tone };
}

/** A ridge line built from a couple of summed sines — reads as mountains. */
function ridgeHeight(x: number, cols: number, seed: number, amp: number) {
  const a = Math.sin((x / cols) * Math.PI * 2 * (1.4 + seed * 0.6) + seed * 5.1);
  const b = Math.sin((x / cols) * Math.PI * 2 * (3.1 + seed) + seed * 2.7);
  const c = Math.sin((x / cols) * Math.PI * 2 * (6.3 + seed) + seed * 1.3);
  return (a * 0.6 + b * 0.28 + c * 0.12) * amp;
}

/* ---------- component --------------------------------------------------- */

export default function PixelHorizon({
  className = "",
  /** fraction of the canvas height where sky meets water */
  horizon = 0.56,
  phase,
  onPhase,
  detail = "auto",
}: {
  className?: string;
  horizon?: number;
  phase?: PhaseName;
  onPhase?: (p: PhaseName) => void;
  /** "strip" keeps chunkier pixels for short header bands */
  detail?: "auto" | "strip";
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      // Degrade to the CSS gradient underneath, but say so out loud.
      console.warn("[horizon] 2d context unavailable — falling back to gradient");
      setFailed(true);
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ?phase=dawn|day|dusk|night previews a sky that is not the current one
    let forced: PhaseName | undefined;
    try {
      const q = new URLSearchParams(window.location.search).get("phase");
      if (q && q in PHASES) forced = q as PhaseName;
    } catch {
      // no search params available; fall through to the clock
    }

    const resolved: PhaseName = forced ?? phase ?? phaseForHour(new Date().getHours());
    onPhase?.(resolved);
    const pal: ScenePalette = PHASES[resolved];

    let cols = 0;
    let rows = 0;
    let horizonY = 0;
    let waterEndY = 0;

    let baked: HTMLCanvasElement | null = null;
    let clouds: Cloud[] = [];
    let stars: Star[] = [];
    let tufts: Tuft[] = [];
    let bird = { x: -20, y: 0, active: false, nextAt: 4000 };

    /* ---- bake the parts that never move ---- */

    function bake() {
      const b = document.createElement("canvas");
      b.width = cols;
      b.height = rows;
      const bx = b.getContext("2d");
      if (!bx) throw new Error("offscreen 2d context unavailable");

      const top = hexToRgb(pal.skyTop);
      const bottom = hexToRgb(pal.skyBottom);
      const glow = hexToRgb(pal.glow);

      // dithered sky — banded on purpose, the way pixel art bands
      for (let y = 0; y < horizonY; y++) {
        const t = y / horizonY;
        // ease the last third toward the glow near the horizon
        const warm = Math.pow(t, 2.2);
        const s = t * SKY_BANDS;
        const i = Math.floor(s);
        const f = s - i;
        const cA = mix(
          mix2(top, bottom, i / SKY_BANDS),
          glow,
          Math.pow(i / SKY_BANDS, 2.6) * 0.55
        );
        const cB = mix(
          mix2(top, bottom, Math.min(1, (i + 1) / SKY_BANDS)),
          glow,
          Math.pow(Math.min(1, (i + 1) / SKY_BANDS), 2.6) * 0.55
        );
        void warm;
        for (let x = 0; x < cols; x++) {
          const threshold = (BAYER4[y & 3][x & 3] + 0.5) / 16;
          bx.fillStyle = f > threshold ? cB : cA;
          bx.fillRect(x, y, 1, 1);
        }
      }

      // stars
      if (pal.stars) {
        bx.fillStyle = pal.stars;
        for (const st of stars) {
          if (st.y < horizonY * 0.72) bx.fillRect(st.x, st.y, 1, 1);
        }
      }

      // sun or moon
      const discR = Math.max(3, Math.round(cols * 0.032));
      const discX = Math.round(cols * 0.72);
      const discY = Math.round(horizonY * 0.42);
      bx.fillStyle = pal.discEdge;
      pixelDisc(bx, discX, discY, discR + 1);
      bx.fillStyle = pal.disc;
      pixelDisc(bx, discX, discY, discR);
      if (resolved === "night") {
        // bite a crescent out of the moon
        bx.fillStyle = mix2s(pal.skyTop, pal.skyBottom, discY / Math.max(1, horizonY));
        pixelDisc(bx, discX + Math.ceil(discR * 0.55), discY - 1, discR);
      }

      // water
      bx.fillStyle = pal.water;
      bx.fillRect(0, horizonY, cols, waterEndY - horizonY);

      // the disc's reflection, breaking up as it comes toward the shore
      for (let y = horizonY + 1; y < waterEndY; y += 2) {
        const depth = (y - horizonY) / Math.max(1, waterEndY - horizonY);
        const wob = Math.round(Math.sin(y * 0.9) * (1 + depth * 3));
        const wide = Math.max(1, Math.round(4 - depth * 2));
        bx.fillStyle = mix2s(pal.water, pal.waterShine, 0.5 - depth * 0.35);
        bx.fillRect(discX - Math.floor(wide / 2) + wob, y, wide, 1);
      }

      // three ridges, far to near, each sitting on the waterline
      const ridges: Array<[string, number, number, number]> = [
        [pal.ridgeFar, 0.31, horizonY * 0.3, 0],
        [pal.ridgeMid, 0.63, horizonY * 0.21, 1],
        [pal.ridgeNear, 1.27, horizonY * 0.14, 2],
      ];
      for (const [colour, seed, amp, idx] of ridges) {
        bx.fillStyle = colour;
        const base = horizonY + idx * 1;
        for (let x = 0; x < cols; x++) {
          const h = amp * 0.9 + ridgeHeight(x, cols, seed, amp);
          const yTop = Math.round(base - h);
          bx.fillRect(x, yTop, 1, base - yTop);
        }
      }

      // shoreline + bank
      bx.fillStyle = pal.grassDark;
      bx.fillRect(0, waterEndY, cols, rows - waterEndY);
      bx.fillStyle = pal.grass;
      for (let x = 0; x < cols; x++) {
        const h = 1 + Math.round(1.6 + Math.sin(x * 0.31) * 1.4 + Math.sin(x * 0.07) * 1.2);
        bx.fillRect(x, waterEndY, 1, h);
      }

      baked = b;
    }

    function mix2(a: [number, number, number], b: [number, number, number], t: number) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ] as [number, number, number];
    }
    function mix2s(a: string, b: string, t: number) {
      return mix(hexToRgb(a), hexToRgb(b), t);
    }
    function pixelDisc(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      for (let y = -r; y <= r; y++) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
        c.fillRect(cx - half, cy + y, half * 2 + 1, 1);
      }
    }

    /* ---- layout ---- */

    function layout() {
      const rect = wrap!.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      const target =
        detail === "strip"
          ? cssW < 640
            ? 110
            : 190
          : cssW < 640
            ? 128
            : cssW < 1024
              ? 184
              : 248;
      const scale = cssW / target;
      cols = target;
      rows = Math.max(24, Math.ceil(cssH / scale));
      horizonY = Math.round(rows * horizon);
      waterEndY = Math.round(rows * Math.min(0.94, horizon + 0.13));

      canvas!.width = cols;
      canvas!.height = rows;

      const rand = mulberry32(20260624);
      clouds = [];
      const bands: Array<{ tone: 0 | 1 | 2; speed: number; y: [number, number]; n: number }> = [
        { tone: 0, speed: 0.055, y: [0.12, 0.34], n: 5 },
        { tone: 1, speed: 0.11, y: [0.3, 0.55], n: 4 },
        { tone: 2, speed: 0.2, y: [0.5, 0.78], n: 3 },
      ];
      for (const band of bands) {
        for (let i = 0; i < band.n; i++) {
          const c = buildCloud(rand, cols, band.tone);
          c.speed = band.speed;
          c.y = Math.round(horizonY * (band.y[0] + rand() * (band.y[1] - band.y[0])));
          clouds.push(c);
        }
      }

      stars = [];
      for (let i = 0; i < 70; i++) {
        stars.push({
          x: Math.floor(rand() * cols),
          y: Math.floor(rand() * horizonY),
          phase: rand() * Math.PI * 2,
        });
      }

      tufts = [];
      for (let x = 1; x < cols - 2; ) {
        if (rand() > 0.55) {
          x += 2 + Math.floor(rand() * 4);
          continue;
        }
        const w = 2 + Math.floor(rand() * 2);
        tufts.push({
          x,
          w,
          h: 3 + Math.floor(rand() * 5),
          phase: rand() * Math.PI * 2,
          dark: rand() > 0.45,
        });
        x += w + 1 + Math.floor(rand() * 3);
      }

      bird = { x: -20, y: Math.round(horizonY * 0.3), active: false, nextAt: 5000 };
      bake();
    }

    /* ---- per-frame ---- */

    function draw(t: number) {
      if (!baked) return;
      ctx!.imageSmoothingEnabled = false;
      ctx!.drawImage(baked, 0, 0);

      // twinkle
      if (pal.stars) {
        ctx!.fillStyle = pal.stars;
        for (const st of stars) {
          if (st.y >= horizonY * 0.72) continue;
          if (Math.sin(t * 0.0011 + st.phase) > 0.72) ctx!.fillRect(st.x, st.y, 1, 1);
        }
      }

      // clouds
      for (const c of clouds) {
        ctx!.fillStyle =
          c.tone === 0 ? pal.cloudFar : c.tone === 1 ? pal.cloudMid : pal.cloudNear;
        const drift = (c.x + (t / 1000) * c.speed * cols * 0.12) % (cols + 40);
        const ox = Math.round(drift) - 20;
        for (const p of c.parts) {
          ctx!.fillRect(ox + p.x, c.y + p.y, p.w, p.h);
        }
      }

      // a few glints drifting along the waterline
      ctx!.fillStyle = mix2s(pal.water, pal.waterShine, 0.34);
      for (let y = horizonY + 3; y < waterEndY - 3; y += 5) {
        const off = Math.round(Math.sin(t * 0.00035 + y * 1.7) * 9);
        for (let x = ((y * 13 + off) % 37) - 37; x < cols; x += 37) {
          if (x < 0) continue;
          ctx!.fillRect(x, y, 3, 1);
        }
      }

      // the reed bank, leaning together
      for (const g of tufts) {
        ctx!.fillStyle = g.dark ? pal.grassDark : pal.grass;
        const lean = Math.sin(t * 0.0009 + g.phase) * 1.4;
        for (let i = 0; i < g.h; i++) {
          const up = i / g.h;
          const rowW = Math.max(1, g.w - Math.floor(up * g.w));
          const bend = Math.round(lean * up * up);
          ctx!.fillRect(g.x + bend, waterEndY - 1 - i, rowW, 1);
        }
      }

      // a bird, now and then
      if (!bird.active && t > bird.nextAt) {
        bird.active = true;
        bird.x = -8;
        bird.y = Math.round(horizonY * (0.18 + Math.random() * 0.3));
      }
      if (bird.active) {
        bird.x += 0.55;
        const flap = Math.floor(t / 130) % 2;
        ctx!.fillStyle = pal.bird;
        const bx0 = Math.round(bird.x);
        if (flap === 0) {
          ctx!.fillRect(bx0, bird.y, 1, 1);
          ctx!.fillRect(bx0 + 1, bird.y + 1, 1, 1);
          ctx!.fillRect(bx0 + 2, bird.y, 1, 1);
        } else {
          ctx!.fillRect(bx0, bird.y + 1, 1, 1);
          ctx!.fillRect(bx0 + 1, bird.y, 1, 1);
          ctx!.fillRect(bx0 + 2, bird.y + 1, 1, 1);
        }
        if (bird.x > cols + 8) {
          bird.active = false;
          bird.nextAt = t + 26000 + Math.random() * 24000;
        }
      }
    }

    /* ---- boot ---- */

    const start = performance.now();

    layout();
    // Paint one frame straight away. rAF does not fire in a hidden or
    // throttled document, and an unpainted canvas is worse than a still one.
    draw(0);

    if (reduce) {
      const roStill = new ResizeObserver(() => {
        layout();
        draw(0);
      });
      roStill.observe(wrap);
      return () => roStill.disconnect();
    }

    let raf = 0;
    let last = 0;
    let visible = true;

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now - start);
    }
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
      },
      { rootMargin: "120px" }
    );
    io.observe(wrap);

    const onVisibility = () => {
      if (!document.hidden) draw(performance.now() - start);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastW = wrap.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const w = wrap.getBoundingClientRect().width;
      // ignore pure height changes: that is the mobile URL bar, not a resize
      if (Math.abs(w - lastW) < 2) return;
      lastW = w;
      layout();
      draw(performance.now() - start);
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phase, horizon, detail, onPhase]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`} aria-hidden="true">
      {/* deliberate fallback: a calm gradient, never a broken box */}
      <div className="absolute inset-0 bg-linear-to-b from-surface-2 to-ground" />
      {!failed && (
        <canvas
          ref={canvasRef}
          className="pixelated absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
