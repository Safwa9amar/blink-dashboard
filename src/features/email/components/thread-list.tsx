"use client";

import { Card, Avatar } from "@/components/ui";
import { fmtWhen, needsReply, threadName } from "../format";
import type { EmailThreadRow } from "../types";

// Left column: the email thread list. Each row shows the customer, subject, a
// preview of the latest message, the time, and an unread badge. A small dot marks
// threads that are waiting on a reply (latest message was inbound).
export function ThreadList({
  threads,
  activeId,
  onSelect,
  emptyLabel,
}: {
  threads: EmailThreadRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <Card padding={false} className="overflow-hidden">
      {threads.length === 0 ? (
        <p className="p-4 text-[13px] text-subtext text-center">{emptyLabel}</p>
      ) : (
        threads.map((thread) => {
          const on = thread.id === activeId;
          const who = threadName(thread);
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelect(thread.id)}
              className={`w-full text-start flex gap-3 p-3.5 border-b border-border last:border-b-0 transition-colors ${
                on ? "bg-soft-pink/50" : "hover:bg-card-hover"
              }`}
            >
              <span className="relative shrink-0">
                <Avatar name={who} />
                {needsReply(thread) && (
                  <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-card bg-warning" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <b className="text-[13px] font-bold text-text truncate">{who}</b>
                  <span className="text-[10.5px] text-subtext ms-auto whitespace-nowrap">
                    {fmtWhen(thread.last_message_at)}
                  </span>
                </div>
                <p className="text-[12px] font-medium text-text truncate mt-0.5">
                  {thread.subject || "—"}
                </p>
                <p className="text-[12px] text-subtext truncate mt-0.5">
                  {thread.last_message_preview ?? ""}
                </p>
              </div>
              {thread.unread_for_staff > 0 && (
                <span className="self-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  {thread.unread_for_staff}
                </span>
              )}
            </button>
          );
        })
      )}
    </Card>
  );
}
