"use client";

import { Card, Avatar, Skeleton } from "@/components/ui";
import { CHANNEL_COLOR } from "../data";
import type { Chat, Message, TFn } from "../types";

// Placeholder thread shown while a conversation's messages load (the inbox fetches
// them client-side on select). Alternating customer/agent rows of varying size so
// it reads as a real conversation filling in — mirrors MessageBubble's layout.
const THREAD_SKELETON_ROWS: { agent: boolean; w: string; h: string }[] = [
  { agent: false, w: "w-48", h: "h-9" },
  { agent: true, w: "w-60", h: "h-14" },
  { agent: false, w: "w-40", h: "h-9" },
  { agent: true, w: "w-52", h: "h-16" },
  { agent: false, w: "w-44", h: "h-9" },
];

export function ThreadSkeleton() {
  return (
    <>
      {THREAD_SKELETON_ROWS.map((r, i) => (
        <div key={i} className={`flex gap-2.5 ${r.agent ? "flex-row-reverse" : ""}`}>
          <Skeleton className="w-[34px] h-[34px] rounded-full shrink-0" />
          <div className={`max-w-[78%] flex flex-col ${r.agent ? "items-end" : "items-start"}`}>
            <Skeleton
              className={`${r.h} ${r.w} rounded-2xl ${r.agent ? "rounded-tr-sm" : "rounded-tl-sm"}`}
            />
            <Skeleton className="h-2.5 w-10 mt-1.5 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

// Left column: the conversation list card. Shared by the Live Chat inbox and the
// resolved-conversation History tab so both render identical list rows.
export function ConversationList({
  chats,
  activeId,
  onSelect,
  emptyLabel,
}: {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <Card padding={false} className="overflow-hidden">
      {chats.length === 0 ? (
        <p className="p-4 text-[13px] text-subtext text-center">{emptyLabel}</p>
      ) : (
        chats.map((c) => {
          const on = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`w-full text-start flex gap-3 p-3.5 border-b border-border last:border-b-0 transition-colors ${on ? "bg-soft-pink/50" : "hover:bg-card-hover"}`}
            >
              <span className="relative shrink-0">
                <Avatar name={c.who} />
                <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ background: CHANNEL_COLOR[c.channel] }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <b className="text-[13px] font-bold text-text truncate">{c.who}</b>
                  <span className="text-[10.5px] text-subtext ms-auto whitespace-nowrap">{c.channel}</span>
                </div>
                <p className="text-[12px] text-subtext truncate mt-0.5">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <span className="self-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">{c.unread}</span>
              )}
            </button>
          );
        })
      )}
    </Card>
  );
}

// A single message in a conversation thread. Customer messages sit on the start
// side; the human agent ("You") and the AI bot ("Blink Assistant") both sit on the
// end side but are visually distinct (avatar + bot name label) so an operator never
// mistakes a bot reply for their own. System events render as a centered note line
// rather than a bubble. Shared by the live inbox and History.
export function MessageBubble({ message, whoName, t }: { message: Message; whoName: string; t: TFn }) {
  // System event — escalated / agent joined / resolved — as a centered note.
  if (message.from === "note") {
    const label =
      message.noteType === "assigned"
        ? t("inb.note_joined", { name: message.agentName ?? t("inb.assistant") })
        : message.noteType === "resolved"
        ? t("inb.note_resolved")
        : t("inb.note_escalated");
    return (
      <div className="flex justify-center">
        <span className="text-[11px] font-medium text-subtext bg-background border border-border rounded-full px-3 py-1">
          {label}
        </span>
      </div>
    );
  }

  const isBot = message.from === "bot";
  const onEnd = isBot || message.from === "agent"; // support side
  return (
    <div className={`flex gap-2.5 ${onEnd ? "flex-row-reverse" : ""}`}>
      <Avatar name={isBot ? t("inb.assistant") : onEnd ? "You" : whoName} />
      <div className={`max-w-[78%] flex flex-col ${onEnd ? "items-end" : "items-start"}`}>
        {isBot && <span className="text-[11px] font-semibold text-subtext mb-1 px-1">{t("inb.assistant")}</span>}
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isBot
              ? "bg-card border border-border text-text rounded-tr-sm"
              : onEnd
              ? "bg-soft-pink text-text rounded-tr-sm"
              : "bg-background border border-border text-text rounded-tl-sm"
          }`}
        >
          {message.attachmentUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.attachmentUrl} alt="attachment" className="rounded-lg max-w-[220px] max-h-[220px] object-cover mb-1" />
          )}
          {message.text && message.text !== "📷 Photo" && <span>{message.text}</span>}
        </div>
        <span className="text-[11px] text-subtext mt-1 px-1">{message.time}</span>
      </div>
    </div>
  );
}
