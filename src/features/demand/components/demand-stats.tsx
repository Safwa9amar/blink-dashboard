import { StatGrid, StatCard } from "@/components/ui";

export function DemandStats({
  t,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <StatGrid cols={5}>
      <StatCard label={t("stats.live_orders")} value={342} variant="primary" icon="package" change={t("stats.live_orders_chg")} />
      <StatCard label={t("stats.demand_index")} value="1.27" variant="warning" icon="trending" change={t("stats.demand_index_chg")} />
      <StatCard label={t("stats.unmet")} value={28} variant="danger" icon="fire" change={t("stats.unmet_chg")} />
      <StatCard label={t("stats.online_riders")} value={214} variant="info" icon="bike" change={t("stats.online_riders_chg")} />
      <StatCard label={t("stats.avg_wait")} value="6.4m" variant="success" icon="clock" change={t("stats.avg_wait_chg")} />
    </StatGrid>
  );
}
