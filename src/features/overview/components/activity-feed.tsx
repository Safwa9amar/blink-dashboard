"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, EmptyState } from "@/components/ui";
import type { ActivityItem } from "../types";
import { humanize, money, relativeTime } from "./format";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const t = useTranslations("overview");
  const locale = useLocale();
  return (
    <Card title={t("activity.title")} description={t("activity.description")}>
      {items.length === 0 ? (
        <EmptyState title={t("activity.empty")} />
      ) : (
        <ul className="divide-y divide-border -my-2">
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
              <div className="min-w-0">
                <p className="text-text font-medium truncate">{it.title}</p>
                <p className="text-subtext text-xs">
                  {t(`activity.${it.kind}`)} · <span dir="ltr">#{it.id.slice(0, 8).toUpperCase()}</span> · {relativeTime(it.at, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={it.status === "delivered" || it.status === "completed" ? "success" : it.status === "canceled" || it.status === "cancelled" || it.status === "merchant_rejected" ? "danger" : "default"}>
                  {humanize(it.status)}
                </Badge>
                <span className="tabular-nums font-semibold text-text">{money(it.amount, locale)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
