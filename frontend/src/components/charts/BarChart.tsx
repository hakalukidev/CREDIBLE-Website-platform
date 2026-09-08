'use client';

import { useMemo } from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showLabels?: boolean;
}

/** Lightweight horizontal or vertical bar chart for dashboard KPIs. */
export function BarChart({ data, height = 160, showLabels = true }: BarChartProps) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 8);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[10px] font-medium text-muted-foreground">{d.value}</div>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(2, h)}px`,
                  background: d.color ?? '#1a56db',
                }}
                title={`${d.label}: ${d.value}`}
              />
              {showLabels && (
                <div className="text-[10px] text-muted-foreground">{d.label}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}