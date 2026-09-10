/** A 9x8 pixel speech bubble. Explicit geometry, so it cannot collapse in a button. */
const ROWS: Array<[number, number][]> = [
  [[0, 7]],
  [[0, 1], [6, 1]],
  [[0, 1], [6, 1]],
  [[0, 1], [6, 1]],
  [[0, 1], [6, 1]],
  [[0, 7]],
  [[2, 2]],
  [[1, 2]],
];

export default function PixelBubble({
  size = 20,
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
