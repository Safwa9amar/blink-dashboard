"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, ChartHead } from "@/components/ui";
import { HEAT_BANDS, WEEK_KEYS } from "../aggregate";
import type { HeatGrid } from "../types";

const shade = (ratio: number) => `color-mix(in srgb, var(--primary) ${Math.round(10 + ratio * 90)}%, transparent)`;

export function DemandHeatmap({ heat, total }: { heat: HeatGrid; total: number }) {
  const t = useTranslations("demand");
  const bandLabel = ([a, b]: [number, number]) => `${String(a).padStart(2, "0")}–${String(b).padStart(2, "0")}`;
  return (
    <Card>
      <ChartHead
        title={t("charts.heatmap")}
        description={t("charts.heatmap_desc")}
        right={
          total > 0 ? (
            <div className="flex gap-1.5 items-center text-xs text-subtext" dir="ltr">
              0
              {[0.1, 0.35, 0.6, 1].map((r) => (
                <span key={r} className="w-3.5 h-2.5 rounded-[3px]" style={{ background: shade(r) }} />
              ))}
              {heat.max}
            </div>
          ) : undefined
        }
      />
      {total === 0 ? (
        <p className="text-sm text-subtext py-12 text-center">{t("empty")}</p>
      ) : (
        <div className="grid gap-[5px] text-[11px]" style={{ gridTemplateColumns: "auto repeat(6,1fr)" }}>
          <div />
          {HEAT_BANDS.map((b) => (
            <div key={b[0]} dir="ltr" className="text-subtext font-semibold text-[10px] p-1 text-center">
              {bandLabel(b)}
            </div>
          ))}
          {WEEK_KEYS.map((day, d) => (
            <Fragment key={day}>
              <div className="text-subtext text-[11px] flex items-center pe-1.5 whitespace-nowrap">{t(`weekdays.${day}`)}</div>
              {heat.cells[d].map((v, i) => {
                const ratio = heat.max ? v / heat.max : 0;
                return (
                  <div
                    key={i}
                    className={`rounded-md flex items-center justify-center font-bold text-[11px] min-h-[28px] ${ratio > 0.55 ? "text-white" : "text-text"}`}
                    style={{ background: v ? shade(ratio) : "var(--muted)" }}
                  >
                    {v || ""}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      )}
    </Card>
  );
}
