"use client";

import { Modal, Badge, Button } from "@/components/ui";
import {
  PACK_STATUS,
  STANDARD_DELIVERY_FEE,
  packOriginalPrice,
  packDiscountAmount,
  packFinalPrice,
  type Pack,
  type TFn,
} from "../data";

interface Props {
  t: TFn;
  pack: Pack | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: Pack["status"]) => void;
}

export function PackDetailModal({ t, pack, open, onClose, onStatusChange }: Props) {
  if (!pack) return null;

  const original = packOriginalPrice(pack.items);
  const discount = packDiscountAmount(pack);
  const final_ = packFinalPrice(pack);
  const deliveryFee = pack.freeDelivery ? 0 : STANDARD_DELIVERY_FEE;

  return (
    <Modal open={open} onClose={onClose} title={pack.name}>
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-subtext">{pack.storeName}</p>
            <p className="text-xs text-subtext">{new Date(pack.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge variant={PACK_STATUS[pack.status]}>{t("status." + pack.status)}</Badge>
        </div>

        {/* Items */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-card-hover text-xs font-medium text-subtext uppercase tracking-wider">
            {t("detail.items")} ({pack.items.length})
          </div>
          {pack.items.map((item, i) => (
            <div key={i} className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">{item.product.name}</p>
                {item.qtyPromoEnabled && (
                  <p className="text-xs text-primary">
                    {t("detail.buy_x_get_y", { buy: item.buyQty, get: item.getQty })}
                  </p>
                )}
              </div>
              <div className="text-end">
                <p className="text-sm tabular-nums">{item.quantity} x {item.product.price} Da</p>
                <p className="text-xs text-subtext tabular-nums">{item.quantity * item.product.price} Da</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing summary */}
        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-subtext">{t("detail.original")}</span>
            <span className="tabular-nums">{original} Da</span>
          </div>
          {pack.discountPercent > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>{t("detail.discount", { pct: pack.discountPercent })}</span>
              <span className="tabular-nums">-{discount} Da</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-subtext">{t("detail.delivery")}</span>
            <span className="tabular-nums">{pack.freeDelivery ? t("free") : `${deliveryFee} Da`}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>{t("detail.total")}</span>
            <span className="text-primary tabular-nums">{final_ + deliveryFee} Da</span>
          </div>
        </div>

        {/* Promo badges */}
        <div className="flex flex-wrap gap-2">
          {pack.discountPercent > 0 && <Badge variant="info">{pack.discountPercent}% {t("off")}</Badge>}
          {pack.freeDelivery && <Badge variant="success">{t("free_delivery")}</Badge>}
          {pack.items.some((i) => i.qtyPromoEnabled) && <Badge variant="warning">{t("qty_promo")}</Badge>}
        </div>

        {/* Actions */}
        {pack.status === "reviewing" && (
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" icon="check" onClick={() => { onStatusChange(pack.id, "active"); onClose(); }}>
              {t("action.approve")}
            </Button>
            <Button className="flex-1" variant="secondary" icon="x" onClick={() => { onStatusChange(pack.id, "inactive"); onClose(); }}>
              {t("action.reject")}
            </Button>
          </div>
        )}
        {pack.status === "active" && (
          <Button className="w-full" variant="secondary" onClick={() => { onStatusChange(pack.id, "archived"); onClose(); }}>
            {t("action.archive")}
          </Button>
        )}
        {(pack.status === "inactive" || pack.status === "archived") && (
          <Button className="w-full" onClick={() => { onStatusChange(pack.id, "active"); onClose(); }}>
            {t("action.reactivate")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
