"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { CHART_COLORS } from "./chart-theme";

export interface ColumnDatum {
  label: string;
  values: number[];
}

interface PeakLabelProps {
  x?: number;
  y?: number;
  width?: number;
  index?: number;
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text)",
  boxShadow: "0 4px 14px -3px rgba(0,0,0,0.2)",
};

// Column chart: each datum renders one or more bars side-by-side. Heights scale to `max`.
export function ColumnChart({
  data,
  max,
  colors,
  height = 180,
  peakIndex,
  peakLabel = "Peak",
}: {
  data: ColumnDatum[];
  max: number;
  /** Optional — falls back to the design-system chart palette. */
  colors?: string[];
  height?: number;
  peakIndex?: number;
  peakLabel?: string;
}) {
  const palette = colors ?? CHART_COLORS;
  const seriesCount = data[0]?.values.length ?? 1;
  const rows = data.map((d) => {
    const row: Record<string, number | string> = { label: d.label };
    d.values.forEach((v, j) => {
      row[`v${j}`] = v;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 16, right: 4, left: 4, bottom: 0 }} barGap={3} barCategoryGap="22%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "var(--subtext)" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis hide domain={[0, max]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        {Array.from({ length: seriesCount }).map((_, j) => (
          <Bar key={j} dataKey={`v${j}`} fill={palette[j] ?? palette[0]} radius={[3, 3, 0, 0]}>
            {j === 0 && peakIndex != null && (
              <LabelList
                dataKey={`v${j}`}
                content={(props) => {
                  const p = props as unknown as PeakLabelProps;
                  if (p.index !== peakIndex || p.x == null || p.y == null || p.width == null) return null;
                  return (
                    <text
                      x={p.x + p.width / 2}
                      y={p.y - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill="var(--primary)"
                    >
                      {peakLabel}
                    </text>
                  );
                }}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
