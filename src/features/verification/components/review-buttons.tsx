"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { submitReview } from "@/app/d/verification/action";
import { reviewErrorText } from "../queue";
import type { ReviewDecision, ReviewErrorCode, ReviewOutcome, ReviewTarget, TFn } from "../types";
import { ApproveDialog } from "./approve-dialog";
import { RejectDialog } from "./reject-dialog";

type NoteDecision = Exclude<ReviewDecision, "approve">;

const NOTE_ERRORS: readonly ReviewErrorCode[] = ["note_required", "note_too_long"];

// Approve / reject (or deactivate) one review target. Reject and deactivate ask
// for a note first; approve asks first when `approveConfirm` is set. The server
// action revalidates /verification, so the queue re-renders with the server's
// new state (no local optimistic copy). A failed decision keeps its dialog open
// with the error inside (and the typed note) for as long as this item is still
// on screen — the caller covers the case where the refresh removed it.
export function ReviewButtons({
  t,
  target,
  subject,
  decisions = ["approve", "reject"],
  canApprove = true,
  canReject = true,
  approveConfirm,
  approveLabel,
  onOutcome,
}: {
  t: TFn;
  target: ReviewTarget;
  /** What is being reviewed, for the dialog titles ("Reject <subject>"). */
  subject: string;
  /** Which buttons to show (default approve + reject). */
  decisions?: readonly ReviewDecision[];
  canApprove?: boolean;
  canReject?: boolean;
  /** Set to make Approve ask first, with this question ("Approve without: …?") — one paragraph per entry. */
  approveConfirm?: string | readonly string[] | null;
  /** The confirm button of that question (default "Approve anyway"). */
  approveLabel?: string;
  /** Told about every outcome — e.g. to show a page-level notice. */
  onOutcome?: (decision: ReviewDecision, outcome: ReviewOutcome) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<ReviewDecision | null>(null);
  // The question as it was asked — the refresh after a failure may change the prop.
  const [question, setQuestion] = useState<{ message: string | readonly string[]; label?: string }>({ message: "" });
  const [error, setError] = useState<{ text: string; code: ReviewErrorCode } | null>(null);

  function run(decision: ReviewDecision, note?: string) {
    setError(null);
    startTransition(async () => {
      const outcome = await submitReview(target, decision, note);
      onOutcome?.(decision, outcome);
      if (outcome.ok) {
        setDialog(null);
        return;
      }
      setError({ text: reviewErrorText(t, outcome), code: outcome.code });
    });
  }

  function open(decision: ReviewDecision) {
    setError(null);
    setDialog(decision);
  }

  function close() {
    if (pending) return;
    setDialog(null);
    setError(null);
  }

  function approve() {
    if (!approveConfirm || approveConfirm.length === 0) return run("approve");
    setQuestion({ message: approveConfirm, label: approveLabel });
    open("approve");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {decisions.includes("approve") && (
          <Button
            size="xs"
            icon="check"
            disabled={!canApprove || pending}
            loading={pending && !dialog}
            onClick={approve}
          >
            {t("actions.approve")}
          </Button>
        )}
        {decisions.includes("reject") && (
          <Button
            size="xs"
            variant="secondary"
            icon="x"
            disabled={!canReject || pending}
            onClick={() => open("reject")}
          >
            {t("actions.reject")}
          </Button>
        )}
        {decisions.includes("deactivate") && (
          <Button
            size="xs"
            variant="secondary"
            icon="x"
            disabled={!canReject || pending}
            onClick={() => open("deactivate")}
          >
            {t("actions.deactivate")}
          </Button>
        )}
      </div>
      {error && !dialog && (
        <p role="alert" className="text-[11px] text-danger max-w-xs">
          {error.text}
        </p>
      )}
      {dialog === "approve" && (
        <ApproveDialog
          t={t}
          title={t("approve.title", { name: subject })}
          message={question.message}
          confirmLabel={question.label}
          pending={pending}
          error={error?.text ?? null}
          onClose={close}
          onConfirm={() => run("approve")}
        />
      )}
      {dialog && dialog !== "approve" && (
        <RejectDialog
          t={t}
          variant={dialog}
          title={t(`${dialog}.title`, { name: subject })}
          pending={pending}
          error={error?.text ?? null}
          noteInvalid={!!error && NOTE_ERRORS.includes(error.code)}
          onClose={close}
          onConfirm={(note) => run(dialog satisfies NoteDecision, note)}
        />
      )}
    </div>
  );
}
