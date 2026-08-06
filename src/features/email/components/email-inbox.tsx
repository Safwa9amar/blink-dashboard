"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, Avatar, Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { assignThread, markThreadRead, replyToThread, resolveThread } from "@/app/d/email/action";
import { useEmailStore } from "../store";
import { threadName } from "../format";
import { ThreadList } from "./thread-list";
import { MessageView, ThreadSkeleton } from "./message-view";
import type { EmailThreadStatus, TFn } from "../types";

const STATUS_VARIANT: Record<EmailThreadStatus, "warning" | "info" | "success"> = {
  open: "warning",
  assigned: "info",
  closed: "success",
};

// The two-pane email inbox: thread list + a live thread with a reply composer.
// Reads the active thread's messages from Supabase (RLS-scoped browser client)
// and subscribes to inserts so inbound mail + sent replies appear without a
// reload — the SMTP send and IMAP intake both write rows the subscription echoes.
export function EmailInbox({ t }: { t: TFn }) {
  const threads = useEmailStore((s) => s.threads);
  const messagesByThread = useEmailStore((s) => s.messagesByThread);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadedIds, setLoadedIds] = useState<Record<string, boolean>>({});

  // Default the selection to the first thread until the operator picks one.
  const activeId = selectedId ?? threads[0]?.id ?? null;
  const active = threads.find((th) => th.id === activeId) ?? null;
  const messages = activeId ? messagesByThread[activeId] ?? [] : [];
  const showSkeleton = !!activeId && !loadedIds[activeId] && messages.length === 0;

  // Load the active thread's messages + keep it live via a per-thread INSERT
  // subscription. Opening a thread also clears its staff unread counter.
  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();

    supabase
      .from("email_messages")
      .select("*")
      .eq("thread_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) useEmailStore.getState().setMessages(activeId, data as never);
        setLoadedIds((m) => (m[activeId] ? m : { ...m, [activeId]: true }));
      });

    const channel = supabase
      .channel(`email-thread-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_messages",
          filter: `thread_id=eq.${activeId}`,
        },
        (payload) => {
          const row = payload.new as { id: string };
          const cur = useEmailStore.getState().messagesByThread[activeId] ?? [];
          if (cur.some((m) => m.id === row.id)) return;
          useEmailStore.getState().setMessages(activeId, [...cur, row] as never);
        }
      )
      .subscribe();

    // Mark read on open (fire-and-forget; Realtime refreshes the list badge).
    void markThreadRead(activeId);

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId]);

  // Switch threads: clear any stale send error from the previous thread (done in
  // the handler, not the effect, to avoid a synchronous setState-in-effect).
  function handleSelect(id: string) {
    setSelectedId(id);
    setSendError(null);
  }

  // Scroll to the newest message when the thread grows or changes.
  const threadEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  async function onSend() {
    const txt = draft.trim();
    if (!activeId || !txt) return;
    setSending(true);
    setSendError(null);
    const res = await replyToThread(activeId, txt);
    setSending(false);
    if (res?.error) {
      setSendError(res.error);
    } else {
      setDraft("");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
      <ThreadList
        threads={threads}
        activeId={activeId}
        onSelect={handleSelect}
        emptyLabel={t("list_empty")}
      />

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
        {active ? (
          <>
            {/* Thread header */}
            <div className="flex items-start gap-3 pb-4 border-b border-border mb-4">
              <Avatar name={threadName(active)} />
              <div className="min-w-0">
                <b className="block text-sm font-bold text-text truncate">{threadName(active)}</b>
                <span className="block text-[12px] text-subtext truncate">{active.customer_email}</span>
                <span className="block text-[12px] font-medium text-text truncate mt-0.5">
                  {active.subject || t("no_subject")}
                </span>
              </div>
              <div className="ms-auto flex items-center gap-2 shrink-0">
                {active.status === "open" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={assigning}
                    onClick={async () => {
                      setAssigning(true);
                      try {
                        await assignThread(active.id);
                      } finally {
                        setAssigning(false);
                      }
                    }}
                  >
                    {t("assign_to_me")}
                  </Button>
                )}
                {active.status !== "closed" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={resolving}
                    onClick={async () => {
                      setResolving(true);
                      try {
                        await resolveThread(active.id);
                      } finally {
                        setResolving(false);
                      }
                    }}
                  >
                    {t("close")}
                  </Button>
                )}
                <Badge variant={STATUS_VARIANT[active.status]}>{t(`status_${active.status}`)}</Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pe-1">
              {showSkeleton ? (
                <ThreadSkeleton />
              ) : messages.length === 0 ? (
                <p className="text-center text-[13px] text-subtext py-8">{t("no_messages")}</p>
              ) : (
                messages.map((m) => <MessageView key={m.id} message={m} t={t} />)
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <div className="mt-4 pt-4 border-t border-border">
              {sendError && (
                <p className="mb-2 text-[12px] text-danger">{t("send_failed", { error: sendError })}</p>
              )}
              <div className="flex items-end gap-2.5">
                <textarea
                  className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-[13px] text-text outline-none focus:border-primary min-h-[44px] max-h-40"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter inserts a newline.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                  placeholder={t("reply_ph")}
                />
                <Button size="sm" icon="send" loading={sending} onClick={onSend}>
                  {t("send")}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] text-subtext">{t("reply_hint", { email: active.customer_email })}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-subtext">
            {t("no_selection")}
          </div>
        )}
      </Card>
    </div>
  );
}
