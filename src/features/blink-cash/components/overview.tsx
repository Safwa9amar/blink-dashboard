import { Card, ChartHead, DataTable } from "@/components/ui";
import type { BlinkTransaction } from "../data";
import { BCStats } from "./bc-stats";
import { CashFlowChart } from "./cash-flow-chart";
import { ConfigRow } from "./config-row";
import { ledgerColumns } from "./ledger-columns";
import type { CashDays, DuesHeadline, SummaryResult, TFn } from "../types";

export function Overview({
  t,
  txns,
  error,
  dues,
  cash,
  days = 30,
}: {
  t: TFn;
  txns: BlinkTransaction[] | null;
  error?: string;
  /** Merchant dues headline, streamed from the page (see BCStats). */
  dues?: Promise<DuesHeadline | null>;
  /** Blink Cash report for `days`, streamed from the page. */
  cash?: Promise<SummaryResult>;
  days?: CashDays;
}) {
  return (
    <>
      <BCStats t={t} dues={dues} cash={cash} days={days} />
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
        <CashFlowChart t={t} cash={cash} days={days} />
        <Card>
          <ChartHead title={t("cfg.title")} description={t("cfg.desc")} />
          {/* blink-server's rules: transactions/{deposit,withdrawal}.ts, lib/agent-finance.ts, lib/cash-jobs.ts */}
          <ConfigRow k={t("cfg.deposit_agent")} v="2%" first />
          <ConfigRow k={t("cfg.withdrawal")} v="2%" />
          <ConfigRow k={t("cfg.platform_share")} v="20%" />
          <ConfigRow k={t("cfg.agent_tax")} v="1%" />
          <ConfigRow k={t("cfg.dues_fee")} v="0.2%" />
          <ConfigRow k={t("cfg.trip_commission")} v="15%" />
          <ConfigRow k={t("cfg.pin")} v={<span className="text-success">{t("cfg.enforced")}</span>} />
        </Card>
      </div>
      <Card title={t("latest.title")} description={t("latest.desc")}>
        <DataTable
          columns={ledgerColumns(t)}
          data={(txns ?? []).slice(0, 5)}
          error={error}
          empty={t("ledger.empty")}
          enablePagination={false}
        />
      </Card>
    </>
  );
}
