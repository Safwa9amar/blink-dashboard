"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  StatCard,
  StatGrid,
  ColumnChart,
  Donut,
  Badge,
  CHART,
  type Variant,
  type ColumnDatum,
} from "@/components/ui";
import { InstanceSwitcher } from "./instance-switcher";
import { PreviewBanner } from "./preview-banner";

// Blink Server → AI Insights (PLACEHOLDER). Token/cost/latency rollups for the bot,
// built on top of the existing AI call log. Sample data only — Phase 5 of the
// roadmap aggregates the ai_logs the AI Log tab already tails.
const USAGE: ColumnDatum[] = [
  { label: "Mon", values: [420000, 180000] },
  { label: "Tue", values: [510000, 220000] },
  { label: "Wed", values: [380000, 160000] },
  { label: "Thu", values: [620000, 260000] },
  { label: "Fri", values: [710000, 300000] },
  { label: "Sat", values: [340000, 140000] },
  { label: "Sun", values: [290000, 120000] },
];

const MODELS: { model: string; status: string; variant: Variant; ms: string; limits: string }[] = [
  { model: "anthropic/claude-sonnet-4", status: "status_ok", variant: "success", ms: "1,210", limits: "0" },
  { model: "openai/gpt-4o-mini", status: "status_ok", variant: "success", ms: "880", limits: "0" },
  { model: "meta-llama/llama-3-70b", status: "status_degraded", variant: "warning", ms: "2,340", limits: "12" },
];

export function AiInsights() {
  const t = useTranslations("blink_server.ai_insights");
  return (
    <>
      <InstanceSwitcher />
      <PreviewBanner />

      <StatGrid cols={4}>
        <StatCard label={t("total_calls")} value="12,480" icon="chat" variant="primary" />
        <StatCard label={t("tokens")} value="8.6M" icon="sparkles" variant="info" />
        <StatCard label={t("cost")} value="$42.18" icon="dollar" variant="success" />
        <StatCard label={t("latency")} value="1.4 s" icon="trending" variant="warning" />
      </StatGrid>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("usage")} description={t("usage_desc")}>
          <ColumnChart data={USAGE} max={1100000} colors={[CHART.primary, CHART.info]} />
          <div className="mt-3 flex items-center gap-4 text-[12px] text-subtext">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.primary }} />
              {t("prompt_tokens")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.info }} />
              {t("completion_tokens")}
            </span>
          </div>
        </Card>

        <Card title={t("cost_by_model")}>
          <Donut
            segments={[
              { name: "claude-sonnet-4", pct: 58 },
              { name: "gpt-4o-mini", pct: 31 },
              { name: "llama-3-70b", pct: 11 },
            ]}
            centerValue="$42"
            centerLabel={t("cost")}
          />
        </Card>
      </div>

      <Card title={t("models")} description={t("models_desc")}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-subtext">
                <th className="py-2 pe-3 text-start font-semibold">{t("col_model")}</th>
                <th className="py-2 px-3 text-start font-semibold">{t("col_status")}</th>
                <th className="py-2 px-3 text-end font-semibold">{t("col_latency")}</th>
                <th className="py-2 ps-3 text-end font-semibold">{t("col_limits")}</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.model} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pe-3 font-mono text-text">{m.model}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={m.variant}>{t(m.status)}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-end text-subtext">{m.ms} ms</td>
                  <td className="py-2.5 ps-3 text-end text-subtext">{m.limits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
