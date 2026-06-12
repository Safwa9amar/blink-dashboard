"use client";

import { StatGrid, StatCard } from "@/components/ui";
import { SEED_SUGGESTIONS, derivePricingStats, type TFn } from "../data";

export function PricingStats({ t }: { t: TFn }) {
  const stats = derivePricingStats(SEED_SUGGESTIONS);
  return (
    <StatGrid>
      <StatCard label={t("stats.pending")} value={stats.pending} icon="clock" change={t("stats.pending_desc")} />
      <StatCard label={t("stats.accepted")} value={stats.accepted} icon="check" change={t("stats.accepted_desc")} variant="success" />
      <StatCard label={t("stats.rejected")} value={stats.rejected} icon="x" change={t("stats.rejected_desc")} variant="danger" />
      <StatCard label={t("stats.avg_deviation")} value={`${stats.avgDeviation}%`} icon="trending" change={t("stats.avg_deviation_desc")} />
    </StatGrid>
  );
}
