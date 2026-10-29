"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Skeleton } from "@/components/ui";
import { formatDa, num } from "../format";
import { wilayaName } from "../labels";
import type { TFn, Tier, ZoneLookup } from "../types";
import { tierName } from "../zones";
import { useClassName } from "./vehicle-classes-context";

/** Popup body for a map click: where the point is priced and what a 5 km trip costs there (server numbers). */
export function ZoneLookupCard({
  loading,
  error,
  data,
  tiers,
  canEdit = false,
  onSetZonePrices,
}: {
  loading: boolean;
  error?: string;
  data: ZoneLookup | null;
  tiers: Tier[];
  canEdit?: boolean;
  /** Opens the override wizard on the zone under the clicked point. */
  onSetZonePrices?: (zoneId: string) => void;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const className = useClassName();
  if (loading) return <Skeleton className="h-24 w-52" />;
  if (error || !data) return <p className="text-xs text-danger">{error ?? t("errors.generic", { detail: "" })}</p>;
  const { place, samples } = data;
  return (
    <div className="text-xs space-y-2 min-w-[210px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {place.wilaya_code && <Badge variant="primary">{wilayaName(place.wilaya_code, locale)}</Badge>}
        {place.zone ? <Badge variant="success">{place.zone.name}</Badge> : <Badge variant="warning">{t("zones.unzoned")}</Badge>}
        <Badge>{tierName(tiers, place.tier, locale)}</Badge>
      </div>
      {place.unzoned && <p className="text-[11.5px] opacity-80">{t("zones.lookup.unzoned_note", { tier: tierName(tiers, place.tier, locale) })}</p>}
      <div>
        <p className="font-semibold mb-1">{t("zones.lookup.samples")}</p>
        <ul className="space-y-0.5">
          {samples.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <span>
                {t(`simulator.scenario.${s.scenario}`)} · {className(s.vehicle)} · {num(s.km)} {t("units.km")}
              </span>
              <span className="font-semibold tabular-nums">
                {s.scenario === "store" && s.mode !== "distance" && s.fare === null
                  ? t("zones.lookup.merchant_fee")
                  : s.available && s.fare !== null
                    ? formatDa(s.fare, tf)
                    : t(`zones.lookup.unavailable.${s.unavailable ?? "unknown"}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {canEdit && place.zone && onSetZonePrices && (
        <Button type="button" size="xs" icon="plus" onClick={() => onSetZonePrices(place.zone!.id)}>
          {t("zones.lookup.set_zone_prices", { zone: place.zone.name })}
        </Button>
      )}
      {canEdit && !place.zone && (
        <Link href={`/pricing/tiers?tier=${encodeURIComponent(place.tier)}`} className="inline-block text-[12px] font-semibold text-primary">
          {t("zones.lookup.set_tier_prices", { tier: tierName(tiers, place.tier, locale) })}
        </Link>
      )}
    </div>
  );
}
