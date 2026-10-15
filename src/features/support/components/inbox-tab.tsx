"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, LivePill } from "@/components/ui";
import { useSupportStore, rowToChat } from "@/features/support";
import { LiveInbox } from "./live-inbox";
import { HistoryInbox } from "./history-inbox";
import type { TFn } from "../types";

type View = "live" | "history";

// The Live Chat page. Header shows live/waiting counts and a toggle that swaps
// the panes below between the live inbox and the read-only resolved History —
// no longer a separate top-level tab.
export function InboxTab({ t }: { t: TFn }) {
  const [picked, setPicked] = useState<View | null>(null);
  const conversations = useSupportStore((s) => s.conversations);
  const historyConversations = useSupportStore((s) => s.historyConversations);
  // A link to a resolved chat (Tickets / SLA "Open in Inbox") opens History on it.
  const linked = useSearchParams().get("c");
  const linkedInHistory =
    !!linked && historyConversations.some((c) => c.id === linked) && !conversations.some((c) => c.id === linked);
  const view: View = picked ?? (linkedInHistory ? "history" : "live");
  const liveChats = conversations.map(rowToChat);
  const live = liveChats.filter((c) => c.status !== "idle").length;
  const waiting = liveChats.filter((c) => c.status === "waiting").length;

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        {view === "live" ? (
          <>
            <LivePill>{t("inb.live", { n: live })}</LivePill>
            <span className="text-[13px] text-subtext">{t("inb.waiting", { n: waiting })}</span>
          </>
        ) : (
          <span className="text-[13px] text-subtext">
            {t("inb.history_count", { n: historyConversations.length })}
          </span>
        )}

        {/* View toggle — sits directly after the waiting-queue / history count. */}
        <Button
          variant={view === "history" ? "primary" : "secondary"}
          size="sm"
          icon={view === "live" ? "clock" : "chat"}
          onClick={() => setPicked(view === "live" ? "history" : "live")}
        >
          {view === "live" ? t("inb.view_history") : t("inb.view_live")}
        </Button>

        <Button variant="secondary" size="sm" icon="filter" className="ms-auto">
          {t("inb.all_channels")}
        </Button>
      </div>

      {view === "live" ? <LiveInbox t={t} /> : <HistoryInbox t={t} />}
    </>
  );
}
