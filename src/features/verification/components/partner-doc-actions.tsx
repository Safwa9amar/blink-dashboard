"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { reviewErrorText } from "../queue";
import type { PartnerVerdict } from "../partners";
import type { ReviewDocState, ReviewErrorCode, ReviewOutcome, TFn } from "../types";
import { ApproveDialog } from "./approve-dialog";
import { PartnerRejectDialog } from "./partner-reject-dialog";

const NOTE_ERRORS: readonly ReviewErrorCode[] = ["note_required", "note_too_long"];

// Verify / reject one rider or agent document. Only a document that's there can
// be reviewed: pending -> both, verified -> reject, rejected -> verify. Reject
// asks for the note the partner will see; Verify asks first when the file wasn't
// previewed (`untrusted`: staff never saw it here). The decision is made by the
// caller's `submit` (a server action bound to the document and the path/value
// the reviewer saw); a stale verdict comes back as an error, kept here (or in
// the open dialog) while the card is on screen.
export function PartnerDocActions({
  t,
  label,
  status,
  untrusted = false,
  noteVariant,
  noteMax,
  submit,
  onOutcome,
}: {
  t: TFn;
  /** The document's name, for the button labels and dialog titles. */
  label: string;
  status: ReviewDocState;
  untrusted?: boolean;
  noteVariant: "reject_rider_doc" | "reject_agent_doc";
  noteMax: number;
  submit: (verdict: PartnerVerdict, note?: string) => Promise<ReviewOutcome>;
  onOutcome?: (verdict: PartnerVerdict, outcome: ReviewOutcome) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"verify" | "reject" | null>(null);
  const [error, setError] = useState<{ text: string; code: ReviewErrorCode } | null>(null);

  // Nothing to decide on a missing document (an earlier error still shows).
  if (status === "missing" && !error) return null;

  function run(verdict: PartnerVerdict, note?: string) {
    setError(null);
    startTransition(async () => {
      const outcome = await submit(verdict, note);
      onOutcome?.(verdict, outcome);
      if (outcome.ok) {
        setDialog(null);
        return;
      }
      setError({ text: reviewErrorText(t, outcome), code: outcome.code });
    });
  }

  function open(next: "verify" | "reject") {
    setError(null);
    setDialog(next);
  }

  function close() {
    if (pending) return;
    setDialog(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {status !== "missing" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {status !== "verified" && (
            <Button
              size="xs"
              variant="outline"
              icon="check"
              aria-label={t("doc_review.verify_label", { doc: label })}
              disabled={pending}
              loading={pending && !dialog}
              onClick={() => (untrusted ? open("verify") : run("verified"))}
            >
              {t("doc_review.verify")}
            </Button>
          )}
          {status !== "rejected" && (
            <Button
              size="xs"
              variant="secondary"
              icon="x"
              aria-label={t("doc_review.reject_label", { doc: label })}
              disabled={pending}
              onClick={() => open("reject")}
            >
              {t("doc_review.reject")}
            </Button>
          )}
        </div>
      )}
      {error && !dialog && (
        <p role="alert" className="text-[11px] text-danger max-w-xs">
          {error.text}
        </p>
      )}
      {dialog === "verify" && (
        <ApproveDialog
          t={t}
          title={t("doc_review.verify_title", { doc: label })}
          message={t("doc_review.untrusted_warning")}
          confirmLabel={t("doc_review.verify_anyway")}
          pending={pending}
          error={error?.text ?? null}
          onClose={close}
          onConfirm={() => run("verified")}
        />
      )}
      {dialog === "reject" && (
        <PartnerRejectDialog
          t={t}
          variant={noteVariant}
          title={t(`partners.${noteVariant}.title`, { doc: label })}
          max={noteMax}
          pending={pending}
          error={error?.text ?? null}
          noteInvalid={!!error && NOTE_ERRORS.includes(error.code)}
          onClose={close}
          onConfirm={(note) => run("rejected", note)}
        />
      )}
    </div>
  );
}
