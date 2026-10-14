"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { OpsMap } from "@/components/map/ops-map";
import type { MapCircle, MapMarker } from "@/components/map/types";
import { fmtMin, fmtPct } from "../format";
import type { DemandSnapshot } from "../types";

function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-width: 639px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false
  );
}

export function DemandMap({ snap }: { snap: DemandSnapshot }) {
  const t = useTranslations("demand");
  const locale = useLocale();
  const phone = useIsPhone();
  const [picked, setPicked] = useState<string | null>(null);
  const sel = snap.areas.find((a) => a.id === picked) ?? snap.areas[0] ?? null;

  const circles = useMemo<MapCircle[]>(
    () =>
      snap.areas.slice(0, 100).map((a) => ({
        id: a.id,
        lat: a.lat,
        lng: a.lng,
        radius: Math.min(48, 8 + 6 * Math.sqrt(a.orders)),
        intensity: a.unmetRate,
        kind: a.unmetRate > 0.25 ? "alert" : "pickup",
        label: `${a.label} · ${a.orders}`,
        onClick: () => setPicked(a.id),
      })),
    [snap.areas]
  );
  const markers = useMemo<MapMarker[]>(
    () => snap.riders.map((r) => ({ id: `r-${r.id}`, lat: r.lat, lng: r.lng, kind: "rider", label: t("map.online_rider") })),
    [snap.riders, t]
  );

  const row = (k: string, v: string, first?: boolean) => (
    <div className={`flex justify-between items-center py-2.5 text-[13px] ${first ? "" : "border-t border-border"}`}>
      <span className="text-subtext">{k}</span>
      <span className="font-bold text-text tabular-nums">{v}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      <div>
        <OpsMap circles={circles} markers={markers} height={phone ? 320 : 520} fitKey={snap.range} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-subtext">
          <span>{t("map.size_hint")}</span>
          <span>{t("map.color_hint")}</span>
          <span>{t("map.online_riders_count", { n: snap.riders.length })}</span>
        </div>
      </div>
      <Card>
        {sel ? (
          <>
            <div className="text-lg font-extrabold text-text mb-3.5" dir="auto">{sel.label}</div>
            {row(t("cols.orders"), sel.orders.toLocaleString(locale), true)}
            {row(t("cols.unmet"), fmtPct(sel.unmetRate, locale))}
            {row(t("cols.wait"), fmtMin(sel.medianWait) == null ? "—" : t("min", { n: fmtMin(sel.medianWait)! }))}
            {row(t("map.riders_now"), sel.ridersNow.toLocaleString(locale))}
            <h4 className="text-xs font-semibold text-subtext mt-4 mb-1">{t("charts.top_stores")}</h4>
            {sel.topStores.length === 0 ? (
              <p className="text-xs text-subtext">—</p>
            ) : (
              sel.topStores.map((s) => (
                <div key={s.name} className="flex justify-between text-[13px] py-1">
                  <span className="text-text truncate" dir="auto">{s.name}</span>
                  <b className="tabular-nums">{s.orders}</b>
                </div>
              ))
            )}
            <p className="text-[11.5px] text-subtext mt-3">{t("map.inspect_hint")}</p>
          </>
        ) : (
          <p className="text-sm text-subtext py-6 text-center">{t("empty")}</p>
        )}
      </Card>
    </div>
  );
}
