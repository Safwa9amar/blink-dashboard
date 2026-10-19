"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchProductPriceChanges } from "@/app/d/merchant-pricing/action";
import { formatDa, formatDateTime } from "../rows";
import { blinkMoved, type PriceChange } from "../price-changes";
import { PriceMove, SourceBadge } from "./price-move";

/** Compact timeline of one product's recorded price changes, newest first. */
export function PriceHistory({ productId }: { productId: string }) {
  const t = useTranslations("merchant_pricing");
  const locale = useLocale();
  const [state, setState] = useState<{ id: string; changes: PriceChange[]; error?: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetchProductPriceChanges(productId).then((r) => {
      if (live) setState({ id: productId, ...r });
    });
    return () => {
      live = false;
    };
  }, [productId]);

  const ready = state?.id === productId ? state : null;

  return (
    <div>
      <p className="text-xs text-subtext mb-1.5">{t("changes.history_title")}</p>
      <div className="rounded-xl border border-border divide-y divide-border">
        {!ready ? (
          <p className="p-3 text-xs text-subtext">{t("changes.loading")}</p>
        ) : ready.error ? (
          <p className="p-3 text-xs text-danger">{ready.error}</p>
        ) : ready.changes.length === 0 ? (
          <p className="p-3 text-xs text-subtext">{t("changes.history_empty")}</p>
        ) : (
          ready.changes.map((c) => (
            <div key={c.id} className="p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-subtext">{formatDateTime(c.changedAt, locale)}</span>
                <SourceBadge source={c.source} />
              </div>
              <PriceMove oldPrice={c.oldPrice} newPrice={c.newPrice} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-subtext">
                <span>
                  {blinkMoved(c)
                    ? t("changes.blink_moved", { from: formatDa(c.oldBlinkPrice ?? 0), to: formatDa(c.newBlinkPrice) })
                    : ""}
                </span>
                <span>{c.changedBy ? (c.changedBy.name ?? "—") : t("changes.by_none")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
