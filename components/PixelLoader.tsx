/** Eight pixels chasing round a ring. Small, cheap, unmistakably a loader. */
const RING: [number, number][] = [
  [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1],
];

export default function PixelLoader({
  size = 21,
  label = "Loading",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} role="status">
      <svg
        viewBox="0 0 3 3"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
        fill="currentColor"
      >
        {RING.map(([x, y], i) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            className="chase"
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
