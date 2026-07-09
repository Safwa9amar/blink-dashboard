"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  StatCard,
  StatGrid,
  ColumnChart,
  Donut,
  CHART,
  type Variant,
  type ColumnDatum,
  type DonutSegment,
} from "@/components/ui";
import { fetchServerMetrics, type MetricsSnapshot } from "@/app/d/blink-server/metrics-action";
import { largestRemainder } from "../metrics-format";
import { InstanceSwitcher } from "./instance-switcher";
import { useServerInstanceStore } from "../instance-store";
import type { ServerInstance } from "../instances";

// Blink Server → Health. Live vitals strip + resource bars + per-minute latency
// (p50/p95) and status-code charts, all polled from the backend GET /metrics
// (Phases 1 & 2). Everything here is now real data for the selected instance.
const POLL_MS = 3000;
const DASH = "—";

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function band(pct: number, warn: number, danger: number): string {
  return pct >= danger ? CHART.danger : pct >= warn ? CHART.warning : CHART.success;
}

const fmtBytes = (b: number): string =>
  b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB` : `${Math.round(b / 1024 / 1024)} MB`;

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
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ServerHealth() {
  const instance = useServerInstanceStore((s) => s.instance);
  return (
    <>
      <InstanceSwitcher />
      {/* key={instance} resets the poll cleanly when the operator switches backend. */}
      <HealthPanel key={instance} instance={instance} />
    </>
  );
}

function HealthPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.health");
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const { metrics: m, error: e } = await fetchServerMetrics(instance);
      if (!alive) return;
      setError(e);
      if (m) setMetrics(m);
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [instance]);

  const m = metrics;
  const errorVariant: Variant = m && m.errorRatePct >= 1 ? "danger" : "success";
  const latencyVariant: Variant = m && m.avgLatencyMs > 500 ? "warning" : "success";
  const memPct = m && m.heapTotal > 0 ? (m.heapUsed / m.heapTotal) * 100 : 0;

  // Host resources (OS-level).
  const host = m?.host;
  const hostMemPct = host && host.memTotal > 0 ? (host.memUsed / host.memTotal) * 100 : 0;
  const hostLoadPct = host && host.cpuCount > 0 ? (host.loadAvg[0] / host.cpuCount) * 100 : 0;
  const hostDiskPct = host && host.diskTotal > 0 ? (host.diskUsed / host.diskTotal) * 100 : 0;

  // Latency chart: per-minute p50/p95 buckets. The server sends a numeric minute
  // offset; the tick label is localized here (never baked into the payload).
  const latencyData: ColumnDatum[] = (m?.latencyBuckets ?? []).map((b) => ({
    label: b.offsetMin === 0 ? t("now") : `${b.offsetMin}m`,
    values: [b.p50, b.p95],
  }));
  const hasLatency = (m?.latencyBuckets ?? []).some((b) => b.count > 0);
  // ~15% headroom rounded to a tidy step so the tallest bar isn't flush to the top.
  const rawMax = Math.max(100, ...latencyData.flatMap((d) => d.values));
  const latencyMax = Math.ceil((rawMax * 1.15) / 50) * 50;

  // Status donut: 2xx/3xx/4xx/5xx share over the history window.
  const sc = m?.statusCodes;
  const statusTotal = sc ? sc.c2xx + sc.c3xx + sc.c4xx + sc.c5xx : 0;
  let statusSegments: DonutSegment[] = [];
  if (sc && statusTotal > 0) {
    const defs = [
      { name: "2xx", count: sc.c2xx, color: CHART.success },
      { name: "3xx", count: sc.c3xx, color: CHART.info },
      { name: "4xx", count: sc.c4xx, color: CHART.warning },
      { name: "5xx", count: sc.c5xx, color: CHART.danger },
    ].filter((d) => d.count > 0);
    const pcts = largestRemainder(
      defs.map((d) => d.count),
      statusTotal
    );
    statusSegments = defs.map((d, i) => ({ name: d.name, pct: pcts[i], color: d.color }));
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <StatGrid cols={4}>
        <StatCard
          label={t("uptime")}
          value={m ? formatUptime(m.uptimeMs) : DASH}
          icon="clock"
          variant={m ? "primary" : "default"}
        />
        <StatCard
          label={t("reqmin")}
          value={m ? m.reqPerMin : DASH}
          icon="activity"
          variant={m ? "info" : "default"}
        />
        <StatCard
          label={t("error_rate")}
          value={m ? `${m.errorRatePct}%` : DASH}
          icon="warn"
          variant={m ? errorVariant : "default"}
        />
        <StatCard
          label={t("latency")}
          value={m ? `${m.avgLatencyMs} ms` : DASH}
          icon="trending"
          variant={m ? latencyVariant : "default"}
        />
      </StatGrid>

      <Card title={t("resources")} description={t("resources_desc")} className="mb-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ResourceBar
            label={t("memory")}
            value={m ? `${mb(m.heapUsed)} / ${mb(m.heapTotal)} MB` : DASH}
            pct={memPct}
            color={band(memPct, 70, 85)}
          />
          <ResourceBar
            label={t("cpu")}
            value={m ? `${m.cpuPct}%` : DASH}
            pct={m?.cpuPct ?? 0}
            color={band(m?.cpuPct ?? 0, 60, 85)}
          />
          <ResourceBar
            label={t("event_loop")}
            value={m ? `${m.eventLoopLagMs} ms` : DASH}
            pct={Math.min(100, m?.eventLoopLagMs ?? 0)}
            color={band(m?.eventLoopLagMs ?? 0, 20, 50)}
          />
        </div>
        {m && (
          <p className="mt-4 text-[12px] text-subtext">
            {t("rss")}: {mb(m.rss)} MB
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("latency_chart")} description={t("latency_chart_desc")}>
          {hasLatency ? (
            <>
              <ColumnChart data={latencyData} max={latencyMax} colors={[CHART.primary, CHART.info]} />
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
            </>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>

        <Card title={t("status_chart")} description={t("status_chart_desc")}>
          {statusSegments.length > 0 ? (
            <Donut
              segments={statusSegments}
              centerValue={statusTotal.toLocaleString()}
              centerLabel={t("requests")}
            />
          ) : (
            <div className="flex h-[150px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>
      </div>

      {host && (
        <Card title={t("host_title")} description={t("host_desc")} className="mt-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <ResourceBar
              label={t("host_memory")}
              value={`${fmtBytes(host.memUsed)} / ${fmtBytes(host.memTotal)}`}
              pct={hostMemPct}
              color={band(hostMemPct, 70, 90)}
            />
            <ResourceBar
              label={`${t("host_load")} · ${host.cpuCount} ${t("host_cores")}`}
              value={host.loadAvg.map((n) => n.toFixed(2)).join("  ")}
              pct={hostLoadPct}
              color={band(hostLoadPct, 70, 100)}
            />
            <ResourceBar
              label={t("host_disk")}
              value={host.diskTotal > 0 ? `${fmtBytes(host.diskUsed)} / ${fmtBytes(host.diskTotal)}` : DASH}
              pct={hostDiskPct}
              color={band(hostDiskPct, 80, 95)}
            />
          </div>
          <p className="mt-4 text-[12px] text-subtext">
            {t("host_uptime")}: {formatUptime(host.sysUptimeMs)} · {host.platform} · Node {host.node}
          </p>
        </Card>
      )}
    </>
  );
}
