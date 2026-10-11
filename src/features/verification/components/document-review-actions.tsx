"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { reviewStoreDocument } from "@/app/d/verification/action";
import { reviewErrorText } from "../queue";
import type { DocumentVerdict, ReviewErrorCode, ReviewOutcome, StoreDocItem, TFn } from "../types";
import { ApproveDialog } from "./approve-dialog";
import { RejectDialog } from "./reject-dialog";

const NOTE_ERRORS: readonly ReviewErrorCode[] = ["note_required", "note_too_long"];

// Verify / reject one of a store's required documents. Only a document that's
// there can be reviewed: pending → both, verified → reject, rejected → verify.
// Reject asks for the reason the merchant will see; Verify asks first when the
// file isn't in Blink's storage (`untrusted`: staff never saw it here). The
// verdict is on the value shown (`expected_value`), and the server action
// refreshes the queue — a stale verdict comes back as an error, kept here (or
// in the open dialog) while the card is on screen.
export function DocumentReviewActions({
  t,
  storeId,
  label,
  doc,
  untrusted = false,
  onOutcome,
}: {
  t: TFn;
  storeId: string;
  /** The document's name, for the button labels and dialog titles. */
  label: string;
  doc: StoreDocItem;
  untrusted?: boolean;
  onOutcome?: (verdict: DocumentVerdict, outcome: ReviewOutcome) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"verify" | "reject" | null>(null);
  const [error, setError] = useState<{ text: string; code: ReviewErrorCode } | null>(null);
  const present = doc.status !== "missing" && !!doc.value;

  // Nothing to decide on a missing document; an error from before it went (the
  // merchant removed it) still shows.
  if (!present && !error) return null;

  function run(verdict: DocumentVerdict, reason?: string) {
    if (!doc.value) return;
    const target = { storeId, document: doc.key, expectedValue: doc.value };
    setError(null);
    startTransition(async () => {
      const outcome = await reviewStoreDocument(target, verdict, reason);
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
      {present && (
        <div className="flex flex-wrap items-center gap-1.5">
          {doc.status !== "verified" && (
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
          {doc.status !== "rejected" && (
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
        <RejectDialog
          t={t}
          variant="reject_doc"
          title={t("reject_doc.title", { doc: label })}
          pending={pending}
          error={error?.text ?? null}
          noteInvalid={!!error && NOTE_ERRORS.includes(error.code)}
          onClose={close}
          onConfirm={(reason) => run("rejected", reason)}
        />
      )}
    </div>
  );
}
