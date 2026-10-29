"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { wilayaLabel } from "../wilayas";

export function ScopeChips({
  service,
  wilaya_code,
  partner,
  zone,
  tier,
}: {
  service?: string | null;
  wilaya_code?: string | null;
  /** Partner display name (or id fallback). */
  partner?: string | null;
  /** Zone display name. */
  zone?: string | null;
  /** Tier display name. */
  tier?: string | null;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  if (!service && !wilaya_code && !partner && !zone && !tier) return <span className="text-subtext text-xs">{t("scope.everywhere")}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {service && <Badge variant="info">{t(`services.${service}`)}</Badge>}
      {zone && <Badge variant="success">{zone}</Badge>}
      {tier && <Badge variant="default">{tier}</Badge>}
      {wilaya_code && <Badge variant="primary">{wilayaLabel(wilaya_code, locale)}</Badge>}
      {partner && <Badge variant="warning">{partner}</Badge>}
    </div>
  );
}
