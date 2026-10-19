"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashIcon, Segmented } from "@/components/ui";
import { useInbox } from "@/components/shell/inbox-provider";
import { useDismiss } from "@/components/shell/use-dismiss";
import type { InboxItem } from "@/lib/shell/inbox-types";
import { InboxRow } from "./inbox-row";

type Tab = "all" | "unread";

// Top-bar bell: unread badge (rings when something new lands) + the latest staff
// notifications. Data and live updates come from <InboxProvider>.
export function NotificationBell() {
  const t = useTranslations("inbox");
  const { items, unread, failed, fresh, markRead, markAllRead, refresh } = useInbox();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, ref, () => setOpen(false));

  const shown = tab === "unread" ? items.filter((i) => i.unread) : items;
  const onOpen = (item: InboxItem) => {
    if (item.unread) markRead([item.id]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? t("bell_unread", { count: unread }) : t("bell")}
        aria-expanded={open}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-subtext hover:text-text hover:bg-card border border-transparent hover:border-border transition-colors cursor-pointer"
      >
        <DashIcon name="bell" className={`w-5 h-5 ${fresh ? "text-primary animate-bounce" : ""}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
            {fresh && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" aria-hidden />}
            <span className="relative">{unread > 99 ? "99+" : unread}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <span className="font-bold text-text text-sm">{t("bell")}</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[12px] text-primary hover:underline cursor-pointer">
                  {t("mark_all_read")}
                </button>
              )}
              <Segmented<Tab>
                options={[
                  ["all", t("filter.all")],
                  ["unread", unread > 0 ? `${t("filter.unread")} · ${unread > 99 ? "99+" : unread}` : t("filter.unread")],
                ]}
                value={tab}
                onChange={setTab}
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {failed && items.length === 0 ? (
              <div className="py-10 text-center text-sm">
                <p className="text-subtext">{t("error")}</p>
                <button type="button" onClick={() => void refresh()} className="mt-2 text-primary text-[12.5px] font-semibold hover:underline cursor-pointer">
                  {t("retry")}
                </button>
              </div>
            ) : shown.length === 0 ? (
              <div className="py-10 text-center text-subtext text-sm">{tab === "unread" ? t("empty_unread") : t("empty")}</div>
            ) : (
              shown.map((item) => <InboxRow key={item.id} item={item} onOpen={onOpen} />)
            )}
          </div>
          <Link
            href="/inbox"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-[12.5px] font-semibold text-primary hover:bg-card-hover border-t border-border"
          >
            {t("view_all")}
          </Link>
        </div>
      )}
    </div>
  );
}
