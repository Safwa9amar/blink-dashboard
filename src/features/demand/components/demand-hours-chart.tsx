"use client";

import { useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CHART, ChartHead, Legend } from "@/components/ui";
import type { HourBucket } from "../types";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text)",
};

export function DemandHoursChart({ hours, total }: { hours: HourBucket[]; total: number }) {
  const t = useTranslations("demand");
  const names = {
    delivered: t("charts.delivered"),
    failed: t("charts.failed"),
    active: t("charts.active"),
    medianWait: t("charts.median_wait"),
  };
  const data = hours.map((h) => ({
    label: String(h.hour),
    delivered: h.delivered,
    failed: h.failed,
    active: h.active,
    medianWait: h.medianWait == null ? null : Math.round(h.medianWait * 10) / 10,
  }));
  return (
    <Card>
      <ChartHead
        title={t("charts.by_hour")}
        description={t("charts.by_hour_desc")}
        right={
          <Legend
            items={[
              { label: names.delivered, color: CHART.success },
              { label: names.failed, color: CHART.danger },
              { label: names.active, color: CHART.info },
              { label: names.medianWait, color: CHART.warning },
            ]}
          />
        }
      />
      {total === 0 ? (
        <p className="text-sm text-subtext py-12 text-center">{t("empty")}</p>
      ) : (
        <div dir="ltr" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--subtext)" }} interval={1} tickLine={false} />
              <YAxis yAxisId="n" allowDecimals={false} tick={{ fontSize: 10, fill: "var(--subtext)" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="m" orientation="right" tick={{ fontSize: 10, fill: "var(--subtext)" }} tickLine={false} axisLine={false} unit="m" />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `${l}:00`} />
              <Bar yAxisId="n" dataKey="delivered" name={names.delivered} stackId="o" fill={CHART.success} />
              <Bar yAxisId="n" dataKey="failed" name={names.failed} stackId="o" fill={CHART.danger} />
              <Bar yAxisId="n" dataKey="active" name={names.active} stackId="o" fill={CHART.info} radius={[3, 3, 0, 0]} />
              <Line yAxisId="m" type="monotone" dataKey="medianWait" name={names.medianWait} stroke={CHART.warning} strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
