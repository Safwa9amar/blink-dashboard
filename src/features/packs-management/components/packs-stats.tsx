"use client";

import { StatGrid, StatCard } from "@/components/ui";
import { type TFn, type Pack, derivePackStats } from "../data";

export function PacksStats({ t, packs }: { t: TFn; packs: Pack[] }) {
  const stats = derivePackStats(packs);
  return (
    <StatGrid>
      <StatCard label={t("stats.total")} value={stats.total} icon="package" change={t("stats.total_desc")} />
      <StatCard label={t("stats.active")} value={stats.active} icon="check" change={t("stats.active_desc")} variant="success" />
      <StatCard label={t("stats.reviewing")} value={stats.reviewing} icon="clock" change={t("stats.reviewing_desc")} variant="warning" />
      <StatCard label={t("stats.free_delivery")} value={stats.freeDelivery} icon="truck" change={t("stats.free_delivery_desc")} />
    </StatGrid>
  );
}
