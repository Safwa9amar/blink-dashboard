"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button, DashIcon, Spinner } from "@/components/ui";
import type { StaffRole } from "@/lib/auth/access";
import { useAssistantStore } from "../store";
import type { AssistantChat } from "../use-assistant-chat";
import type { AssistantConfig } from "../types";
import { Composer } from "./composer";
import { AssistantEmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";
import { ThreadHistory } from "./thread-history";

function HeaderButton({ label, onClick, icon, active }: { label: string; onClick: () => void; icon: string; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer hover:bg-muted hover:text-text ${active ? "bg-muted text-text" : "text-subtext"}`}
    >
      <DashIcon name={icon} className="h-4 w-4" />
    </button>
  );
}

export function AssistantPanel({
  chat,
  config,
  staffRole,
  staffName,
  onClose,
}: {
  chat: AssistantChat;
  config: AssistantConfig | null;
  staffRole: StaffRole;
  staffName: string;
  onClose: () => void;
}) {
  const t = useTranslations("assistant");
  const historyOpen = useAssistantStore((s) => s.historyOpen);
  const setHistoryOpen = useAssistantStore((s) => s.setHistoryOpen);
  const threadId = useAssistantStore((s) => s.threadId);
  const { messages, streaming, error, configState } = chat;

  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, error, historyOpen]);

  useEffect(() => {
    if (historyOpen) void chat.refreshThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshThreads is stable
  }, [historyOpen]);

  const errorText = error ? t(`errors.${error.code === "timeout" ? "provider_error" : error.code}` as never) : "";
  const retryable = error && (error.code === "provider_error" || error.code === "timeout" || error.code === "unavailable");

  return (
    <section
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-0 z-[45] flex flex-col bg-card text-text sm:inset-auto sm:bottom-20 sm:end-5 sm:h-[640px] sm:max-h-[calc(100vh-6rem)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl"
    >
      <header className="flex items-center gap-1 border-b border-border px-3 py-2.5">
        <span className="me-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-pink text-primary">
          <DashIcon name="sparkles" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold leading-tight">{t("title")}</h2>
          {config && (
            <p dir="ltr" className="truncate text-start text-[11px] leading-tight text-subtext rtl:text-end">
              {config.model || t("model_default")}
            </p>
          )}
        </div>
        <HeaderButton label={t("new_chat")} icon="plus" onClick={chat.newChat} />
        <HeaderButton label={t("history")} icon="clock" active={historyOpen} onClick={() => setHistoryOpen(!historyOpen)} />
        <HeaderButton label={t("close")} icon="x" onClick={onClose} />
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {configState.state !== "ready" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            {configState.state === "loading" ? (
              <Spinner />
            ) : (
              <>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-subtext">
                  <DashIcon name="warn" className="h-6 w-6" />
                </span>
                <h3 className="text-sm font-semibold">{t("unavailable_title")}</h3>
                <p className="text-xs text-subtext">{t("unavailable_body")}</p>
                <Button size="sm" variant="secondary" onClick={chat.reloadConfig}>
                  {t("retry")}
                </Button>
              </>
            )}
          </div>
        ) : historyOpen ? (
          <ThreadHistory
            threads={chat.threads}
            failed={chat.threadsError}
            activeId={threadId}
            onOpen={chat.openThread}
            onRename={chat.renameThread}
            onDelete={chat.removeThread}
            onRetry={chat.refreshThreads}
          />
        ) : chat.loadingMessages && messages.length === 0 ? (
          <div className="flex justify-center p-8 text-subtext">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-4">
            <AssistantEmptyState staffRole={staffRole} staffName={staffName} tools={configState.config.tools} onPick={chat.send} />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      {error && !historyOpen && (
        <div role="alert" className="mx-3 mb-2 flex items-start gap-2 rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">
          <DashIcon name="warn" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{errorText}</span>
          {retryable && (
            <button type="button" onClick={chat.retry} className="font-semibold underline cursor-pointer">
              {t("retry")}
            </button>
          )}
        </div>
      )}

      {configState.state === "ready" && !historyOpen && <Composer streaming={streaming} onSend={chat.send} onStop={chat.stop} />}
      {configState.state === "ready" && !historyOpen && <p className="px-3 pb-2 text-center text-[10.5px] text-subtext">{t("footer")}</p>}
    </section>
  );
}
