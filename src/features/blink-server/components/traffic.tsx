"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  StatCard,
  StatGrid,
  ColumnChart,
  Donut,
  Badge,
  Segmented,
  CHART,
  type Variant,
  type ColumnDatum,
} from "@/components/ui";
import { InstanceSwitcher } from "./instance-switcher";
import { PreviewBanner } from "./preview-banner";

// Blink Server → Traffic (PLACEHOLDER). Endpoint leaderboard + status / volume
// breakdowns over a selectable window. Sample data only — Phase 4 of the roadmap
// turns request logs into these aggregates (backend GET /metrics/traffic).
type Range = "15m" | "1h" | "24h";

const OVER_TIME: ColumnDatum[] = [
  { label: "00", values: [820] },
  { label: "04", values: [410] },
  { label: "08", values: [1280] },
  { label: "12", values: [1840] },
  { label: "16", values: [1610] },
  { label: "20", values: [1190] },
];

const ENDPOINTS: { method: string; route: string; hits: string; ms: string; err: string; variant: Variant }[] = [
  { method: "GET", route: "/ai-logs", hits: "48,210", ms: "297", err: "0.0%", variant: "info" },
  { method: "POST", route: "/chat", hits: "31,940", ms: "1,420", err: "0.8%", variant: "primary" },
  { method: "GET", route: "/logs", hits: "22,180", ms: "183", err: "0.0%", variant: "info" },
  { method: "GET", route: "/news", hits: "9,640", ms: "92", err: "0.1%", variant: "info" },
  { method: "GET", route: "/health", hits: "8,300", ms: "11", err: "0.0%", variant: "info" },
];

export function Traffic() {
  const t = useTranslations("blink_server.traffic");
  const [range, setRange] = useState<Range>("1h");

  return (
    <>
      <InstanceSwitcher />
      <PreviewBanner />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-text">{t("title")}</h3>
        <Segmented
          options={[
            ["15m", t("range_15m")],
            ["1h", t("range_1h")],
            ["24h", t("range_24h")],
          ]}
          value={range}
          onChange={setRange}
        />
      </div>

      <StatGrid cols={4}>
        <StatCard label={t("total_requests")} value="1.84M" icon="activity" variant="primary" />
        <StatCard label={t("avg_rps")} value="21" icon="trending" variant="info" />
        <StatCard label={t("unique_users")} value="3,210" icon="users" variant="success" />
        <StatCard label={t("error_rate")} value="0.6%" icon="warn" variant="danger" />
      </StatGrid>

      <Card title={t("endpoints")} description={t("endpoints_desc")} className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-start text-[12px] uppercase tracking-wide text-subtext">
                <th className="py-2 pe-3 text-start font-semibold">{t("col_route")}</th>
                <th className="py-2 px-3 text-end font-semibold">{t("col_hits")}</th>
                <th className="py-2 px-3 text-end font-semibold">{t("col_latency")}</th>
                <th className="py-2 ps-3 text-end font-semibold">{t("col_errors")}</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.route} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pe-3">
                    <span className="flex items-center gap-2">
                      <Badge variant={e.variant}>{e.method}</Badge>
                      <span className="font-mono text-text">{e.route}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-end font-semibold text-text">{e.hits}</td>
                  <td className="py-2.5 px-3 text-end text-subtext">{e.ms} ms</td>
                  <td className="py-2.5 ps-3 text-end text-subtext">{e.err}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("status_breakdown")}>
          <Donut
            segments={[
              { name: "2xx", pct: 93, color: CHART.success },
              { name: "3xx", pct: 4, color: CHART.info },
              { name: "4xx", pct: 2, color: CHART.warning },
              { name: "5xx", pct: 1, color: CHART.danger },
            ]}
            centerValue="1.84M"
            centerLabel={t("total_requests")}
          />
        </Card>

        <Card title={t("traffic_over_time")} description={t("traffic_over_time_desc")}>
          <ColumnChart data={OVER_TIME} max={2000} colors={[CHART.primary]} />
        </Card>
      </div>
    </>
  );
}
