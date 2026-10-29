"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { fmtDay } from "../labels";
import { wilayaLabel } from "../wilayas";

export function ScopeChips({
  service,
  wilaya_code,
  partner,
  zone,
  tier,
  startsAt,
  endsAt,
}: {
  service?: string | null;
  wilaya_code?: string | null;
  /** Partner display name (or id fallback). */
  partner?: string | null;
  /** Zone display name. */
  zone?: string | null;
  /** Tier display name. */
  tier?: string | null;
  /** ISO dates of the window; shown as "from 12 Nov" / "until 12 Nov". */
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const dates = [startsAt && t("scope.from", { date: fmtDay(startsAt, locale) }), endsAt && t("scope.until", { date: fmtDay(endsAt, locale) })]
    .filter(Boolean)
    .join(" ");
  if (!service && !wilaya_code && !partner && !zone && !tier && !dates) return <span className="text-subtext text-xs">{t("scope.everywhere")}</span>;
  // Reads like a sentence: place, then who, then what, then when ("Rural · Courier · until 12 Nov").
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("overrides.col.scope")}>
      {zone && <Badge variant="success">{zone}</Badge>}
      {tier && <Badge variant="default">{tier}</Badge>}
      {wilaya_code && <Badge variant="primary">{wilayaLabel(wilaya_code, locale)}</Badge>}
      {partner && <Badge variant="warning">{partner}</Badge>}
      {service && <Badge variant="info">{t(`services.${service}`)}</Badge>}
      {dates && <span className="text-[11.5px] font-medium text-subtext">{dates}</span>}
    </div>
  );
}
