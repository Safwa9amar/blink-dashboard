"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { OpsMap, type MapLine, type MapMarker } from "@/components/map/ops-map";
import { shortId } from "../aggregate";
import { agoLabel, codeLabel } from "../format";
import type { LiveOpsSnapshot } from "../types";

type Layer = "riders" | "orders" | "agents";

const LEGEND: { color: string; key: string; layer: Layer }[] = [
  { color: "var(--success)", key: "legend_idle", layer: "riders" },
  { color: "var(--info)", key: "legend_busy", layer: "riders" },
  { color: "var(--primary)", key: "legend_order", layer: "orders" },
  { color: "var(--warning)", key: "legend_dropoff", layer: "orders" },
  { color: "var(--purple)", key: "legend_agent", layer: "agents" },
];

export function LiveMap({ snapshot, now, fitKey }: { snapshot: LiveOpsSnapshot; now: number | null; fitKey: string }) {
  const t = useTranslations("live_ops");
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ riders: true, orders: true, agents: true });
  const [height, setHeight] = useState(420);

  // 320px on phones, 420px otherwise (decided after mount).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setHeight(mq.matches ? 320 : 420);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Relative times only affect popups; recompute once a minute, not every second.
  const nowMin = now == null ? null : Math.floor(now / 60000) * 60000;

  const { markers, lines } = useMemo(() => {
    const m: MapMarker[] = [];
    const l: MapLine[] = [];
    if (layers.riders) {
      for (const r of snapshot.riders) {
        m.push({
          id: `r:${r.id}`,
          lat: r.lat,
          lng: r.lng,
          kind: r.busy ? "rider_busy" : "rider",
          label: r.name || t("unknown_rider"),
          detail: [
            t(r.busy ? "rider_busy" : "rider_idle"),
            r.vehicle ? t("popup_vehicle", { vehicle: codeLabel(t, "vehicles", r.vehicle) }) : null,
            t("popup_seen", { ago: agoLabel(t, r.lastSeen, nowMin) }),
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
    }
    if (layers.orders) {
      for (const o of snapshot.orders) {
        m.push({
          id: `o:${o.id}`,
          lat: o.lat,
          lng: o.lng,
          kind: "pickup",
          label: shortId(o.id),
          detail: [
            o.store ? t("popup_store", { store: o.store }) : codeLabel(t, "types", o.type),
            t("popup_status", { status: codeLabel(t, "status", o.status) }),
            t("popup_age", { ago: agoLabel(t, o.createdAt, nowMin) }),
          ].join(" · "),
          href: "/orders",
          hrefLabel: t("open_orders"),
        });
        if (o.dest) l.push({ id: `l:${o.id}`, from: [o.lat, o.lng], to: o.dest, kind: "dropoff" });
      }
    }
    if (layers.agents) {
      for (const a of snapshot.agents) {
        m.push({ id: `a:${a.id}`, lat: a.lat, lng: a.lng, kind: "agent", label: a.name, detail: t("agent_shop") });
      }
    }
    return { markers: m, lines: l };
  }, [snapshot, layers, nowMin, t]);

  const toggles: [Layer, string, number][] = [
    ["riders", t("layer_riders"), snapshot.riders.length],
    ["orders", t("layer_orders"), snapshot.orders.length],
    ["agents", t("layer_agents"), snapshot.agents.length],
  ];

  return (
    <Card
      title={t("map_title")}
      action={
        <div className="flex flex-wrap gap-1.5 justify-end">
          {toggles.map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              aria-pressed={layers[k]}
              onClick={() => setLayers((s) => ({ ...s, [k]: !s[k] }))}
              className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border transition-colors ${
                layers[k] ? "bg-soft-pink text-primary border-soft-border" : "bg-background text-subtext border-border"
              }`}
            >
              {label} · {n}
            </button>
          ))}
        </div>
      }
    >
      <OpsMap markers={markers} lines={lines} height={height} fitKey={fitKey} />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {LEGEND.filter((x) => layers[x.layer]).map((x) => (
          <span key={x.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-subtext">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: x.color }} />
            {t(x.key)}
          </span>
        ))}
      </div>
      {markers.length === 0 && <p className="text-[12px] text-subtext mt-2">{t("map_empty")}</p>}
    </Card>
  );
}
