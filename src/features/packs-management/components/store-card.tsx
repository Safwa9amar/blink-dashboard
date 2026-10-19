"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge, DashIcon, type Variant } from "@/components/ui";
import { formatDa } from "../rows";
import type { PackStoreOption } from "../types";

const STORE_STATUS: Record<string, Variant> = { active: "success", under_review: "warning", inactive: "default" };

/** A store as the editor shows it: name, owner, delivery fee and status (+ a warning when it isn't live). */
export function StoreCard({ store, action }: { store: PackStoreOption; action?: ReactNode }) {
  const t = useTranslations("packs.editor.store");
  const known = store.status in STORE_STATUS;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl border border-border p-3">
        <span className="w-10 h-10 rounded-lg bg-soft-pink text-primary inline-flex items-center justify-center shrink-0">
          <DashIcon name="store" className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate" dir="auto">
            {store.name}
          </p>
          {(store.ownerName || store.ownerPhone) && (
            <p className="text-xs text-subtext truncate">
              {store.ownerName}
              {store.ownerPhone && (
                <span dir="ltr" className={store.ownerName ? "ms-1.5" : ""}>
                  {store.ownerPhone}
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-subtext tabular-nums">{t("delivery_fee", { fee: formatDa(store.deliveryFee) })}</p>
        </div>
        {known && <Badge variant={STORE_STATUS[store.status]}>{t(`status.${store.status}`)}</Badge>}
        {action}
      </div>
      {known && store.status !== "active" && <p className="text-xs text-warning mt-2">{t("not_live")}</p>}
    </div>
  );
}
