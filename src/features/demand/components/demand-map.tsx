"use client";

import { Fragment } from "react";
import { Card, Badge } from "@/components/ui";
import { MAP_ZONES, RIDERS, heatColor } from "../data";
import type { MapZone } from "../types";

export function DemandMap({
  selected,
  onSelect,
  t,
}: {
  selected: string;
  onSelect: (z: string) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const sel = MAP_ZONES.find((z) => z.z === selected) || MAP_ZONES[0];
  const bubbleSize = (load: number) => 30 + (load / 100) * 54;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      <div className="bg-card border border-border rounded-2xl overflow-hidden relative">
        <div className="relative w-full aspect-[16/11] bg-muted overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 550" preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="550" fill="var(--muted)" />
            <path
              d="M0 0 H800 V92 C620 150 460 70 300 118 C190 150 90 110 0 140 Z"
              fill="color-mix(in srgb, var(--info) 16%, var(--muted))"
            />
            <path
              d="M0 140 C90 110 190 150 300 118 C460 70 620 150 800 92"
              fill="none"
              stroke="color-mix(in srgb, var(--info) 40%, transparent)"
              strokeWidth="2"
            />
            <g stroke="var(--border)" strokeWidth="6" fill="none" opacity="0.9">
              <path d="M60 150 L360 300 L760 250" />
              <path d="M120 520 L300 320 L520 360 L720 180" />
              <path d="M400 540 L420 320 L520 150" />
              <path d="M40 360 L300 320 L640 460" />
              <path d="M700 540 L620 300 L760 120" />
            </g>
            <g stroke="var(--border)" strokeWidth="2.5" fill="none" opacity="0.5">
              <path d="M200 180 L240 420" />
              <path d="M520 200 L480 500" />
              <path d="M120 280 L700 300" />
              <path d="M300 130 L340 520" />
              <path d="M600 160 L560 520" />
            </g>
          </svg>

          {RIDERS.map(([x, y], i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-info border-2 border-card"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}

          {MAP_ZONES.map((z) => {
            const s = bubbleSize(z.load);
            const isHot = z.load >= 90;
            const isSel = z.z === sel.z;
            return (
              <Fragment key={z.z}>
                <button
                  type="button"
                  onClick={() => onSelect(z.z)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer border-2 hover:scale-110 transition-transform"
                  style={{
                    left: `${z.x}%`,
                    top: `${z.y}%`,
                    width: s,
                    height: s,
                    background: heatColor(z.load),
                    borderColor: isSel ? "#fff" : "rgba(255,255,255,0.6)",
                    boxShadow: isSel ? "0 0 0 3px var(--primary)" : "none",
                  }}
                >
                  {isHot && <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />}
                  <span className="font-extrabold text-white leading-none z-[1]" style={{ fontSize: s > 56 ? 18 : 13 }}>
                    {z.orders}
                  </span>
                </button>
                <div
                  className="absolute -translate-x-1/2 text-[10px] font-semibold text-text px-[7px] py-0.5 rounded-full whitespace-nowrap pointer-events-none"
                  style={{
                    left: `${z.x}%`,
                    top: `calc(${z.y}% + ${s / 2 + 4}px)`,
                    background: "color-mix(in srgb,var(--card) 86%,transparent)",
                  }}
                >
                  {z.z}
                </div>
              </Fragment>
            );
          })}

          <div className="absolute start-3.5 bottom-3.5 bg-card/90 backdrop-blur border border-border rounded-xl px-3 py-2.5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-subtext uppercase tracking-wide">{t("map.demand")}</span>
            <div className="flex items-center gap-2 text-[11px] text-text">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              {t("map.light")}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text">
              <span className="w-[18px] h-[18px] rounded-full bg-primary" />
              {t("map.heavy")}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text">
              <span className="w-[9px] h-[9px] rounded-full bg-info" />
              {t("map.online_rider")}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="text-lg font-extrabold text-text">{sel.z}</div>
          <div className="text-xs text-subtext mb-3.5">{sel.area}</div>
          <SelRow k={t("map.live_orders")} v={sel.orders} first />
          <SelRow k={t("map.online_riders")} v={sel.riders} />
          <SelRow k={t("map.demand_load")} v={<span className="text-primary">{sel.load}%</span>} />
          <SelRow k={t("map.avg_wait")} v={sel.wait} />
          <SelRow k={t("map.unmet_demand")} v={<span style={{ color: sel.unmet > 6 ? "var(--danger)" : "var(--text)" }}>{sel.unmet}</span>} />
          <p className="text-[11.5px] text-subtext mt-2.5">{t("map.inspect_hint")}</p>
        </Card>
        <Card title={t("map.surge_suggestion")}>
          <div className="flex justify-between items-center py-2.5 text-[13px]">
            <span className="text-subtext">{t("map.status")}</span>
            <Badge variant={sel.unmet > 6 ? "danger" : "success"}>
              {sel.unmet > 6 ? t("map.rebalance") : t("map.balanced")}
            </Badge>
          </div>
          <p className="text-[11.5px] text-subtext mt-1">
            {sel.unmet > 6
              ? t("map.rebalance_hint", { zone: sel.z, unmet: sel.unmet, riders: Math.ceil(sel.unmet / 2) })
              : t("map.balanced_hint", { zone: sel.z })}
          </p>
        </Card>
      </div>
    </div>
  );
}

function SelRow({ k, v, first }: { k: string; v: React.ReactNode; first?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 text-[13px] ${first ? "" : "border-t border-border"}`}>
      <span className="text-subtext">{k}</span>
      <span className="font-bold text-text">{v}</span>
    </div>
  );
}

export type { MapZone };
