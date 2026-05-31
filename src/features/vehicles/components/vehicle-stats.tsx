"use client";

import { StatGrid, StatCard } from "@/components/ui";
import { deriveStats, type TFn } from "../data";
import { useVehiclesStore } from "../store";

export function VehicleStats({ t }: { t: TFn }) {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const stats = deriveStats(vehicles);

  return (
    <StatGrid cols={4}>
      <StatCard
        label={t("stats.total")}
        value={stats.totalVehicles}
        variant="primary"
        icon="bike"
        change={t("stats.total_chg", { motos: stats.motorcycles, bikes: stats.bicycles })}
      />
      <StatCard
        label={t("stats.compliant")}
        value={stats.fullyCompliant}
        variant="success"
        icon="shield"
        change={t("stats.compliant_chg")}
      />
      <StatCard
        label={t("stats.pending_review")}
        value={stats.pendingReview}
        variant={stats.pendingReview ? "warning" : "success"}
        icon="clock"
        change={t("stats.pending_review_chg")}
      />
      <StatCard
        label={t("stats.needs_attention")}
        value={stats.needsAttention}
        variant={stats.needsAttention ? "danger" : "success"}
        icon="warn"
        change={t("stats.needs_attention_chg")}
      />
    </StatGrid>
  );
}
