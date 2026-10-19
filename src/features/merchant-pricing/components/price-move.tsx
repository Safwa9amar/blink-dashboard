"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { formatDa } from "../rows";
import { PRICE_SOURCE_VARIANT, percentChange, priceDirection, type PriceSource } from "../price-changes";

/** "100 Da → 80 Da  ↓ 20%" — a first price (created / baseline) shows the price alone. */
export function PriceMove({ oldPrice, newPrice }: { oldPrice: number | null; newPrice: number }) {
  const dir = priceDirection(oldPrice, newPrice);
  const pct = percentChange(oldPrice, newPrice);
  const tone = dir === "up" ? "text-warning" : dir === "down" ? "text-info" : "text-subtext";

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 tabular-nums">
      {oldPrice !== null && (
        <>
          <span className="text-subtext whitespace-nowrap">{formatDa(oldPrice)}</span>
          <span className="text-subtext rtl:rotate-180" aria-hidden>
            →
          </span>
        </>
      )}
      <span className="font-semibold text-text whitespace-nowrap">{formatDa(newPrice)}</span>
      {(dir === "up" || dir === "down") && (
        <span className={`text-xs font-semibold whitespace-nowrap ${tone}`} dir="ltr">
          {dir === "up" ? "↑" : "↓"}
          {pct !== null && ` ${Math.abs(pct).toFixed(1)}%`}
        </span>
      )}
    </span>
  );
}

export function SourceBadge({ source }: { source: PriceSource }) {
  const t = useTranslations("merchant_pricing");
  return <Badge variant={PRICE_SOURCE_VARIANT[source]}>{t(`changes.source.${source}`)}</Badge>;
}
