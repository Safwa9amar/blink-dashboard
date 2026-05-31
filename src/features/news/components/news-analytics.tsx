"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  StatGrid,
  StatCard,
  ChartHead,
  ColumnChart,
  Donut,
  Legend,
  Badge,
  type ColumnDatum,
  type DonutSegment,
} from "@/components/ui";
import { N_CATS } from "../data";
import { useNewsStore } from "../store";

// Mock reads-over-time series (thousands). Presentational — the news route is
// seed-driven per CLAUDE.md.
const READS_SERIES: ColumnDatum[] = [
  { label: "Jan", values: [62] },
  { label: "Feb", values: [78] },
  { label: "Mar", values: [95] },
  { label: "Apr", values: [88] },
  { label: "May", values: [124] },
  { label: "Jun", values: [110] },
];

export function NewsAnalytics() {
  const t = useTranslations("news");
  const posts = useNewsStore((s) => s.posts);

  // The reads series and category donut are brand-level seed figures (N_CATS
  // totals = 68 posts), intentionally decorative per CLAUDE.md's mock-driven news
  // route. Only the top-posts list below reflects the live store.
  const segments: DonutSegment[] = useMemo(() => {
    const total = N_CATS.reduce((a, c) => a + c.count, 0) || 1;
    return N_CATS.map((c) => ({ name: c.name, color: c.color, pct: Math.round((c.count / total) * 100) }));
  }, []);
  const totalPosts = useMemo(() => N_CATS.reduce((a, c) => a + c.count, 0), []);

  const topPosts = useMemo(() => [...posts].sort((a, b) => b.views - a.views).slice(0, 5), [posts]);
  const maxReads = Math.max(...READS_SERIES.map((d) => d.values[0]));

  return (
    <div className="space-y-5">
      <StatGrid cols={4}>
        <StatCard label={t("stats.reads")} value="1.2M" variant="primary" icon="trending" change={t("stats.reads_chg")} />
        <StatCard label={t("stats.ctr")} value="7.1%" variant="warning" icon="activity" change={t("stats.ctr_chg")} />
        <StatCard label={t("analytics.engagement")} value="63%" variant="success" icon="fire" change={t("analytics.engagement_chg")} />
        <StatCard label={t("stats.published")} value={61} variant="info" icon="newspaper" change={t("stats.published_chg")} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <Card>
          <ChartHead
            title={t("analytics.reads_title")}
            description={t("analytics.reads_desc")}
            right={<Legend items={[{ label: t("analytics.reads_legend"), color: "var(--primary)" }]} />}
          />
          <ColumnChart
            data={READS_SERIES}
            max={maxReads}
            colors={["var(--primary)"]}
            height={200}
            peakIndex={READS_SERIES.findIndex((d) => d.values[0] === maxReads)}
            peakLabel={t("analytics.peak")}
          />
        </Card>

        <Card>
          <ChartHead title={t("analytics.cats_title")} description={t("analytics.cats_desc")} />
          <Donut segments={segments} centerValue={totalPosts} centerLabel={t("analytics.posts")} />
        </Card>
      </div>

      <Card title={t("analytics.top_title")} description={t("analytics.top_desc")}>
        <div className="space-y-1">
          {topPosts.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-4 py-3 ${i ? "border-t border-border" : ""}`}>
              <span className="w-7 h-7 rounded-lg bg-muted text-subtext text-[13px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div
                className="w-12 h-9 rounded-lg bg-cover bg-center bg-muted shrink-0"
                style={{ backgroundImage: `url(${p.cover})` }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-bold text-text truncate">{p.title}</div>
                <Badge variant="default">{p.cat}</Badge>
              </div>
              <div className="text-end shrink-0">
                <div className="font-bold text-sm text-text">{p.views ? `${(p.views / 1000).toFixed(1)}k` : "—"}</div>
                <div className="text-[10px] text-subtext uppercase tracking-wide">{t("reads")}</div>
              </div>
              <div className="text-end shrink-0 min-w-[48px]">
                <div className="font-bold text-sm text-text">{p.ctr}</div>
                <div className="text-[10px] text-subtext uppercase tracking-wide">{t("ctr")}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
