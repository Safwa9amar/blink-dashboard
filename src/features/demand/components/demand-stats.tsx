"use client";

import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "@/components/ui";
import { fmtMin, fmtPct } from "../format";
import type { DemandKpis } from "../types";

export function DemandStats({ kpis }: { kpis: DemandKpis }) {
  const t = useTranslations("demand");
  const locale = useLocale();
  const min = (m: number | null) => {
    const v = fmtMin(m);
    return v == null ? "—" : t("min", { n: v });
  };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
      <StatCard label={t("stats.orders")} value={kpis.orders.toLocaleString(locale)} variant="primary" icon="package" />
      <StatCard
        label={t("stats.completion")}
        value={fmtPct(kpis.completionRate, locale)}
        variant="success"
        icon="activity"
        change={t("stats.completion_sub", { n: kpis.finished.toLocaleString(locale) })}
      />
      <StatCard
        label={t("stats.unmet")}
        value={kpis.unmet.toLocaleString(locale)}
        variant="danger"
        icon="fire"
        change={t("stats.unmet_sub", { pct: fmtPct(kpis.unmetRate, locale) })}
      />
      <StatCard label={t("stats.wait")} value={min(kpis.medianWait)} variant="warning" icon="clock" />
      <StatCard label={t("stats.delivery")} value={min(kpis.medianDelivery)} variant="info" icon="bike" />
    </div>
  );
}
