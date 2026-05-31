import { StatGrid, StatCard } from "@/components/ui";
import type { TFn } from "../types";

export function BCStats({ t }: { t: TFn }) {
  return (
    <StatGrid cols={5}>
      <StatCard label={t("stats.circulation")} value="8.4M DA" variant="primary" icon="wallet" change={t("stats.circulation_chg")} />
      <StatCard label={t("stats.deposits")} value="1.9M DA" variant="success" icon="trending" change={t("stats.deposits_chg")} />
      <StatCard label={t("stats.withdrawals")} value="1.2M DA" variant="info" icon="bank" change={t("stats.withdrawals_chg")} />
      <StatCard label={t("stats.dues")} value="212K DA" variant="warning" icon="dollar" change={t("stats.dues_chg")} />
      <StatCard label={t("stats.float")} value="640K DA" variant="danger" icon="store" change={t("stats.float_chg")} />
    </StatGrid>
  );
}
