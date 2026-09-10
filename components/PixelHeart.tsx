/** A 9x8 pixel heart. Explicit geometry so it cannot collapse inside a button. */
const ROWS: Array<[number, number][]> = [
  [[1, 2], [6, 2]],
  [[0, 9]],
  [[0, 9]],
  [[0, 9]],
  [[1, 7]],
  [[2, 5]],
  [[3, 3]],
  [[4, 1]],
];

export default function PixelHeart({
  size = 22,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 9 8"
      width={size}
      height={Math.round((size / 9) * 8)}
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {ROWS.map((spans, y) =>
        spans.map(([x, w]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} />
        ))
      )}
    </svg>
  );
}
