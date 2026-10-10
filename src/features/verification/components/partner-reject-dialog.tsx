"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, Modal, fInput } from "@/components/ui";
import type { TFn } from "../types";

// The note (or reason) that goes with rejecting a rider / agent document — the
// partner sees it in the app. Same behaviour as RejectDialog (empty on open,
// stays mounted with the typed note when the decision fails), but the length cap
// is the endpoint's (rider notes 200, agent reasons 300) and the copy lives
// under `partners.<variant>.*`.
export function PartnerRejectDialog({
  t,
  variant,
  title,
  max,
  pending,
  error,
  noteInvalid = false,
  onClose,
  onConfirm,
}: {
  t: TFn;
  /** Copy namespace under `partners.`: `reject_rider_doc` or `reject_agent_doc`. */
  variant: "reject_rider_doc" | "reject_agent_doc";
  title: string;
  max: number;
  pending: boolean;
  error: string | null;
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
        {t(`partners.${variant}.note_label`)}
      </label>
      <textarea
        ref={field}
        id={id}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error && noteInvalid ? true : undefined}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={max}
        placeholder={t(`partners.${variant}.note_placeholder`)}
        className={`${fInput} resize-none`}
      />
      <div className="flex items-center justify-between gap-3 mt-1.5 text-[11px] text-subtext">
        <span id={hintId}>{t(`partners.${variant}.note_hint`)}</span>
        <span className="tabular-nums" dir="ltr">
          {note.length}/{max}
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
          {t(`partners.${variant}.confirm`)}
        </Button>
      </div>
    </Modal>
  );
}
