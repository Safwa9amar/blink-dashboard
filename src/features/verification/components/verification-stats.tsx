"use client";

import { useTranslations } from "next-intl";
import { StatGrid, StatCard } from "@/components/ui";

export function VerificationStats() {
  const t = useTranslations("verification");

  return (
    <StatGrid cols={4}>
      <StatCard label={t("stats.pending")} value={31} variant="warning" icon="shield" change={t("stats.pending_chg")} />
      <StatCard label={t("stats.approved")} value={54} variant="success" icon="trending" change={t("stats.approved_chg")} />
      <StatCard label={t("stats.rejected")} value={7} variant="danger" icon="fire" change={t("stats.rejected_chg")} />
      <StatCard label={t("stats.avg_time")} value="3.2h" variant="info" icon="clock" change={t("stats.avg_time_chg")} />
    </StatGrid>
  );
}
