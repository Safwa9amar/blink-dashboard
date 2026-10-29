"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { formatDa } from "../format";
import { wilayaName } from "../labels";
import type { BreakdownLine, BreakdownStep, SimPlace, TFn, Tier } from "../types";
import { tierName } from "../zones";

// Adjustments can lower the price; the other steps only add to it.
const ADJUSTMENTS: BreakdownStep[] = ["multiplier", "clamp", "rounding"];

/** The server's `breakdown`, one line per step. Pure display: amounts come from blink-server. */
export function BreakdownList({ lines }: { lines: BreakdownLine[] }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  return (
    <ol className="divide-y divide-border rounded-xl border border-border">
      {lines.map((l, i) => {
        const sign = ADJUSTMENTS.includes(l.step) && l.amount > 0 ? "+" : "";
        return (
          <li key={`${l.step}-${i}`} className={`flex items-center justify-between gap-3 px-3.5 py-2 text-[13px] ${l.amount === 0 ? "opacity-55" : ""}`}>
            <span className="text-subtext">
              <span className="me-2 tabular-nums text-[11px] opacity-70">{i + 1}</span>
              {t(`simulator.steps.${l.step}`)}
            </span>
            <span className="font-semibold text-text tabular-nums">
              {sign}
              {formatDa(l.amount, tf)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Where the priced point is: wilaya · zone (or "unzoned") · tier. */
export function PlaceLine({ place, tiers }: { place: SimPlace; tiers: Tier[] }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
      <span className="text-subtext">{t("simulator.place")}</span>
      {place.wilaya_code && <Badge variant="primary">{wilayaName(place.wilaya_code, locale)}</Badge>}
      {place.zone ? <Badge variant="success">{place.zone.name}</Badge> : <Badge variant="warning">{t("zones.unzoned")}</Badge>}
      {place.tier && <Badge>{tierName(tiers, place.tier, locale)}</Badge>}
    </div>
  );
}
