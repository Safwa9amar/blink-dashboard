"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, Modal, fInput } from "@/components/ui";
import { NOTE_MAX } from "@/app/d/verification/review-request";
import type { TFn } from "../types";

// Collects the note that goes with a rejection (or a deactivation, for a live
// store; or the reason one document is rejected) — the applicant sees it in the app. Mounted only while open, so every
// decision starts from an empty note; it stays mounted when the decision fails,
// so the typed note survives and the error shows here. The note field takes
// focus on open, and the error is tied to it (aria-describedby; aria-invalid
// when the note itself is the problem).
export function RejectDialog({
  t,
  title,
  variant = "reject",
  pending,
  error,
  noteInvalid = false,
  onClose,
  onConfirm,
}: {
  t: TFn;
  title: string;
  /** Which copy to use: `reject.*`, `deactivate.*` or `reject_doc.*` (one document). */
  variant?: "reject" | "deactivate" | "reject_doc";
  pending: boolean;
  error: string | null;
  /** The error is about the note (missing / too long), not the decision. */
  noteInvalid?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");
  const trimmed = note.trim();

  useEffect(() => {
    field.current?.focus();
  }, []);

  return (
    <Modal open onClose={onClose} title={title}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-text mb-2">
        {t(`${variant}.note_label`)}
      </label>
      <textarea
        ref={field}
        id={id}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error && noteInvalid ? true : undefined}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={NOTE_MAX}
        placeholder={t(`${variant}.note_placeholder`)}
        className={`${fInput} resize-none`}
      />
      <div className="flex items-center justify-between gap-3 mt-1.5 text-[11px] text-subtext">
        <span id={hintId}>{t(`${variant}.note_hint`)}</span>
        <span className="tabular-nums" dir="ltr">
          {note.length}/{NOTE_MAX}
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3 mt-3">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2.5 mt-5">
        <Button variant="secondary" size="sm" disabled={pending} onClick={onClose}>
          {t("reject.cancel")}
        </Button>
        <Button variant="danger" size="sm" loading={pending} disabled={!trimmed} onClick={() => onConfirm(trimmed)}>
          {t(`${variant}.confirm`)}
        </Button>
      </div>
    </Modal>
  );
}
