"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CHART, ChartHead, Donut } from "@/components/ui";
import type { MixSlice, OrderType } from "../types";

const COLORS: Record<OrderType, string> = {
  merchant: CHART.primary,
  shopper: CHART.info,
  courier: CHART.warning,
  ride: CHART.success,
};

export function ServiceMixChart({ mix, total }: { mix: MixSlice[]; total: number }) {
  const t = useTranslations("demand");
  const locale = useLocale();
  const sum = mix.reduce((a, m) => a + m.count, 0);
  return (
    <Card>
      <ChartHead title={t("charts.service_mix")} description={t("charts.service_mix_desc")} />
      {sum === 0 ? (
        <p className="text-sm text-subtext py-12 text-center">{t("empty")}</p>
      ) : (
        <Donut
          segments={mix.map((m) => ({
            name: t(`types.${m.type}`),
            pct: Math.round((m.count / sum) * 100),
            color: COLORS[m.type],
          }))}
          centerValue={total.toLocaleString(locale)}
          centerLabel={t("charts.orders")}
        />
      )}
    </Card>
  );
}
