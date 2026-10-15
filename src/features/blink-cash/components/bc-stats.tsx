import { Fragment, Suspense, use, type ReactNode } from "react";
import { StatCard } from "@/components/ui";
import { formatDA } from "../data";
import type { BlinkCashSummary, CashDays, DuesHeadline, SummaryResult, TFn } from "../types";

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

/** One stat fed by the streamed Blink Cash report; `render(null)` is the "Report unavailable" card. */
function ReportStat({
  cash,
  render,
}: {
  cash: Promise<SummaryResult>;
  render: (s: BlinkCashSummary | null) => ReactNode;
}) {
  return <>{render(use(cash).summary)}</>;
}

export function BCStats({
  t,
  dues,
  cash,
  days = 30,
}: {
  t: TFn;
  dues?: Promise<DuesHeadline | null>;
  cash?: Promise<SummaryResult>;
  days?: CashDays;
}) {
  const duesPlaceholder = (
    <StatCard
      label={t("stats.dues")}
      value="—"
      variant="warning"
      icon="dollar"
      change={dues ? t("stats.dues_loading") : t("stats.dues_unavailable")}
    />
  );

  // Each stat suspends on its own copy of the (cached) promise, with a "—" placeholder.
  const stat = (
    key: string,
    label: string,
    variant: "primary" | "success" | "info" | "danger",
    icon: string,
    from: (s: BlinkCashSummary) => { value: string; change: string }
  ) => {
    const card = (value: string, change: string) => (
      <StatCard label={label} value={value} variant={variant} icon={icon} change={change} />
    );
    if (!cash) return <Fragment key={key}>{card("—", t("stats.report_unavailable"))}</Fragment>;
    return (
      <Suspense key={key} fallback={card("—", t("stats.report_loading"))}>
        <ReportStat
          cash={cash}
          render={(s) => {
            if (!s) return card("—", t("stats.report_unavailable"));
            const r = from(s);
            return card(r.value, r.change);
          }}
        />
      </Suspense>
    );
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
      {stat("circulation", t("stats.circulation"), "primary", "wallet", (s) => ({
        value: formatDA(s.circulation.total),
        change: t("stats.circulation_chg", {
          wallets: s.circulation.wallets,
          pending: formatDA(s.circulation.pendingWithdrawals),
        }),
      }))}
      {stat("deposits", t("stats.deposits"), "success", "trending", (s) => ({
        value: formatDA(s.deposits.amount),
        change: t("stats.deposits_chg", { n: s.deposits.count, days }),
      }))}
      {stat("withdrawals", t("stats.withdrawals"), "info", "bank", (s) => ({
        value: formatDA(s.withdrawals.amount),
        change: t("stats.withdrawals_chg", { n: s.withdrawals.count, days }),
      }))}
      {dues ? (
        <Suspense fallback={duesPlaceholder}>
          <DuesStat t={t} dues={dues} />
        </Suspense>
      ) : (
        duesPlaceholder
      )}
      {stat("agent_cash", t("stats.agent_cash"), "danger", "store", (s) => ({
        value: formatDA(s.agentCash.owedToBlink),
        change: t("stats.agent_cash_chg", { n: s.agentCash.agentsOwing }),
      }))}
    </div>
  );
}
