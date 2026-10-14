"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card, ChartHead, DataTable, Donut, EmptyState, Segmented, StatCard, StatGrid, type Column } from "@/components/ui";
import { fmtNum, pct } from "../format";
import { CATEGORIES } from "../form";
import type { PromotionDay, PromotionListItem } from "../types";
import { DailyChart } from "./daily-chart";

interface TopRow {
  id: string;
  title: string;
  category: string;
  views: number;
  taps: number;
  issued: number;
  used: number;
  discount_given: number;
}

export function PromoAnalytics({
  days,
  daily,
  items,
  error,
}: {
  days: number;
  daily: PromotionDay[];
  items: PromotionListItem[];
  error?: string;
}) {
  const t = useTranslations("promotions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const sum = (f: (s: PromotionListItem["stats"]) => number) => items.reduce((a, i) => a + f(i.stats), 0);
  const views = sum((s) => s.views);
  const taps = sum((s) => s.taps);
  const issued = sum((s) => s.issued);
  const used = sum((s) => s.used);
  const given = sum((s) => s.discount_given);
  const revenue = sum((s) => s.revenue);
  const da = (n: number) => `${fmtNum(n, locale)} ${tc("da")}`;

  const top: TopRow[] = items
    .map(({ row, stats }) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      views: stats.views,
      taps: stats.taps,
      issued: stats.issued,
      used: stats.used,
      discount_given: stats.discount_given,
    }))
    .filter((r) => r.discount_given > 0 || r.issued > 0 || r.views > 0)
    .sort((a, b) => b.discount_given - a.discount_given || b.issued - a.issued)
    .slice(0, 10);

  const byCat = CATEGORIES.map((c) => ({
    cat: c,
    value: items.filter((i) => i.row.category === c).reduce((a, i) => a + i.stats.issued, 0),
  })).filter((c) => c.value > 0);
  const catTotal = byCat.reduce((a, c) => a + c.value, 0);

  const columns: Column<TopRow>[] = [
    { key: "title", label: t("cols.promotion"), render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: "category", label: t("cols.category"), render: (r) => t(`categories.${r.category}` as never) },
    { key: "views", label: t("cols.views"), render: (r) => <span className="tabular-nums">{fmtNum(r.views, locale)}</span> },
    { key: "taps", label: t("cols.ctr"), render: (r) => <span className="tabular-nums">{pct(r.taps, r.views)}</span> },
    { key: "issued", label: t("cols.issued"), render: (r) => <span className="tabular-nums">{fmtNum(r.issued, locale)}</span> },
    { key: "used", label: t("cols.conversion"), render: (r) => <span className="tabular-nums">{pct(r.used, r.issued)}</span> },
    { key: "discount_given", label: t("cols.discount_given"), render: (r) => <span className="tabular-nums">{da(r.discount_given)}</span> },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-subtext">{t("an.range_label")}</span>
        <Segmented<"7" | "30" | "90">
          options={[
            ["7", t("an.days", { n: 7 })],
            ["30", t("an.days", { n: 30 })],
            ["90", t("an.days", { n: 90 })],
          ]}
          value={String(days) as "7" | "30" | "90"}
          onChange={(v) => router.push(`/promotions/analytics?days=${v}`)}
        />
      </div>
      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      <StatGrid cols={5}>
        <StatCard label={t("cols.views")} value={views} variant="info" icon="eye" />
        <StatCard label={t("cols.ctr")} value={pct(taps, views)} variant="primary" icon="activity" />
        <StatCard label={t("cols.issued")} value={issued} variant="success" icon="ticket" change={t("detail.conversion", { n: pct(used, issued) })} />
        <StatCard label={t("cols.discount_given")} value={da(given)} variant="warning" icon="dollar" />
        <StatCard label={t("cols.revenue")} value={da(revenue)} variant="default" icon="trending" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <ChartHead title={t("an.traffic")} description={t("an.traffic_desc")} />
          <DailyChart days={daily} series="traffic" names={[t("cols.views"), t("detail.tap_name")]} />
        </Card>
        <Card>
          <ChartHead title={t("an.coupons")} description={t("an.coupons_desc")} />
          <DailyChart days={daily} series="coupons" names={[t("cols.issued"), t("cols.used")]} />
        </Card>
        <Card>
          <ChartHead title={t("an.discount")} description={t("an.discount_desc")} />
          <DailyChart days={daily} series="discount" names={[t("cols.discount_given")]} />
        </Card>
        <Card>
          <ChartHead title={t("an.by_category")} description={t("an.by_category_desc")} />
          {catTotal === 0 ? (
            <p className="text-sm text-subtext py-8 text-center">{t("an.no_data")}</p>
          ) : (
            <Donut
              segments={byCat.map((c) => ({ name: t(`categories.${c.cat}` as never), pct: Math.round((c.value / catTotal) * 100) }))}
              centerValue={fmtNum(catTotal, locale)}
              centerLabel={t("an.issued_short")}
            />
          )}
        </Card>
      </div>

      <h3 className="text-sm font-semibold text-text mb-3">{t("an.top")}</h3>
      {top.length === 0 && !error ? (
        <EmptyState title={t("an.no_data")} />
      ) : (
        <DataTable<TopRow> columns={columns} data={top} error={error} enablePagination={false} rowHref={(r) => `/promotions/${r.id}`} />
      )}
    </>
  );
}
