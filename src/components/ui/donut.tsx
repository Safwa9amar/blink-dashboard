"use client";

import type { ReactNode } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { CHART_COLORS } from "./chart-theme";

export interface DonutSegment {
  name: string;
  pct: number;
  /** Optional — falls back to the design-system chart palette. */
  color?: string;
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text)",
  boxShadow: "0 4px 14px -3px rgba(0,0,0,0.2)",
};

export function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 150,
}: {
  segments: DonutSegment[];
  centerValue: ReactNode;
  centerLabel: string;
  size?: number;
}) {
  const inner = Math.round(size * 0.34);
  const outer = Math.round(size * 0.5);

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={segments}
            dataKey="pct"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            paddingAngle={segments.length > 1 ? 1.5 : 0}
          >
            {segments.map((s, i) => (
              <Cell key={s.name} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value}%`, name]} />
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <b className="text-[22px] font-extrabold text-text">{centerValue}</b>
          <span className="text-[10px] text-subtext uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {segments.map((s, i) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <span
              className="w-[11px] h-[11px] rounded-[3px] shrink-0"
              style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-[13px] text-text font-medium flex-1">{s.name}</span>
            <span className="text-[13px] font-bold text-text">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
