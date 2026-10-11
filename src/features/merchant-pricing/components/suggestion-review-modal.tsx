"use client";

import { useTranslations } from "next-intl";
import { Modal, Badge } from "@/components/ui";
import { reviewCatalogProduct } from "@/app/d/merchant-pricing/action";
import { SUGGESTION_STATUS, type CatalogProduct } from "../types";
import { formatDa, isOverTolerance } from "../rows";
import { DeviationBadge } from "./deviation-badge";
import { ProductThumb } from "./product-thumb";
import { ReviewDecision } from "./review-decision";
import { DetailField as Field } from "./detail-field";

/** Price suggestion review: reference vs current vs suggested price, deviation, decision. */
export function SuggestionReviewModal({ product, onClose }: { product: CatalogProduct | null; onClose: () => void }) {
  const t = useTranslations("merchant_pricing");
  if (!product) return null;

  const over = isOverTolerance(product.deviation);
  const pending = product.suggestionStatus === "pending";

  return (
    <Modal open onClose={onClose} title={t("review.title")} widthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ProductThumb src={product.photos[0]} className="w-14 h-14" />
          <div className="min-w-0">
            <p className="text-base font-bold text-text break-words">{product.title}</p>
            <p className="text-xs text-subtext">{[product.brand, product.unit].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("col.store")}>{product.storeName}</Field>
          <Field label={t("col.merchant")}>
            {product.merchantName || "—"}
            {product.merchantPhone && (
              <span className="block text-xs font-normal text-subtext" dir="ltr">
                {product.merchantPhone}
              </span>
            )}
          </Field>
          <Field label={t("col.category")}>{product.category || "—"}</Field>
          <Field label={t("col.barcode")} mono>
            {product.barcode || "—"}
          </Field>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-subtext">{t("review.blink_price")}</span>
            <span className="text-sm font-bold tabular-nums">
              {product.blinkPrice > 0 ? formatDa(product.blinkPrice) : t("review.no_reference")}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-subtext">{t("review.current_price")}</span>
            <span className="text-sm tabular-nums">{formatDa(product.price)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center gap-3">
            <span className="text-sm font-medium text-text">{t("review.suggested_price")}</span>
            <span className="text-base font-bold text-primary tabular-nums">
              {product.suggestedPrice !== null ? formatDa(product.suggestedPrice) : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-subtext">
              {product.blinkPrice > 0 ? t("review.deviation") : t("review.deviation_current")}
            </span>
            <DeviationBadge deviation={product.deviation} />
          </div>
          {over && <p className="text-xs text-danger">{t("review.over_tolerance")}</p>}
        </div>

        {product.reviewStatus === "pending" && (
          <p role="note" className="text-xs text-warning bg-warning-light rounded-xl p-3">
            {t("review.product_pending")}
          </p>
        )}

        {pending ? (
          <>
            <p className="text-xs text-subtext">{t("review.accept_hint")}</p>
            {/* The suggested price on screen travels with the decision: blink-server
                refuses it (409) if the merchant changed the suggestion meanwhile. */}
            <ReviewDecision
              onApprove={() =>
                reviewCatalogProduct(product.id, "approve_price", {
                  expectedSuggestedPrice: product.suggestedPrice,
                })
              }
              onReject={(note) =>
                reviewCatalogProduct(product.id, "reject_price", {
                  note,
                  expectedSuggestedPrice: product.suggestedPrice,
                })
              }
              onDone={onClose}
            />
          </>
        ) : (
          product.suggestionStatus && (
            <div className="text-center py-2">
              <Badge variant={SUGGESTION_STATUS[product.suggestionStatus]}>
                {t(`status.${product.suggestionStatus}`)}
              </Badge>
              {product.reviewNote && (
                <p className="text-sm text-text mt-3 rounded-xl bg-muted p-3 text-start whitespace-pre-wrap break-words">
                  {product.reviewNote}
                </p>
              )}
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
