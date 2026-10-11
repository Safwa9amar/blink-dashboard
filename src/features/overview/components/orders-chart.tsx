"use client";

import { useTranslations } from "next-intl";
import { Card, ColumnChart, Legend, CHART } from "@/components/ui";
import type { DayPoint } from "../types";

export function OrdersChart({ points }: { points: DayPoint[] }) {
  const t = useTranslations("overview");
  const max = Math.max(1, ...points.map((p) => Math.max(p.delivered, p.failed)));
  const data = points.map((p) => ({ label: p.day.slice(8), values: [p.delivered, p.failed] }));
  return (
    <Card
      title={t("chart.title")}
      description={t("chart.description")}
      action={<Legend items={[{ label: t("chart.delivered"), color: CHART.success }, { label: t("chart.failed"), color: CHART.danger }]} />}
    >
      <div dir="ltr">
        <ColumnChart data={data} max={max} colors={[CHART.success, CHART.danger]} height={200} />
      </div>
    </Card>
  );
}
