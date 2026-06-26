"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button, Avatar, Badge, fInput } from "@/components/ui";
import { ROLE_VARIANT } from "../data";
import { useSupportStore, rowToChat, rowToMessage } from "@/features/support";
import { assignChat, replyToChat, resolveChat } from "@/app/d/support/action";
import { createClient } from "@/lib/supabase/client";
import { ConversationList, MessageBubble, ThreadSkeleton } from "./chat-shared";
import type { TFn } from "../types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The live two-pane inbox: active conversation list + a realtime thread with a
// composer. Rendered by InboxTab when the "Live" view is selected; the page
// header (live/waiting counts + view toggle) lives in InboxTab.
export function LiveInbox({ t }: { t: TFn }) {
  const conversations = useSupportStore((s) => s.conversations);
  const messagesByConversation = useSupportStore((s) => s.messagesByConversation);
  const chats = conversations.map(rowToChat);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [customerTyping, setCustomerTyping] = useState(false);
  // Resolve/assign hit a server action with a noticeable round-trip — track each
  // so the button shows a spinner and can't be double-clicked.
  const [resolving, setResolving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  // Conversation ids whose first message fetch has resolved. Until a thread is in
  // here (and it has no cached messages), the thread skeleton stands in for it.
  const [loadedIds, setLoadedIds] = useState<Record<string, boolean>>({});

  // Realtime "typing" broadcast channel for the active conversation.
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef(0);

  // Default the active selection to the first chat until the user picks one.
  const activeId = selectedId ?? chats[0]?.id ?? null;

  // Load the active thread's messages (RLS-scoped browser read), then keep it
  // live: subscribe to inserts for this conversation and append them so the
  // thread (incl. incoming photos) updates without a page reload.
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
        setLoadedIds((m) => (m[activeId] ? m : { ...m, [activeId]: true }));
      });

    const channel = supabase
      .channel(`support-thread-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const row = payload.new as { id: string };
          const cur = useSupportStore.getState().messagesByConversation[activeId] ?? [];
          if (cur.some((m) => m.id === row.id)) return;
          useSupportStore.getState().setMessages(activeId, [...cur, row] as never);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId]);

  // Join the shared typing broadcast channel; react only to the customer side.
  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`support-typing-${activeId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { from?: string })?.from !== "user") return;
        setCustomerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setCustomerTyping(false), 3000);
      })
      .subscribe();
    typingChannelRef.current = ch;
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      void supabase.removeChannel(ch);
      typingChannelRef.current = null;
      setCustomerTyping(false);
    };
  }, [activeId]);

  // Broadcast that the agent is typing, throttled to ≤ once / ~1500ms.
  function notifyTyping() {
    const ch = typingChannelRef.current;
    if (!ch) return;
    const now = Date.now();
    if (now - lastSentRef.current < 1500) return;
    lastSentRef.current = now;
    void ch.send({ type: "broadcast", event: "typing", payload: { from: "agent", name: "Support" } });
  }

  const activeConv = conversations.find((c) => c.id === activeId);
  const active = chats.find((c) => c.id === activeId) ?? null;
  const thread = (activeId ? messagesByConversation[activeId] ?? [] : []).map(rowToMessage);
  // First-load placeholder: an active chat whose fetch hasn't resolved and has no
  // messages cached yet (switching back to a loaded chat shows it immediately).
  const showThreadSkeleton = !!activeId && !loadedIds[activeId] && thread.length === 0;

  // Scroll to the bottom of the thread when new messages arrive or the customer types.
  const threadEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, customerTyping, activeId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
      {/* Conversation list */}
      <ConversationList
        chats={chats}
        activeId={activeId}
        onSelect={setSelectedId}
        emptyLabel={t("inb.no_chats")}
      />

      {/* Active thread */}
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
                {activeConv?.status === "waiting" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={assigning}
                    onClick={async () => {
                      if (!activeId) return;
                      setAssigning(true);
                      try {
                        await assignChat(activeId);
                      } finally {
                        setAssigning(false);
                      }
                    }}
                  >
                    {t("inb.assign_to_me")}
                  </Button>
                )}
                {activeConv?.status === "assigned" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={resolving}
                    onClick={async () => {
                      if (!activeId) return;
                      setResolving(true);
                      try {
                        await resolveChat(activeId);
                      } finally {
                        setResolving(false);
                      }
                    }}
                  >
                    {t("inb.resolve")}
                  </Button>
                )}
                <Badge variant={ROLE_VARIANT[cap(active.role)] ?? "default"}>{cap(active.role)}</Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pe-1">
              {showThreadSkeleton ? (
                <ThreadSkeleton />
              ) : (
                thread.map((m, i) => (
                  <MessageBubble key={i} message={m} whoName={active.who} t={t} />
                ))
              )}

              {customerTyping && (
                <div className="flex gap-2.5">
                  <Avatar name={active.who} />
                  <div className="max-w-[78%] flex flex-col items-start">
                    <div className="rounded-2xl rounded-tl-sm bg-background border border-border px-4 py-3 flex items-center gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full bg-subtext animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-subtext mt-1 px-1">{t("inb.customer_typing")}</span>
                  </div>
                </div>
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer — only when a live conversation is open. */}
            <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-border">
              <input
                className={fInput}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  notifyTyping();
                }}
                placeholder={t("inb.message_ph")}
              />
              <Button
                size="sm"
                icon="send"
                onClick={async () => {
                  const txt = draft.trim();
                  setDraft("");
                  if (activeId && txt) await replyToChat(activeId, txt);
                }}
              >
                {t("inb.send")}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-subtext">
            {t("inb.no_chats")}
          </div>
        )}
      </Card>
    </div>
  );
}
