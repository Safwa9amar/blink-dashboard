import { Fragment } from "react";
import { Card, ChartHead } from "@/components/ui";
import { HEAT_COLS, HEAT_ROWS, heatColor } from "../data";

export function DemandHeatmap({
  t,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <ChartHead
        title={t("charts.heatmap")}
        description={t("charts.heatmap_desc")}
        right={
          <div className="flex gap-1.5 items-center text-xs text-subtext">
            {t("charts.low")}
            <span className="w-3.5 h-2.5 rounded-[3px]" style={{ background: heatColor(20) }} />
            <span className="w-3.5 h-2.5 rounded-[3px]" style={{ background: heatColor(60) }} />
            <span className="w-3.5 h-2.5 rounded-[3px]" style={{ background: heatColor(100) }} />
            {t("charts.high")}
          </div>
        }
      />
      <div className="grid gap-[5px] text-[11px]" style={{ gridTemplateColumns: "auto repeat(6,1fr)" }}>
        <div />
        {HEAT_COLS.map((c) => (
          <div key={c} className="text-subtext font-semibold text-[10px] uppercase tracking-wide p-1 text-center">
            {c}
          </div>
        ))}
        {HEAT_ROWS.map(([row, vals]) => (
          <Fragment key={row}>
            <div className="text-subtext text-[11px] flex items-center pe-1.5 whitespace-nowrap">{row}</div>
            {vals.map((v, i) => (
              <div
                key={i}
                className="aspect-[1.6/1] rounded-md flex items-center justify-center font-bold text-[11px] text-white min-h-[26px]"
                style={{ background: heatColor(v) }}
              >
                {v}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </Card>
  );
}
