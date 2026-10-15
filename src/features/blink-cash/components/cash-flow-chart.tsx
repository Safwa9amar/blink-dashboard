"use client";

import { Suspense, use, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, ChartHead, ColumnChart, Legend, Segmented, Skeleton } from "@/components/ui";
import { CASH_DAYS, formatDA, hasCashFlow } from "../data";
import type { CashDays, SummaryResult, TFn } from "../types";

const DEP = "var(--success)";
const WD = "color-mix(in srgb,var(--info) 60%,transparent)";

/** "10-15" — the day without the year; the series is already ordered. */
const shortDay = (iso: string) => iso.slice(5);

function Body({ t, cash, days }: { t: TFn; cash: Promise<SummaryResult>; days: CashDays }) {
  const { summary } = use(cash);
  if (!summary) return <p className="text-sm text-subtext py-10 text-center">{t("chart.unavailable")}</p>;
  if (!hasCashFlow(summary)) return <p className="text-sm text-subtext py-10 text-center">{t("chart.empty")}</p>;
  const max = Math.max(1, ...summary.daily.flatMap((d) => [d.deposits, d.withdrawals]));
  return (
    <>
      <ColumnChart
        data={summary.daily.map((d) => ({ label: shortDay(d.date), values: [d.deposits, d.withdrawals] }))}
        max={max * 1.1}
        colors={[DEP, WD]}
        height={170}
        labelInterval={days <= 7 ? 0 : days <= 30 ? 4 : 13}
        seriesNames={[t("chart.deposits"), t("chart.withdrawals")]}
      />
      <p className="text-xs text-subtext mt-3 tabular-nums">
        {t("chart.fees", {
          platform: formatDA(summary.fees.platform),
          tax: formatDA(summary.fees.tax),
          agents: formatDA(summary.fees.agentsNet),
        })}
      </p>
    </>
  );
}

/** Deposits vs withdrawals per day for the `?days=` window, with the 7/30/90 switch. */
export function CashFlowChart({ t, cash, days }: { t: TFn; cash?: Promise<SummaryResult>; days: CashDays }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <ChartHead title={t("chart.dvw")} description={t("chart.dvw_desc")} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Legend
          items={[
            { label: t("chart.deposits"), color: DEP },
            { label: t("chart.withdrawals"), color: WD },
          ]}
        />
        <Segmented<`${CashDays}`>
          options={CASH_DAYS.map((d) => [`${d}` as `${CashDays}`, t(`chart.d${d}`)])}
          value={`${days}`}
          onChange={(v) => startTransition(() => router.replace(`${pathname}?days=${v}`, { scroll: false }))}
        />
      </div>
      <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={pending}>
        {cash ? (
          <Suspense fallback={<Skeleton className="h-[170px] w-full rounded-lg" />}>
            <Body t={t} cash={cash} days={days} />
          </Suspense>
        ) : (
          <p className="text-sm text-subtext py-10 text-center">{t("chart.unavailable")}</p>
        )}
      </div>
    </Card>
  );
}
