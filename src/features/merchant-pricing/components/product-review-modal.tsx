"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal, Badge, DashIcon } from "@/components/ui";
import { reviewCatalogProduct } from "@/app/d/merchant-pricing/action";
import { REVIEW_STATUS, type CatalogProduct } from "../types";
import { formatDa, formatDate } from "../rows";
import { ReviewDecision } from "./review-decision";
import { DetailField as Field } from "./detail-field";

/** Big cover + clickable thumbnail strip over every photo the merchant uploaded. */
function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const t = useTranslations("merchant_pricing");
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!current) {
    return (
      <div className="h-48 rounded-xl bg-muted text-subtext flex flex-col items-center justify-center gap-2">
        <DashIcon name="image" className="w-7 h-7" />
        <span className="text-xs">{t("product.no_photos")}</span>
      </div>
    );
  }

  return (
    <div>
      <a href={current} target="_blank" rel="noreferrer" className="block">
        <img src={current} alt={alt} className="w-full h-56 rounded-xl object-contain bg-muted" />
      </a>
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {photos.map((src, i) => (
            <button
              key={`${i}-${src}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("product.photo_n", { n: i + 1 })}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                i === active ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover bg-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** New (manual) product review: photos, catalog details, decision. */
export function ProductReviewModal({ product, onClose }: { product: CatalogProduct | null; onClose: () => void }) {
  const t = useTranslations("merchant_pricing");
  const locale = useLocale();
  if (!product) return null;

  const pending = product.reviewStatus === "pending";

  return (
    <Modal open onClose={onClose} title={t("product.title")} widthClassName="max-w-2xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pe-1">
        <PhotoGallery photos={product.photos} alt={product.title} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-text break-words">{product.title}</p>
            {product.fromLibrary && <Badge variant="info">{t("product.from_library")}</Badge>}
          </div>
          <p className="text-xl font-bold text-primary tabular-nums mt-1">{formatDa(product.price)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label={t("col.brand")}>{product.brand || "—"}</Field>
          <Field label={t("col.barcode")} mono>
            {product.barcode || "—"}
          </Field>
          <Field label={t("col.category")}>{product.category || "—"}</Field>
          <Field label={t("col.unit")}>{product.unit || "—"}</Field>
          <Field label={t("col.stock")}>
            <span className="tabular-nums">{product.stock}</span>
          </Field>
          <Field label={t("col.submitted")}>{formatDate(product.createdAt, locale)}</Field>
          <Field label={t("col.store")}>{product.storeName}</Field>
          <Field label={t("col.merchant")}>{product.merchantName || "—"}</Field>
          <Field label={t("col.phone")}>
            <span dir="ltr">{product.merchantPhone || "—"}</span>
          </Field>
        </div>

        <div>
          <p className="text-xs text-subtext mb-1.5">{t("col.description")}</p>
          <p className="text-sm text-text whitespace-pre-wrap break-words rounded-xl bg-muted p-3">
            {product.description || t("product.no_description")}
          </p>
        </div>

        {pending ? (
          // The row version on screen travels with the decision: blink-server refuses
          // it (409) if the merchant edited the product meanwhile.
          <ReviewDecision
            onApprove={() =>
              reviewCatalogProduct(product.id, "approve_product", { expectedUpdatedAt: product.updatedAt })
            }
            onReject={(note) =>
              reviewCatalogProduct(product.id, "reject_product", { note, expectedUpdatedAt: product.updatedAt })
            }
            onDone={onClose}
          />
        ) : (
          <div className="text-center py-2">
            <Badge variant={REVIEW_STATUS[product.reviewStatus]}>{t(`review_status.${product.reviewStatus}`)}</Badge>
            {product.reviewNote && (
              <p className="text-sm text-text mt-3 rounded-xl bg-muted p-3 text-start whitespace-pre-wrap break-words">
                {product.reviewNote}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
