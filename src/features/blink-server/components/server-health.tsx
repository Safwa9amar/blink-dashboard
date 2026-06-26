"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  StatCard,
  StatGrid,
  ColumnChart,
  Donut,
  CHART,
  type ColumnDatum,
} from "@/components/ui";
import { InstanceSwitcher } from "./instance-switcher";
import { PreviewBanner } from "./preview-banner";

// Blink Server → Health (PLACEHOLDER). Vitals strip + latency / status / resource
// panels. Renders sample data only — the live feed (a backend GET /metrics + a
// fetchServerMetrics action) is Phase 1 of the monitoring roadmap.
const LATENCY: ColumnDatum[] = [
  { label: "−7m", values: [140, 360] },
  { label: "−6m", values: [128, 320] },
  { label: "−5m", values: [165, 410] },
  { label: "−4m", values: [150, 380] },
  { label: "−3m", values: [182, 520] },
  { label: "−2m", values: [171, 440] },
  { label: "−1m", values: [158, 390] },
  { label: "now", values: [182, 470] },
];

function ResourceBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-subtext">{label}</span>
        <span className="font-semibold text-text">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function ServerHealth() {
  const t = useTranslations("blink_server.health");
  return (
    <>
      <InstanceSwitcher />
      <PreviewBanner />

      <StatGrid cols={4}>
        <StatCard label={t("uptime")} value="4d 12h" icon="clock" variant="primary" />
        <StatCard label={t("reqmin")} value="1,240" icon="activity" variant="info" />
        <StatCard label={t("error_rate")} value="0.4%" icon="warn" variant="danger" />
        <StatCard label={t("latency")} value="182 ms" icon="trending" variant="success" />
      </StatGrid>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("latency_chart")} description={t("latency_chart_desc")}>
          <ColumnChart data={LATENCY} max={600} colors={[CHART.primary, CHART.info]} />
          <div className="mt-3 flex items-center gap-4 text-[12px] text-subtext">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.primary }} />
              {t("p50")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.info }} />
              {t("p95")}
            </span>
          </div>
        </Card>

        <Card title={t("status_chart")} description={t("status_chart_desc")}>
          <Donut
            segments={[
              { name: "2xx", pct: 94, color: CHART.success },
              { name: "4xx", pct: 5, color: CHART.warning },
              { name: "5xx", pct: 1, color: CHART.danger },
            ]}
            centerValue="1.24k"
            centerLabel={t("reqmin")}
          />
        </Card>
      </div>

      <Card title={t("resources")} description={t("resources_desc")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ResourceBar label={t("memory")} value="312 / 512 MB" pct={61} color={CHART.warning} />
          <ResourceBar label={t("cpu")} value="23%" pct={23} color={CHART.info} />
          <ResourceBar label={t("event_loop")} value="4 ms" pct={8} color={CHART.success} />
        </div>
      </Card>
    </>
  );
}
