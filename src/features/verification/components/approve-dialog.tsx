"use client";

import { useEffect, useId, useRef } from "react";
import { Button, Modal } from "@/components/ui";
import type { TFn } from "../types";

// Asks before approving something that isn't complete (e.g. a store missing
// required documents) or that has side effects (approving a store verifies its
// documents; verifying a file Blink can't preview). Cancel takes focus, so
// Enter doesn't approve by accident. Stays open when the decision fails, with
// the error inside.
export function ApproveDialog({
  t,
  title,
  message,
  confirmLabel,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  t: TFn;
  title: string;
  /** What's incomplete or what else happens, one paragraph per entry ("Approve without: …?"). */
  message: string | readonly string[];
  /** The confirm button (default "Approve anyway"). */
  confirmLabel?: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const messageId = useId();
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancel.current?.focus();
  }, []);

  return (
    <Modal open onClose={onClose} title={title}>
      <div id={messageId} className="space-y-2 text-sm text-text">
        {(typeof message === "string" ? [message] : message).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3 mt-3">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2.5 mt-5">
        <Button ref={cancel} variant="secondary" size="sm" disabled={pending} onClick={onClose}>
          {t("reject.cancel")}
        </Button>
        <Button size="sm" icon="check" loading={pending} aria-describedby={messageId} onClick={onConfirm}>
          {confirmLabel ?? t("approve.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
