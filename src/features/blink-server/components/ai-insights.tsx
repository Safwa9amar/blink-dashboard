"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  StatCard,
  StatGrid,
  ColumnChart,
  Donut,
  Badge,
  CHART,
  type ColumnDatum,
  type DonutSegment,
} from "@/components/ui";
import { fetchAiMetrics, type AiMetricsSnapshot } from "@/app/d/blink-server/metrics-action";
import { largestRemainder } from "../metrics-format";
import { InstanceSwitcher } from "./instance-switcher";
import { useServerInstanceStore } from "../instance-store";
import type { ServerInstance } from "../instances";

// Blink Server → AI Insights. Token / cost / latency rollups over the buffered AI call
// log (the last ~500 calls), polled from the backend GET /metrics/ai (Phase 5).
const POLL_MS = 5000;
const DASH = "—";
const USAGE_MODELS = 6;

const compact = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
const shortModel = (m: string): string => m.split("/").pop() || m;
const formatLatency = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;

export function AiInsights() {
  const instance = useServerInstanceStore((s) => s.instance);
  return (
    <>
      <InstanceSwitcher />
      {/* key={instance} resets the poll cleanly when the operator switches backend. */}
      <AiInsightsPanel key={instance} instance={instance} />
    </>
  );
}

function AiInsightsPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.ai_insights");
  const [m, setM] = useState<AiMetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const { aiMetrics, error: e } = await fetchAiMetrics(instance);
      if (!alive) return;
      setError(e);
      if (aiMetrics) setM(aiMetrics);
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [instance]);

  // Per-model token usage (top models by total tokens).
  const usageModels = (m?.models ?? [])
    .filter((x) => x.promptTokens + x.completionTokens > 0)
    .sort((a, b) => b.promptTokens + b.completionTokens - (a.promptTokens + a.completionTokens))
    .slice(0, USAGE_MODELS);
  const usageData: ColumnDatum[] = usageModels.map((x) => ({
    label: shortModel(x.model),
    values: [x.promptTokens, x.completionTokens],
  }));
  const usageMax = Math.max(1, ...usageData.flatMap((x) => x.values));

  // Cost-by-model donut (only priced models contribute).
  const costModels = (m?.models ?? []).filter((x) => x.costUsd > 0);
  const totalCents = costModels.reduce((s, x) => s + Math.round(x.costUsd * 100), 0);
  let costSegments: DonutSegment[] = [];
  if (totalCents > 0) {
    const pcts = largestRemainder(
      costModels.map((x) => Math.round(x.costUsd * 100)),
      totalCents
    );
    costSegments = costModels.map((x, i) => ({ name: shortModel(x.model), pct: pcts[i] }));
  }

  const models = m?.models ?? [];

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <StatGrid cols={4}>
        <StatCard
          label={t("total_calls")}
          value={m ? m.totalCalls.toLocaleString() : DASH}
          icon="chat"
          variant={m ? "primary" : "default"}
        />
        <StatCard
          label={t("tokens")}
          value={m ? compact(m.totalTokens) : DASH}
          icon="sparkles"
          variant={m ? "info" : "default"}
        />
        <StatCard
          label={t("cost")}
          value={m ? `$${m.estCostUsd.toFixed(2)}` : DASH}
          icon="dollar"
          variant={m ? "success" : "default"}
        />
        <StatCard
          label={t("latency")}
          value={m ? formatLatency(m.avgLatencyMs) : DASH}
          icon="trending"
          variant={m ? "warning" : "default"}
        />
      </StatGrid>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("usage")} description={t("usage_desc")}>
          {usageData.length > 0 ? (
            <>
              <ColumnChart data={usageData} max={usageMax} colors={[CHART.primary, CHART.info]} />
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
            </>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>

        <Card title={t("cost_by_model")}>
          {costSegments.length > 0 ? (
            <Donut
              segments={costSegments}
              centerValue={`$${(m?.estCostUsd ?? 0).toFixed(2)}`}
              centerLabel={t("cost")}
            />
          ) : (
            <div className="flex h-[150px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>
      </div>

      <Card title={t("models")} description={t("models_desc")}>
        {models.length > 0 ? (
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
                {models.map((x) => (
                  <tr key={x.model} className="border-b border-border/60 last:border-0">
                    <td dir="ltr" className="py-2.5 pe-3 font-mono text-text">
                      {x.model}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={x.status === "degraded" ? "warning" : "success"}>
                        {x.status === "degraded" ? t("status_degraded") : t("status_ok")}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-end text-subtext">{x.avgMs} ms</td>
                    <td className="py-2.5 ps-3 text-end text-subtext">{x.limitHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-[13px] text-subtext">
            {t("no_data")}
          </div>
        )}
      </Card>
    </>
  );
}
