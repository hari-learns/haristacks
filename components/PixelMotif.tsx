import type { Category } from "@/lib/categories";

/**
 * 16x16 pixel motifs, drawn as SVG rects.
 *
 * Deliberately SVG with an explicit viewBox and width/height rather than
 * styled spans: elements with intrinsic geometry cannot collapse inside a
 * flex button on iOS Safari.
 *
 *   a = accent   b = accent, dimmed   c = ink, dimmed
 */
const GRIDS: Record<Category["motif"], string[]> = {
  // a seedling, two leaves out
  fern: [
    "................",
    "................",
    "....aa....aa....",
    "...aaaa..aaaa...",
    "..aaaaa..aaaaa..",
    "..aaaa....aaaa..",
    "...aa..bb..aa...",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    "......bbb.......",
    "......cccc......",
    ".....cccccc.....",
    "................",
    "................",
  ],
  // a terminal with a couple of lines in it
  terminal: [
    "................",
    "................",
    "..aaaaaaaaaaaa..",
    "..a..........a..",
    "..a.bb.......a..",
    "..a..........a..",
    "..a..bbbb....a..",
    "..a..........a..",
    "..a.bb.......a..",
    "..a..........a..",
    "..aaaaaaaaaaaa..",
    "......aaaa......",
    "......aaaa......",
    "....cccccccc....",
    "................",
    "................",
  ],
  // floodlight over a ball
  floodlight: [
    "................",
    "..aaaaa.........",
    ".aaaaaaa........",
    "..bbbbb.........",
    "....b...........",
    "....b...........",
    "....b...........",
    "....b.....aaa...",
    "....b....abbba..",
    "....b...ab.b.ba.",
    "....b...ab...ba.",
    "....b...abb.bba.",
    "....b....abbba..",
    "...ccc....aaa...",
    "..ccccc.........",
    "................",
  ],
  // two people, one turned to the other
  figures: [
    "................",
    "...aaa....bbb...",
    "..aaaaa..bbbbb..",
    "..aaaaa..bbbbb..",
    "...aaa....bbb...",
    "....a......b....",
    "..aaaaa..bbbbb..",
    ".aaaaaa.bbbbbb..",
    ".a.aaa...bbb.b..",
    "...aaa...bbb....",
    "...aaa...bbb....",
    "...a.a...b.b....",
    "...a.a...b.b....",
    "...a.a...b.b....",
    "..cc.cc.cc.cc...",
    "................",
  ],
  // a campfire with a moth above it
  campfire: [
    "................",
    "............b...",
    "...........bab..",
    "............b...",
    "................",
    ".......a........",
    "......aa........",
    "......aba.......",
    ".....aabaa......",
    ".....ababa......",
    "....aabbbaa.....",
    "....aaabaaa.....",
    "................",
    "..cc.ccccc.cc...",
    "...cccccccc.....",
    "................",
  ],
};

export default function PixelMotif({
  motif,
  size = 96,
  className = "",
}: {
  motif: Category["motif"];
  size?: number;
  className?: string;
}) {
  const grid = GRIDS[motif];
  const cells: Array<{ x: number; y: number; k: string }> = [];
  grid.forEach((row, y) => {
    row.split("").forEach((k, x) => {
      if (k !== ".") cells.push({ x, y, k });
    });
  });

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x}
          y={c.y}
          width={1}
          height={1}
          fill={
            c.k === "a"
              ? "var(--accent)"
              : c.k === "b"
                ? "var(--accent-ink)"
                : "var(--faint)"
          }
          opacity={c.k === "b" ? 0.7 : 1}
        />
      ))}
    </svg>
  );
}
