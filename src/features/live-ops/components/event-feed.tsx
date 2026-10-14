"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, DashIcon } from "@/components/ui";
import { agoLabel, codeLabel } from "../format";
import type { FeedEvent, FeedKind } from "../types";

const STYLE: Record<FeedKind, { ic: string; v: "info" | "success" | "primary" | "danger" | "warning" }> = {
  order_placed: { ic: "package", v: "info" },
  rider_assigned: { ic: "bike", v: "success" },
  picked_up: { ic: "truck", v: "info" },
  delivered: { ic: "check", v: "success" },
  canceled: { ic: "x", v: "danger" },
  store_rejected: { ic: "store", v: "danger" },
  cash_deposit: { ic: "card", v: "primary" },
  cash_withdrawal: { ic: "wallet", v: "primary" },
  chat_opened: { ic: "support", v: "warning" },
  store_new: { ic: "store", v: "info" },
  rider_new: { ic: "users", v: "success" },
};

export function EventFeed({ feed, now }: { feed: FeedEvent[]; now: number | null }) {
  const t = useTranslations("live_ops");
  const tc = useTranslations("common");
  const locale = useLocale();

  const meta = (e: FeedEvent): string => {
    const parts: string[] = [];
    if (e.store) parts.push(e.kind === "rider_new" ? codeLabel(t, "vehicles", e.store) : e.store);
    if (e.kind === "delivered" && e.minutes != null) parts.push(t("meta_minutes", { n: e.minutes }));
    if ((e.kind === "canceled" || e.kind === "store_rejected") && e.by) {
      parts.push(t("meta_by", { by: codeLabel(t, "cancel_by", e.by) }));
    }
    if (e.reason) parts.push(e.reason);
    if (e.amount != null && e.kind !== "rider_new" && e.kind !== "store_new" && e.kind !== "chat_opened") {
      parts.push(`${Math.round(e.amount).toLocaleString(locale)} ${tc("da")}`);
    }
    return parts.join(" · ");
  };

  return (
    <Card title={t("feed_title")} description={t("feed_desc")}>
      {feed.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-subtext">{t("feed_empty")}</p>
      ) : (
        <div className="flex flex-col">
          {feed.map((e) => {
            const s = STYLE[e.kind];
            const m = meta(e);
            return (
              <div key={e.key} className="flex gap-3 py-3 border-t border-border first:border-t-0">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `var(--${s.v === "primary" ? "soft-pink" : `${s.v}-light`})`, color: `var(--${s.v})` }}
                >
                  <DashIcon name={s.ic} className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-text">
                    {t.rich(`ev.${e.kind}`, {
                      entity: e.entity || t("no_subject"),
                      b: (chunks) => (
                        <b dir="auto" className="font-bold">
                          {chunks}
                        </b>
                      ),
                    })}
                  </div>
                  {m && (
                    <div dir="auto" className="text-[11.5px] text-subtext mt-0.5 truncate">
                      {m}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-subtext whitespace-nowrap tabular-nums">{agoLabel(t, e.at, now)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
