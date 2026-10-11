import { StatCard, StatGrid } from "@/components/ui";
import type { QueueCounts, TFn } from "../types";

// Headline counts for the review queue — exact totals from the server, not
// tallies of the (capped) loaded lists (documents to verify: counted over the
// live stores' document columns). Riders and agents add theirs with their tabs.
export function VerificationStats({ t, counts }: { t: TFn; counts: QueueCounts }) {
  return (
    <StatGrid cols={5}>
      <StatCard label={t("stats.stores")} value={counts.stores} variant="warning" icon="store" change={t("stats.stores_chg")} />
      <StatCard
        label={t("stats.stores_resubmitted")}
        value={counts.storesResubmitted}
        variant="info"
        icon="undo"
        change={t("stats.stores_resubmitted_chg")}
      />
      <StatCard
        label={t("stats.stores_documents")}
        value={counts.storesDocuments}
        variant="warning"
        icon="shield"
        change={t("stats.stores_documents_chg")}
      />
      <StatCard
        label={t("stats.stores_rejected")}
        value={counts.storesRejected}
        variant="danger"
        icon="warn"
        change={t("stats.stores_rejected_chg")}
      />
      <StatCard
        label={t("stats.stores_live")}
        value={counts.storesLive}
        variant="success"
        icon="check"
        change={t("stats.stores_live_chg")}
      />
    </StatGrid>
  );
}
