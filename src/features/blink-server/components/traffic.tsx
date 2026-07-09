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
  Segmented,
  CHART,
  type Variant,
  type ColumnDatum,
  type DonutSegment,
} from "@/components/ui";
import {
  fetchServerTraffic,
  type TrafficSnapshot,
  type TrafficRange,
} from "@/app/d/blink-server/metrics-action";
import { largestRemainder } from "../metrics-format";
import { InstanceSwitcher } from "./instance-switcher";
import { useServerInstanceStore } from "../instance-store";
import type { ServerInstance } from "../instances";

// Blink Server → Traffic. Endpoint leaderboard + status / volume breakdowns over a
// selectable window, polled from the backend GET /metrics/traffic (Phase 4).
const POLL_MS = 5000;
const DASH = "—";

const RANGE_MIN: Record<TrafficRange, number> = { "15m": 15, "1h": 60, "24h": 1440 };

const METHOD_VARIANT: Record<string, Variant> = {
  GET: "info",
  POST: "primary",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "danger",
};

export function Traffic() {
  const instance = useServerInstanceStore((s) => s.instance);
  return (
    <>
      <InstanceSwitcher />
      {/* key={instance} resets the poll cleanly when the operator switches backend. */}
      <TrafficPanel key={instance} instance={instance} />
    </>
  );
}

function TrafficPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.traffic");
  const [range, setRange] = useState<TrafficRange>("1h");
  const [data, setData] = useState<TrafficSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const { traffic, error: e } = await fetchServerTraffic(range, instance);
      if (!alive) return;
      setError(e);
      if (traffic) setData(traffic);
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [range, instance]);

  // Treat data from a different window as not-yet-loaded, so switching range shows
  // the loading state until the matching snapshot arrives (no setState-in-effect).
  const d = data && data.rangeMin === RANGE_MIN[range] ? data : null;

  // Volume chart: the server sends numeric minute offsets; format relative to range.
  // The newest bucket (last, since volume is oldest→newest) is labelled "now" for all
  // ranges — for 1h/24h its window doesn't start exactly at offset 0.
  const volume = d?.volume ?? [];
  const volumeData: ColumnDatum[] = volume.map((v, i) => ({
    label:
      i === volume.length - 1
        ? t("now")
        : range === "24h"
          ? `${Math.round(v.offsetMin / 60)}h`
          : `${v.offsetMin}m`,
    values: [v.count],
  }));
  const hasVolume = volume.some((v) => v.count > 0);
  const volumeMax = Math.max(10, ...volumeData.flatMap((x) => x.values));

  // Status donut.
  const sc = d?.statusCodes;
  const statusTotal = sc ? sc.c2xx + sc.c3xx + sc.c4xx + sc.c5xx : 0;
  let statusSegments: DonutSegment[] = [];
  if (sc && statusTotal > 0) {
    const defs = [
      { name: "2xx", count: sc.c2xx, color: CHART.success },
      { name: "3xx", count: sc.c3xx, color: CHART.info },
      { name: "4xx", count: sc.c4xx, color: CHART.warning },
      { name: "5xx", count: sc.c5xx, color: CHART.danger },
    ].filter((x) => x.count > 0);
    const pcts = largestRemainder(
      defs.map((x) => x.count),
      statusTotal
    );
    statusSegments = defs.map((x, i) => ({ name: x.name, pct: pcts[i], color: x.color }));
  }

  const errVariant: Variant = d && d.errorRatePct >= 1 ? "danger" : "success";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-text">{t("title")}</h3>
        <Segmented
          options={[
            ["15m", t("range_15m")],
            ["1h", t("range_1h")],
            ["24h", t("range_24h")],
          ]}
          value={range}
          onChange={(v) => setRange(v as TrafficRange)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <StatGrid cols={4}>
        <StatCard
          label={t("total_requests")}
          value={d ? d.totalRequests.toLocaleString() : DASH}
          icon="activity"
          variant={d ? "primary" : "default"}
        />
        <StatCard
          label={t("avg_rps")}
          value={d ? d.avgRps : DASH}
          icon="trending"
          variant={d ? "info" : "default"}
        />
        <StatCard
          label={t("error_rate")}
          value={d ? `${d.errorRatePct}%` : DASH}
          icon="warn"
          variant={d ? errVariant : "default"}
        />
        <StatCard
          label={t("routes")}
          value={d ? d.distinctRoutes : DASH}
          icon="grid"
          variant={d ? "success" : "default"}
        />
      </StatGrid>

      <Card title={t("endpoints")} description={t("endpoints_desc")} className="mb-4">
        {d && d.topEndpoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wide text-subtext">
                  <th className="py-2 pe-3 text-start font-semibold">{t("col_route")}</th>
                  <th className="py-2 px-3 text-end font-semibold">{t("col_hits")}</th>
                  <th className="py-2 px-3 text-end font-semibold">{t("col_latency")}</th>
                  <th className="py-2 ps-3 text-end font-semibold">{t("col_errors")}</th>
                </tr>
              </thead>
              <tbody>
                {d.topEndpoints.map((e) => (
                  <tr
                    key={`${e.method} ${e.route}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2.5 pe-3">
                      <span dir="ltr" className="flex items-center gap-2">
                        <Badge variant={METHOD_VARIANT[e.method] ?? "default"}>{e.method}</Badge>
                        <span className="font-mono text-text">{e.route}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-end font-semibold text-text">
                      {e.hits.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-end text-subtext">{e.avgMs} ms</td>
                    <td className="py-2.5 ps-3 text-end text-subtext">{e.errPct}%</td>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("status_breakdown")}>
          {statusSegments.length > 0 ? (
            <Donut
              segments={statusSegments}
              centerValue={statusTotal.toLocaleString()}
              centerLabel={t("total_requests")}
            />
          ) : (
            <div className="flex h-[150px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>

        <Card title={t("traffic_over_time")} description={t("traffic_over_time_desc")}>
          {hasVolume ? (
            <ColumnChart data={volumeData} max={volumeMax} colors={[CHART.primary]} />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-subtext">
              {t("no_data")}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
