import { Card, ChartHead } from "@/components/ui";
import { ZONES } from "../data";

export function TopZones({
  t,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <ChartHead title={t("charts.top_zones")} description={t("charts.top_zones_desc")} />
      <div>
        {ZONES.map((z, i) => (
          <div key={z.z} className="flex items-center gap-3.5 py-3 border-t border-border first:border-t-0">
            <span className="w-[26px] h-[26px] rounded-lg bg-soft-pink text-primary flex items-center justify-center font-extrabold text-xs shrink-0">
              {i + 1}
            </span>
            <div className="flex-1">
              <b className="block text-sm font-semibold text-text">{z.z}</b>
              <span className="text-[11.5px] text-subtext">{z.area}</span>
            </div>
            <div className="w-[90px] h-[7px] rounded-full bg-muted overflow-hidden">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${z.load}%` }} />
            </div>
            <span className={`text-xs font-bold min-w-[46px] text-end ${z.tr >= 0 ? "text-success" : "text-danger"}`}>
              {z.tr >= 0 ? "▲" : "▼"} {Math.abs(z.tr)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
