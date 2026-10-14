"use client";

import { useTranslations } from "next-intl";
import { ColumnChart, CHART, Legend } from "@/components/ui";
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

/** Per-day column chart over `promotion_daily` rows. `names` = tooltip + legend series names. */
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
  const t = useTranslations("promotions");
  const data = days.map((d) => ({ label: d.day.slice(5), values: PICK[series](d) }));
  const peak = Math.max(0, ...data.flatMap((d) => d.values));
  if (peak === 0) {
    return (
      <div className="flex items-center justify-center text-center text-sm text-subtext px-4" style={{ height }}>
        {series === "traffic" ? t("chart.no_views") : t("chart.no_data")}
      </div>
    );
  }
  const max = Math.max(1, peak) * 1.1;
  return (
    <>
      {names.length > 1 && (
        <div className="mb-2">
          <Legend items={names.map((label, i) => ({ label, color: COLORS[series][i] }))} />
        </div>
      )}
      <ColumnChart
        data={data}
        max={max}
        colors={COLORS[series]}
        height={height}
        labelInterval={Math.max(0, Math.ceil(data.length / 8) - 1)}
        seriesNames={names}
      />
    </>
  );
}
