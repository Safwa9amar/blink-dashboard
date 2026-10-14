"use client";

import { ColumnChart, CHART } from "@/components/ui";
import type { PromotionDay } from "../types";

type Series = "traffic" | "coupons" | "discount";

const PICK: Record<Series, (d: PromotionDay) => number[]> = {
  traffic: (d) => [d.views, d.taps],
  coupons: (d) => [d.issued, d.used],
  discount: (d) => [d.discount_given],
};
const COLORS: Record<Series, string[]> = {
  traffic: [CHART.info, CHART.primary],
  coupons: [CHART.primary, CHART.success],
  discount: [CHART.warning],
};

/** Per-day column chart over `promotion_daily` rows. `names` = tooltip series names. */
export function DailyChart({
  days,
  series,
  names,
  height = 170,
}: {
  days: PromotionDay[];
  series: Series;
  names: string[];
  height?: number;
}) {
  const data = days.map((d) => ({ label: d.day.slice(5), values: PICK[series](d) }));
  const max = Math.max(1, ...data.flatMap((d) => d.values)) * 1.1;
  return (
    <ColumnChart
      data={data}
      max={max}
      colors={COLORS[series]}
      height={height}
      labelInterval={Math.max(0, Math.ceil(data.length / 8) - 1)}
      seriesNames={names}
    />
  );
}
