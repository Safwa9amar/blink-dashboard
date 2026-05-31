"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { NTYPES } from "../data";
import { useNotificationsStore, useHydrateNotifications, selectUnreadCount } from "../store";

export function NotificationBell() {
  const t = useTranslations("notif");
  useHydrateNotifications();
  const inbox = useNotificationsStore((s) => s.inbox);
  const unread = useNotificationsStore(selectUnreadCount);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("inbox.title")}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-subtext hover:text-text hover:bg-card border border-transparent hover:border-border transition-colors cursor-pointer"
      >
        <DashIcon name="bell" className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-bold text-text text-sm">{t("inbox.title")}</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[12px] text-primary hover:underline cursor-pointer">
                {t("inbox.mark_all_read")}
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="py-10 text-center text-subtext text-sm">{t("inbox.empty")}</div>
            ) : (
              inbox.map((item) => {
                const c = NTYPES[item.type] || NTYPES.order;
                return (
                  <Link
                    key={item.id}
                    href={item.link || "/notifications"}
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-card-hover transition-colors ${item.read ? "" : "bg-soft-pink/30"}`}
                  >
                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: c.bg, color: c.color }}>
                      <DashIcon name={c.icon} className="w-[18px] h-[18px]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <b className="text-[13px] font-bold text-text truncate">{item.title}</b>
                        {!item.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-[12px] text-subtext mt-0.5 line-clamp-2">{item.message}</p>
                      <span className="text-[11px] text-subtext/70">{item.time}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-[12.5px] font-semibold text-primary hover:bg-card-hover border-t border-border"
          >
            {t("inbox.view_all")}
          </Link>
        </div>
      )}
    </div>
  );
}
