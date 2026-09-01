'use client';

import { useMemo } from 'react';

interface LineChartProps {
  data: Array<{ date: string; count: number }>;
  height?: number;
  color?: string;
  label?: string;
}

/**
 * Tiny, dependency-free line chart that renders inline SVG.
 * Used for trend visualizations where installing chart.js would be overkill.
 */
export function LineChart({ data, height = 160, color = '#1a56db', label }: LineChartProps) {
  const path = useMemo(() => {
    if (!data.length) return { line: '', area: '', points: [] as Array<{ x: number; y: number }> };
    const width = 100; // percent
    const pad = 4;
    const max = Math.max(1, ...data.map((d) => d.count));
    const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      x: pad + i * stepX,
      y: 100 - pad - (d.count / max) * (100 - pad * 2),
      value: d.count,
    }));
    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
    const area =
      line +
      ` L${points[points.length - 1].x.toFixed(2)},100 L${points[0].x.toFixed(2)},100 Z`;
    return { line, area, points };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={label ?? 'Line chart'}
      >
        <path d={path.area} fill={color} fillOpacity={0.1} />
        <path d={path.line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {path.points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={0.8}
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0].date.slice(5)}</span>
        <span>{data[data.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}
