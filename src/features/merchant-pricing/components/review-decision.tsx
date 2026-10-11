"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

type Result = { error?: string };

/**
 * Rejection note + Approve / Reject footer shared by the catalog review modals.
 * The note is only sent with a rejection (it's shown to the merchant) and is
 * required for one; approving never sends it — the label and hint say so.
 * Calls `onDone` once the decision is saved; errors stay inline.
 */
export function ReviewDecision({
  onApprove,
  onReject,
  onDone,
}: {
  onApprove: () => Promise<Result>;
  onReject: (note: string) => Promise<Result>;
  onDone: () => void;
}) {
  const t = useTranslations("merchant_pricing");
  const noteId = useId();
  const hintId = useId();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(kind: "approve" | "reject") {
    const trimmed = note.trim();
    if (kind === "reject" && !trimmed) {
      setError(t("review.note_required"));
      return;
    }
    setError(null);
    setActing(kind);
    startTransition(async () => {
      const result = kind === "approve" ? await onApprove() : await onReject(trimmed);
      setActing(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="pt-1">
      <div className="mb-3">
        <label htmlFor={noteId} className="block text-[12.5px] font-bold text-text mb-1">
          {t("review.note")}
        </label>
        <p id={hintId} className="text-[11.5px] text-subtext mb-2">
          {t("review.note_hint")}
        </p>
        <textarea
          id={noteId}
          aria-describedby={hintId}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("review.note_placeholder")}
          maxLength={300}
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-subtext focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3 mb-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1"
          icon="check"
          loading={isPending && acting === "approve"}
          disabled={isPending}
          onClick={() => run("approve")}
        >
          {t("review.approve")}
        </Button>
        <Button
          className="flex-1"
          variant="secondary"
          icon="x"
          loading={isPending && acting === "reject"}
          disabled={isPending}
          onClick={() => run("reject")}
        >
          {t("review.reject")}
        </Button>
      </div>
    </div>
  );
}
