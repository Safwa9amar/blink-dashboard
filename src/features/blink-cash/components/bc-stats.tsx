import { Suspense, use } from "react";
import { StatGrid, StatCard } from "@/components/ui";
import { formatDA } from "../data";
import type { DuesHeadline, TFn } from "../types";

/**
 * Merchant dues outstanding — real, from the same blink-server report as the Dues
 * tab. Streamed in (the page hands over a promise) so a slow report never holds
 * up the rest of the Overview; "—" when it couldn't load.
 */
function DuesStat({ t, dues }: { t: TFn; dues: Promise<DuesHeadline | null> }) {
  const headline = use(dues);
  return (
    <StatCard
      label={t("stats.dues")}
      value={headline ? formatDA(headline.totalOutstanding) : "—"}
      variant="warning"
      icon="dollar"
      change={headline ? t("stats.dues_chg", { n: headline.storesOwing }) : t("stats.dues_unavailable")}
    />
  );
}

export function BCStats({ t, dues }: { t: TFn; dues?: Promise<DuesHeadline | null> }) {
  const duesPlaceholder = (
    <StatCard
      label={t("stats.dues")}
      value="—"
      variant="warning"
      icon="dollar"
      change={dues ? t("stats.dues_loading") : t("stats.dues_unavailable")}
    />
  );
  return (
    <StatGrid cols={5}>
      <StatCard label={t("stats.circulation")} value="8.4M DA" variant="primary" icon="wallet" change={t("stats.circulation_chg")} />
      <StatCard label={t("stats.deposits")} value="1.9M DA" variant="success" icon="trending" change={t("stats.deposits_chg")} />
      <StatCard label={t("stats.withdrawals")} value="1.2M DA" variant="info" icon="bank" change={t("stats.withdrawals_chg")} />
      {dues ? (
        <Suspense fallback={duesPlaceholder}>
          <DuesStat t={t} dues={dues} />
        </Suspense>
      ) : (
        duesPlaceholder
      )}
      <StatCard label={t("stats.float")} value="640K DA" variant="danger" icon="store" change={t("stats.float_chg")} />
    </StatGrid>
  );
}
