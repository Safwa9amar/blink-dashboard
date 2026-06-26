"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Avatar, Badge } from "@/components/ui";
import { ROLE_VARIANT } from "../data";
import { useSupportStore, rowToChat, rowToMessage } from "@/features/support";
import { createClient } from "@/lib/supabase/client";
import { ConversationList, MessageBubble } from "./chat-shared";
import type { TFn } from "../types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Read-only archive of resolved conversations. Same two-pane layout as the live
// inbox, but there's no composer (you can't reply to a closed thread) and no
// assign/resolve actions — it exists purely to keep conversation history.
// Rendered by InboxTab when the "History" view is selected.
export function HistoryInbox({ t }: { t: TFn }) {
  const historyConversations = useSupportStore((s) => s.historyConversations);
  const messagesByConversation = useSupportStore((s) => s.messagesByConversation);
  const chats = historyConversations.map(rowToChat);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default the active selection to the first resolved chat until one is picked.
  const activeId = selectedId ?? chats[0]?.id ?? null;

  // Load the selected thread's messages (RLS-scoped browser read). Resolved
  // threads don't change, so no realtime subscription is needed here.
  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();
    supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) useSupportStore.getState().setMessages(activeId, data as never);
      });
  }, [activeId]);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const thread = (activeId ? messagesByConversation[activeId] ?? [] : []).map(rowToMessage);

  const threadEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, activeId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
      {/* Resolved conversation list */}
      <ConversationList
        chats={chats}
        activeId={activeId}
        onSelect={setSelectedId}
        emptyLabel={t("inb.no_history")}
      />

      {/* Read-only thread */}
      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[460px]">
        {active ? (
          <>
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <Avatar name={active.who} />
              <div className="min-w-0">
                <b className="block text-sm font-bold text-text truncate">{active.who}</b>
                <span className="text-[12px] text-subtext">{t("inb.via", { channel: active.channel })}</span>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Badge variant="success">{t("inb.resolved")}</Badge>
                <Badge variant={ROLE_VARIANT[cap(active.role)] ?? "default"}>{cap(active.role)}</Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pe-1">
              {thread.map((m, i) => (
                <MessageBubble key={i} message={m} whoName={active.who} t={t} />
              ))}
              <div ref={threadEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-subtext">
            {t("inb.no_history")}
          </div>
        )}
      </Card>
    </div>
  );
}
