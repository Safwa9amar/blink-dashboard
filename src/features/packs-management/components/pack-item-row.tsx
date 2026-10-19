"use client";

import { useTranslations } from "next-intl";
import { Badge, DashIcon, Stepper, Toggle } from "@/components/ui";
import { freeUnits } from "../pricing";
import { formatDa } from "../rows";
import { PACK_LIMITS } from "../draft";
import type { PackDraftErrorKey, PackDraftItem, PackLineProduct } from "../types";
import { PackThumb } from "./pack-thumb";

/**
 * One pack line in the editor: product (flagged when customers can't get it),
 * quantity stepper, line total at the live price, buy-X-get-Y switch with its
 * buy / get steppers and the free units it gives, remove.
 */
export function PackItemRow({
  item,
  product,
  error,
  onChange,
  onRemove,
}: {
  item: PackDraftItem;
  /** Undefined when the product isn't known at all (deleted). */
  product: PackLineProduct | undefined;
  error?: PackDraftErrorKey;
  onChange: (next: PackDraftItem) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("packs");
  const name = product?.title ?? t("editor.items.unknown_product");
  const issue = product ? product.issue : "missing";
  const price = product?.price ?? 0;
  const free = freeUnits(item);
  const steps = { decrease: t("editor.items.decrease"), increase: t("editor.items.increase") };

  return (
    <div className="px-4 py-3 border-t border-border first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <PackThumb src={product?.image} icon="package" className="w-10 h-10" />
        <div className="min-w-0 flex-1 basis-40">
          <p className={`text-sm font-medium break-words ${issue ? "text-danger" : "text-text"}`} dir="auto">
            {name}
          </p>
          <p className="text-xs text-subtext tabular-nums">
            {product?.unit && <span dir="auto">{product.unit} · </span>}
            {formatDa(price)}
          </p>
          {issue && <p className="text-xs text-danger">{t(`issue.${issue}`)}</p>}
        </div>
        <Stepper
          value={item.quantity}
          min={1}
          max={PACK_LIMITS.quantityMax}
          label={t("editor.items.quantity_of", { name })}
          labels={steps}
          invalid={error === "quantity_range"}
          onChange={(quantity) => onChange({ ...item, quantity })}
        />
        <span className="w-24 text-end text-sm font-semibold text-text tabular-nums">
          {formatDa(price * item.quantity)}
        </span>
        <button
          type="button"
          aria-label={t("editor.items.remove", { name })}
          onClick={onRemove}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
        >
          <DashIcon name="trash" className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 ps-[52px]">
        <Toggle
          on={item.qtyPromo}
          label={t("editor.items.promo_of", { name })}
          onClick={() => onChange({ ...item, qtyPromo: !item.qtyPromo })}
        />
        <span className="text-xs font-semibold text-text">{t("editor.items.promo")}</span>
        {item.qtyPromo && (
          <>
            <span className="text-xs text-subtext">{t("editor.items.buy")}</span>
            <Stepper
              value={item.buyQty}
              min={1}
              max={PACK_LIMITS.promoMax}
              label={t("editor.items.buy_of", { name })}
              labels={steps}
              invalid={error === "promo_range"}
              onChange={(buyQty) => onChange({ ...item, buyQty })}
            />
            <span className="text-xs text-subtext">{t("editor.items.get")}</span>
            <Stepper
              value={item.getQty}
              min={1}
              max={PACK_LIMITS.promoMax}
              label={t("editor.items.get_of", { name })}
              labels={steps}
              invalid={error === "promo_range"}
              onChange={(getQty) => onChange({ ...item, getQty })}
            />
            {free > 0 && <Badge variant="success">{t("free_units", { n: free })}</Badge>}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger mt-1.5 ps-[52px]">
          {t(`editor.validation.${error}`)}
        </p>
      )}
    </div>
  );
}
