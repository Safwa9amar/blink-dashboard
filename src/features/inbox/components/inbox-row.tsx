"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { inboxHref, inboxKind } from "@/lib/shell/inbox-kinds";
import type { InboxItem, InboxSeverity } from "@/lib/shell/inbox-types";
import { relativeTime } from "../format";
import { useInboxText } from "../use-inbox-text";

const TONE: Record<InboxSeverity, string> = {
  info: "bg-soft-pink text-primary",
  warning: "bg-warning-light text-warning",
  critical: "bg-danger-light text-danger",
};

/** One notification: icon tile, title, optional second line, category · time, unread dot. */
export function InboxRow({ item, onOpen }: { item: InboxItem; onOpen: (item: InboxItem) => void }) {
  const t = useTranslations("inbox");
  const locale = useLocale();
  const describe = useInboxText();
  const kind = inboxKind(item.kind);
  const { title, sub } = describe(item);

  return (
    <Link
      href={inboxHref(item)}
      onClick={() => onOpen(item)}
      className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-card-hover transition-colors ${
        item.unread ? "bg-soft-pink/30" : ""
      }`}
    >
      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${TONE[item.severity]}`}>
        <DashIcon name={kind?.icon ?? "bell"} className="w-[18px] h-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={`flex-1 text-[13px] leading-snug text-text ${item.unread ? "font-bold" : "font-medium"}`}>{title}</p>
          {item.unread && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" aria-label={t("unread_dot")} />}
        </div>
        {sub && <p className="text-[12px] text-subtext mt-0.5 line-clamp-2">{sub}</p>}
        <p className="text-[11px] text-subtext/80 mt-1">
          {kind && <span>{t(`categories.${kind.category}`)} · </span>}
          <time dateTime={item.at} suppressHydrationWarning>
            {relativeTime(item.at, locale)}
          </time>
        </p>
      </div>
    </Link>
  );
}
