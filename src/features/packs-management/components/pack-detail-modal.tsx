"use client";

import { useLocale, useTranslations } from "next-intl";
import { Modal, Badge } from "@/components/ui";
import { PACK_STATUS, type Pack } from "../types";
import { formatDa, formatDate } from "../rows";
import { PackDecision } from "./pack-decision";
import { PackThumb } from "./pack-thumb";

/** One pack: contents with live prices, pricing summary, review note and staff actions. */
export function PackDetailModal({ pack, onClose }: { pack: Pack | null; onClose: () => void }) {
  const t = useTranslations("packs");
  const locale = useLocale();
  if (!pack) return null;

  const deliveryFee = pack.freeDelivery ? 0 : pack.storeDeliveryFee;

  return (
    <Modal open onClose={onClose} title={pack.name} widthClassName="max-w-xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pe-1">
        {/* Header info */}
        <div className="flex items-center gap-3">
          <PackThumb src={pack.image} className="w-14 h-14" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">{pack.storeName}</p>
            <p className="text-xs text-subtext">
              {pack.merchantName || "—"}
              {pack.merchantPhone && (
                <span dir="ltr" className="ms-1.5">
                  {pack.merchantPhone}
                </span>
              )}
            </p>
            <p className="text-xs text-subtext">{t("detail.created", { date: formatDate(pack.createdAt, locale) })}</p>
          </div>
          <Badge variant={PACK_STATUS[pack.status]}>{t(`status.${pack.status}`)}</Badge>
        </div>

        {pack.description && (
          <p className="text-sm text-text whitespace-pre-wrap break-words rounded-xl bg-muted p-3">{pack.description}</p>
        )}

        {/* Items */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-card-hover text-xs font-medium text-subtext">
            {t("detail.items")} ({pack.items.length})
          </div>
          {pack.items.map((item, i) => (
            <div key={`${i}-${item.productId}`} className="px-4 py-3 border-t border-border flex items-center gap-3">
              <PackThumb src={item.image} icon="package" className="w-9 h-9" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium break-words ${item.issue ? "text-danger" : "text-text"}`}>
                  {item.name ?? t("detail.missing_product")}
                </p>
                {item.issue && item.issue !== "missing" && (
                  <p className="text-xs text-danger">{t(`issue.${item.issue}`)}</p>
                )}
                {item.qtyPromo && item.buyQty > 0 && item.getQty > 0 && (
                  <p className="text-xs text-primary">
                    {t("detail.buy_x_get_y", { buy: item.buyQty, get: item.getQty })}
                  </p>
                )}
              </div>
              <div className="text-end shrink-0">
                <p className="text-sm tabular-nums" dir="ltr">
                  {item.quantity} × {formatDa(item.unitPrice)}
                </p>
                {item.freeQty > 0 && (
                  <p className="text-xs text-success">{t("free_units", { n: item.freeQty })}</p>
                )}
                <p className="text-xs text-subtext tabular-nums">{formatDa(item.quantity * item.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Same rule as blink-server's store page: one unsellable item hides the whole pack. */}
        {!pack.sellable && (pack.status === "active" || pack.status === "under_review") && (
          <p role="note" className="text-xs text-danger bg-danger-light rounded-xl p-3">
            {pack.items.length === 0
              ? t("detail.unsellable_empty")
              : pack.status === "under_review"
                ? t("detail.unsellable_review")
                : t("detail.unsellable_active")}
          </p>
        )}

        {/* Pricing summary */}
        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-subtext">{t("detail.original")}</span>
            <span className="tabular-nums">{formatDa(pack.originalPrice)}</span>
          </div>
          {pack.discountPercent > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>{t("detail.discount", { pct: pack.discountPercent })}</span>
              <span className="tabular-nums" dir="ltr">
                -{formatDa(pack.savings)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span>{t("detail.pack_price")}</span>
            <span className="tabular-nums">{formatDa(pack.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-subtext">{t("detail.delivery")}</span>
            <span className="tabular-nums">
              {pack.freeDelivery ? (
                <>
                  {pack.storeDeliveryFee > 0 && (
                    <span className="line-through text-subtext me-1.5">{formatDa(pack.storeDeliveryFee)}</span>
                  )}
                  <span className="text-success">{t("free")}</span>
                </>
              ) : (
                formatDa(deliveryFee)
              )}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>{t("detail.total")}</span>
            <span className="text-primary tabular-nums">{formatDa(pack.price + deliveryFee)}</span>
          </div>
        </div>

        {/* Promo badges */}
        <div className="flex flex-wrap gap-2">
          {pack.discountPercent > 0 && (
            <Badge variant="info">{t("pct_off", { pct: pack.discountPercent })}</Badge>
          )}
          {pack.freeDelivery && <Badge variant="success">{t("free_delivery")}</Badge>}
          {pack.freeCount > 0 && <Badge variant="warning">{t("qty_promo")}</Badge>}
        </div>

        {pack.status === "under_review" && pack.freeDelivery && (
          <p className="text-xs text-subtext">{t("detail.free_delivery_hint")}</p>
        )}

        {/* Staff note / approval trail */}
        {(pack.reviewNote || pack.reviewedAt) && (
          <div className="rounded-xl bg-muted p-3 space-y-1">
            {pack.reviewedAt && (
              <p className="text-xs text-subtext">
                {t("detail.reviewed_at", { date: formatDate(pack.reviewedAt, locale) })}
              </p>
            )}
            {pack.reviewNote && (
              <>
                <p className="text-xs text-subtext">{t("detail.review_note")}</p>
                <p className="text-sm text-text whitespace-pre-wrap break-words">{pack.reviewNote}</p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        {pack.status === "under_review" && (
          <PackDecision packId={pack.id} expectedUpdatedAt={pack.updatedAt} mode="review" onDone={onClose} />
        )}
        {pack.status === "active" && (
          <PackDecision packId={pack.id} expectedUpdatedAt={pack.updatedAt} mode="deactivate" onDone={onClose} />
        )}
      </div>
    </Modal>
  );
}
