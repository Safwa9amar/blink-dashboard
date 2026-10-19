"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, DashIcon, Modal, Spinner } from "@/components/ui";
import { useAssistantStore } from "../store";
import type { AssistantThread } from "../types";
import { relativeTime } from "./relative-time";

export function ThreadHistory({
  threads,
  failed,
  activeId,
  onOpen,
  onRename,
  onDelete,
  onRetry,
}: {
  threads: AssistantThread[] | null;
  failed: boolean;
  activeId: string | null;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRetry: () => void;
}) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState<AssistantThread | null>(null);
  const [busy, setBusy] = useState(false);

  const setConfirmOpen = useAssistantStore((s) => s.setConfirmOpen);
  useEffect(() => {
    setConfirmOpen(!!confirm);
    return () => setConfirmOpen(false);
  }, [confirm, setConfirmOpen]);

  const commit = async (id: string) => {
    const title = draft.trim();
    setEditing(null);
    if (title) await onRename(id, title);
  };

  if (failed && !threads) {
    return (
      <div className="p-6 text-center text-[13px] text-subtext">
        <p className="mb-3">{t("history_failed")}</p>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  if (!threads) {
    return (
      <div className="flex justify-center p-8 text-subtext">
        <Spinner />
      </div>
    );
  }
  if (threads.length === 0) return <p className="p-6 text-center text-[13px] text-subtext">{t("history_empty")}</p>;

  return (
    <>
      <ul className="divide-y divide-border">
        {threads.map((th) => (
          <li key={th.id} className={`group flex items-center gap-1 px-3 py-2 ${th.id === activeId ? "bg-soft-pink" : "hover:bg-card-hover"}`}>
            {editing === th.id ? (
              <input
                autoFocus
                dir="auto"
                value={draft}
                maxLength={120}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commit(th.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(th.id);
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setEditing(null);
                  }
                }}
                aria-label={t("rename")}
                className="h-8 min-w-0 flex-1 rounded-lg border border-primary bg-background px-2 text-[13px] text-text outline-none"
              />
            ) : (
              <button type="button" onClick={() => onOpen(th.id)} className="min-w-0 flex-1 py-1 text-start cursor-pointer">
                <span dir="auto" className="block truncate text-[13px] font-medium text-text">
                  {th.title || t("untitled")}
                </span>
                <span className="block text-[11px] text-subtext">{relativeTime(th.updated_at, locale)}</span>
              </button>
            )}
            {editing !== th.id && (
              <span className="flex shrink-0 opacity-60 group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  aria-label={t("rename")}
                  title={t("rename")}
                  onClick={() => {
                    setDraft(th.title ?? "");
                    setEditing(th.id);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-subtext hover:bg-muted hover:text-text cursor-pointer"
                >
                  <DashIcon name="pencil" className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t("delete")}
                  title={t("delete")}
                  onClick={() => setConfirm(th)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-subtext hover:bg-muted hover:text-danger cursor-pointer"
                >
                  <DashIcon name="trash" className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      <Modal open={!!confirm} onClose={() => !busy && setConfirm(null)} title={t("delete_title")}>
        <p className="mb-4 text-[13px] text-subtext">{t("delete_body", { title: confirm?.title || t("untitled") })}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            onClick={async () => {
              if (!confirm) return;
              setBusy(true);
              await onDelete(confirm.id);
              setBusy(false);
              setConfirm(null);
            }}
          >
            {t("delete")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
