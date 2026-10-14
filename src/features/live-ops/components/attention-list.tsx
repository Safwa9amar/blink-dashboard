"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui";
import { shortId } from "../aggregate";
import { agoLabel } from "../format";
import type { AttentionItem } from "../types";

export function AttentionList({ items, now }: { items: AttentionItem[]; now: number | null }) {
  const t = useTranslations("live_ops");
  return (
    <Card title={t("attention_title")} description={t("attention_desc")}>
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-success">{t("all_clear")}</p>
          <p className="text-[12.5px] text-subtext mt-1">{t("all_clear_desc")}</p>
        </div>
      ) : (
        <div className="flex flex-col max-h-[420px] overflow-y-auto">
          {items.map((i) => {
            const isChat = i.rule === "chat_waiting";
            const age =
              i.rule === "scheduled_no_rider"
                ? i.dueInMin != null && i.dueInMin > 0
                  ? t("attn.due_in", { n: i.dueInMin })
                  : t("attn.overdue")
                : agoLabel(t, i.since, now);
            return (
              <div key={i.key} className="flex items-start gap-3 py-3 border-t border-border first:border-t-0">
                <Badge variant={i.severity}>{t(i.severity === "danger" ? "sev_danger" : "sev_warning")}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text">{t(`attn.${i.rule}`, { id: shortId(i.id) })}</div>
                  {i.label && (
                    <div dir="auto" className="text-[11.5px] text-subtext mt-0.5 truncate">
                      {i.label}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-subtext whitespace-nowrap tabular-nums">{age}</span>
                <Link href={i.href} className="text-[12px] font-semibold text-primary whitespace-nowrap hover:underline">
                  {t(isChat ? "open_inbox" : "open_orders")}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
