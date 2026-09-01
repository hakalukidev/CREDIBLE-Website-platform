'use client';

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
}

/**
 * Minimal SVG pie chart for 3-6 segments. Avoids the d3 dependency
 * by computing arc paths inline.
 */
export function PieChart({ data, size = 160 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {data.map((slice, i) => {
          const sliceAngle = (slice.value / total) * Math.PI * 2;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy + r * Math.sin(angle);
          angle += sliceAngle;
          const x2 = cx + r * Math.cos(angle);
          const y2 = cy + r * Math.sin(angle);
          const largeArc = sliceAngle > Math.PI ? 1 : 0;
          const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
          return <path key={i} d={d} fill={slice.color} />;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((slice, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: slice.color }}
            />
            <span>
              {slice.label}{' '}
              <span className="text-muted-foreground">
                ({Math.round((slice.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}