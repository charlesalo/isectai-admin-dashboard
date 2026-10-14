// A tiny inline trend line. Decorative: the numbers it shows are in the card text.
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const width = 88;
  const height = 32;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, i) => [i * step, height - 3 - (value / max) * (height - 6)] as const);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1] ?? [0, height];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
      focusable="false"
    >
      <polygon points={`0,${height} ${line} ${width},${height}`} className="fill-primary/10" />
      <polyline
        points={line}
        fill="none"
        className="stroke-primary"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} className="fill-primary" />
    </svg>
  );
}
