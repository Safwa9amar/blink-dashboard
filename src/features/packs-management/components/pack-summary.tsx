"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui";
import type { PackPricing } from "../pricing";
import { formatDa } from "../rows";

/**
 * The editor's live price breakdown, from the same pricing mirror the list uses:
 * items bought separately, discount, pack price, delivery (free = the merchant
 * covers the store's fee) and what the customer pays.
 */
export function PackSummary({
  pricing,
  deliveryFee,
  freeDelivery,
  hasItems,
  unsellable,
}: {
  pricing: PackPricing;
  /** The store's delivery fee; null before a store is picked. */
  deliveryFee: number | null;
  freeDelivery: boolean;
  hasItems: boolean;
  /** Some line keeps the pack off the store page. */
  unsellable: boolean;
}) {
  const t = useTranslations("packs");
  const fee = deliveryFee ?? 0;
  const charged = freeDelivery ? 0 : fee;

  return (
    <Card title={t("editor.summary.title")}>
      {!hasItems ? (
        <p className="text-sm text-subtext">{t("editor.summary.empty")}</p>
      ) : (
        <div className="space-y-2 text-sm">
          {row(
            t("editor.summary.items"),
            <>
              {t("items_count", { n: pricing.itemCount })}
              {pricing.freeCount > 0 && (
                <span className="block text-xs text-success">{t("free_units", { n: pricing.freeCount })}</span>
              )}
            </>
          )}
          {row(t("editor.summary.original"), formatDa(pricing.originalPrice))}
          {pricing.discountPercent > 0 && (
            <div className="flex justify-between gap-3 text-success">
              <span>{t("editor.summary.discount", { pct: pricing.discountPercent })}</span>
              <span className="tabular-nums" dir="ltr">
                -{formatDa(pricing.savings)}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-3 font-semibold text-text">
            <span>{t("editor.summary.price")}</span>
            <span className="tabular-nums">{formatDa(pricing.price)}</span>
          </div>
          {row(
            t("editor.summary.delivery"),
            deliveryFee === null ? (
              "—"
            ) : freeDelivery ? (
              <>
                {fee > 0 && <span className="line-through text-subtext me-1.5">{formatDa(fee)}</span>}
                <span className="text-success">{t("free")}</span>
                <span className="block text-xs text-subtext">{t("editor.summary.merchant_covers")}</span>
              </>
            ) : (
              formatDa(fee)
            )
          )}
          <div className="border-t border-border pt-2 flex justify-between gap-3 font-bold">
            <span>{t("editor.summary.total")}</span>
            <span className="text-primary tabular-nums">{formatDa(pricing.price + charged)}</span>
          </div>

          {(pricing.discountPercent > 0 || freeDelivery || pricing.freeCount > 0) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {pricing.discountPercent > 0 && <Badge variant="info">{t("pct_off", { pct: pricing.discountPercent })}</Badge>}
              {freeDelivery && <Badge variant="success">{t("free_delivery")}</Badge>}
              {pricing.freeCount > 0 && <Badge variant="warning">{t("qty_promo")}</Badge>}
            </div>
          )}

          {unsellable && (
            <p role="note" className="text-xs text-danger bg-danger-light rounded-xl p-3 mt-2">
              {t("editor.summary.unsellable")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** A label / value line of the breakdown. */
function row(label: string, value: ReactNode) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-subtext">{label}</span>
      <span className="text-end tabular-nums text-text">{value}</span>
    </div>
  );
}
