"use client";

import { useLocale } from "next-intl";
import { StatCard, Card, ChartHead, ColumnChart, DashIcon, Badge, EmptyState, CHART } from "@/components/ui";
import { formatDay } from "@/features/promotions";
import type { CsatStats } from "../csat-agents";
import type { TFn } from "../types";

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <DashIcon key={i} name="star" className={`w-3.5 h-3.5 ${i <= score ? "text-warning" : "text-border"}`} />
      ))}
    </span>
  );
}

const ROLE_VAR = { customer: "info", rider: "success", merchant: "primary", agent: "warning" } as const;

export function CsatTab({ t, stats }: { t: TFn; stats: CsatStats }) {
  const locale = useLocale();
  const num = (n: number, d = 1) => n.toLocaleString(locale, { maximumFractionDigits: d, minimumFractionDigits: d });
  const empty = stats.rated === 0;

  if (empty) {
    return (
      <Card>
        <EmptyState icon={<DashIcon name="star" className="w-8 h-8" />} title={t("csa.empty_title")} description={t("csa.empty")} />
      </Card>
    );
  }

  const positive = stats.dist[3] + stats.dist[4];
  const detractors = stats.dist[0] + stats.dist[1];
  const pct = (n: number) => `${Math.round((n / stats.rated) * 100)}%`;
  const max = Math.max(1, ...stats.dist);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t("csa.score")} value={stats.avg != null ? num(stats.avg) : "—"} variant="primary" icon="star" change={t("csa.score_chg")} />
        <StatCard
          label={t("csa.responses")}
          value={stats.rated.toLocaleString(locale)}
          variant="info"
          icon="chat"
          change={stats.responseRate != null ? t("csa.rate_chg", { pct: Math.round(stats.responseRate * 100) }) : undefined}
        />
        <StatCard label={t("csa.positive")} value={pct(positive)} variant="success" icon="trending" change={t("csa.positive_chg", { n: positive })} />
        <StatCard label={t("csa.detractors")} value={detractors.toLocaleString(locale)} variant="danger" icon="warn" change={t("csa.detractors_chg")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-start">
        <Card>
          <ChartHead title={t("csa.trend")} description={t("csa.trend_desc", { n: stats.weeks.length })} />
          <ColumnChart
            data={stats.weeks.map((w) => ({ label: formatDay(w.start, locale).slice(0, 5), values: [w.avg ?? 0] }))}
            max={5}
            colors={[CHART.primary]}
            height={170}
          />
        </Card>
        <Card title={t("csa.distribution")} description={t("csa.distribution_desc")}>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = stats.dist[star - 1];
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-text w-8">
                    {star}
                    <DashIcon name="star" className="w-3 h-3 text-warning" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-warning" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <span className="text-[12px] text-subtext tabular-nums w-16 text-end">
                    {n} · {pct(n)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title={t("csa.recent")} description={t("csa.recent_desc")}>
        {stats.latest.map((r) => (
          <div key={`${r.conversationId}-${r.at}`} className="flex flex-wrap gap-3.5 items-start py-3.5 border-t border-border first:border-t-0">
            <Stars score={r.rating} />
            <div className="flex-1 min-w-[180px]">
              {r.comment ? (
                <p className="text-[13px] text-text leading-snug" dir="auto">
                  “{r.comment}”
                </p>
              ) : (
                <p className="text-[13px] text-subtext">{t("csa.no_comment")}</p>
              )}
              <p className="text-[11.5px] text-subtext mt-1" dir="auto">
                {r.who ?? "—"}
                {r.agent ? ` · ${t("csa.handled_by", { agent: r.agent })}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={ROLE_VAR[r.role as keyof typeof ROLE_VAR] ?? "default"}>
                {ROLE_VAR[r.role as keyof typeof ROLE_VAR] ? t(`mac.role_${r.role}`) : r.role}
              </Badge>
              <span className="text-[11px] text-subtext">{formatDay(r.at, locale)}</span>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
