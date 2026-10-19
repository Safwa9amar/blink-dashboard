import Link from "next/link";
import { Suspense, use } from "react";
import { Badge, Card, ChartHead, DataTable, Skeleton, StatCard } from "@/components/ui";
import { type AttentionItem } from "../lib/attention";
import { type BlinkCashSettings } from "../lib/settings";
import type { OpsCounts } from "../ops-types";
import { BCStats } from "./bc-stats";
import { CashFlowChart } from "./cash-flow-chart";
import { ConfigRow } from "./config-row";
import { ledgerColumns } from "./ledger-columns";
import { MigrationNotice } from "./ops-shared";
import { formatDA } from "../data";
import type { CashDays, DuesHeadline, LedgerRow, SummaryResult, TFn } from "../types";

/** Counts from the database: pending agent ops, review queue, frozen wallets ("—" when unreadable). */
function CountCards({ t, counts }: { t: TFn; counts: Promise<OpsCounts> }) {
  const c = use(counts);
  const v = (n: number | null) => (n === null ? "—" : n);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <StatCard label={t("stats.pending_ops")} value={v(c.pendingOps)} variant="warning" icon="clock" change={t("stats.pending_ops_chg")} />
      <StatCard label={t("stats.review")} value={v(c.review)} variant="info" icon="eye" change={t("stats.review_chg")} />
      <StatCard label={t("stats.frozen")} value={v(c.frozen)} variant="danger" icon="lock" change={t("stats.frozen_chg")} />
    </div>
  );
}

function AttentionList({ t, items }: { t: TFn; items: Promise<AttentionItem[] | null> }) {
  const list = use(items);
  if (list === null) return <p className="text-sm text-subtext py-4">{t("attention.unavailable")}</p>;
  if (list.length === 0) return <p className="text-sm text-success py-4">{t("attention.clear")}</p>;
  return (
    <ul className="divide-y divide-border">
      {list.map((a) => (
        <li key={a.key}>
          <Link href={a.href} className="flex items-center justify-between gap-3 py-2.5 text-[13px] hover:text-primary">
            <span className="text-text">{t(`attention.${a.key}`, { n: a.count })}</span>
            <Badge variant={a.tone}>{a.count}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Fee & limit rows read from blink_cash_settings — nothing is hard-coded here. */
function FeeCard({ t, settings, migrationPending }: { t: TFn; settings: BlinkCashSettings | null; migrationPending?: boolean }) {
  return (
    <Card>
      <ChartHead title={t("cfg.title")} description={t("cfg.desc")} />
      {settings ? (
        <>
          {/* Charged at Pricing & Fees' blink_cash_fee_rate, not these stored rates. */}
          <ConfigRow k={t("cfg.deposit_fee")} v={t("cfg.fee_in_pricing")} first />
          <ConfigRow k={t("cfg.withdrawal_fee")} v={t("cfg.fee_in_pricing")} />
          <ConfigRow k={t("cfg.min_max")} v={`${formatDA(settings.min_amount)} – ${formatDA(settings.max_amount)}`} />
          <ConfigRow k={t("cfg.daily")} v={`${formatDA(settings.daily_deposit_limit)} / ${formatDA(settings.daily_withdrawal_limit)}`} />
          <ConfigRow k={t("cfg.monthly")} v={`${formatDA(settings.monthly_deposit_limit)} / ${formatDA(settings.monthly_withdrawal_limit)}`} />
          <ConfigRow k={t("cfg.expiry")} v={t("cfg.minutes", { n: settings.pending_expiry_minutes })} />
          <ConfigRow k={t("cfg.agent_limit")} v={formatDA(settings.agent_credit_limit)} />
          <ConfigRow
            k={t("cfg.pin")}
            v={<span className={settings.require_pin_for_withdrawal ? "text-success" : "text-subtext"}>{settings.require_pin_for_withdrawal ? t("cfg.enforced") : t("cfg.off")}</span>}
          />
          <ConfigRow
            k={t("cfg.electronic")}
            v={<span className={settings.electronic_enabled ? "text-success" : "text-subtext"}>{settings.electronic_enabled ? t("cfg.on") : t("cfg.off")}</span>}
          />
          <p className="text-xs mt-3">
            <Link href="/blink-cash/settings" className="text-primary hover:underline">
              {t("cfg.edit")}
            </Link>
          </p>
        </>
      ) : migrationPending ? (
        <MigrationNotice t={t} />
      ) : (
        <p className="text-sm text-subtext">{t("cfg.unavailable")}</p>
      )}
    </Card>
  );
}

export function Overview({
  t,
  latest,
  error,
  dues,
  cash,
  days = 30,
  counts,
  attention,
  settings,
  settingsPending,
}: {
  t: TFn;
  latest: LedgerRow[];
  error?: string;
  dues?: Promise<DuesHeadline | null>;
  cash?: Promise<SummaryResult>;
  days?: CashDays;
  counts: Promise<OpsCounts>;
  attention: Promise<AttentionItem[] | null>;
  settings: BlinkCashSettings | null;
  settingsPending?: boolean;
}) {
  return (
    <>
      <BCStats t={t} dues={dues} cash={cash} days={days} />
      <Suspense fallback={<Skeleton className="h-[88px] w-full rounded-xl mb-6" />}>
        <CountCards t={t} counts={counts} />
      </Suspense>
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
        <CashFlowChart t={t} cash={cash} days={days} />
        <div className="flex flex-col gap-5">
          <Card title={t("attention.title")} description={t("attention.desc")}>
            <Suspense fallback={<Skeleton className="h-16 w-full rounded-lg" />}>
              <AttentionList t={t} items={attention} />
            </Suspense>
            <p className="text-xs mt-2">
              <Link href="/blink-cash/reconciliation" className="text-primary hover:underline">
                {t("attention.reconciliation")}
              </Link>
            </p>
          </Card>
          <FeeCard t={t} settings={settings} migrationPending={settingsPending} />
        </div>
      </div>
      <Card title={t("latest.title")} description={t("latest.desc")}>
        <DataTable
          columns={ledgerColumns(t)}
          data={latest}
          error={error}
          empty={t("ledger.empty")}
          enablePagination={false}
          enableSorting={false}
          rowHref={(r) => `/blink-cash/ledger/${r.id}`}
        />
      </Card>
    </>
  );
}

