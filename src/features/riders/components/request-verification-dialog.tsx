"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, fInput } from "@/components/ui";
import {
  RIDER_DOC_GROUPS,
  RIDER_NOTE_MAX,
  riderDocLabel,
  type RiderDocKey,
  type RiderDocSlot,
} from "@/features/verification/partners";
import { defaultSelection, requiredSlots } from "../verification-request";

export type RequestOutcome = { ok: true } | { ok: false; message: string };

const STATUS_TONE: Record<string, string> = {
  verified: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  rejected: "bg-danger-light text-danger",
  missing: "bg-muted text-subtext",
};

// Pick the documents the rider has to send again, say why, and send the request.
// Mounted only while open, so every opening starts from the defaults.
export function RequestVerificationDialog({
  name,
  vehicleType,
  approved,
  docs,
  onClose,
  submit,
  onSent,
}: {
  name: string;
  vehicleType: string | null;
  /** The rider is currently approved, so the request takes them offline. */
  approved: boolean;
  docs: readonly RiderDocSlot[];
  onClose: () => void;
  submit: (documents: RiderDocKey[], note: string) => Promise<RequestOutcome>;
  onSent: () => void;
}) {
  const t = useTranslations("riders.request");
  const tv = useTranslations("verification");
  const noteId = useId();
  const slots = requiredSlots(docs);
  const [selected, setSelected] = useState<RiderDocKey[]>(() => defaultSelection(vehicleType));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (key: RiderDocKey) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const canSend = selected.length > 0 && note.trim().length > 0 && !pending;

  const send = () => {
    if (!canSend) return;
    setError(null);
    start(async () => {
      const outcome = await submit(selected, note.trim());
      if (outcome.ok) onSent();
      else setError(outcome.message);
    });
  };

  return (
    <Modal open onClose={pending ? () => {} : onClose} title={t("title")} widthClassName="max-w-lg">
      <p className="text-[13px] text-subtext mb-4">{t("intro", { name })}</p>

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-text">{t("documents")}</h4>
        <div className="flex gap-3 text-xs font-semibold">
          <button type="button" className="text-primary cursor-pointer" onClick={() => setSelected(slots.map((s) => s.key))}>
            {t("select_all")}
          </button>
          <button type="button" className="text-subtext hover:text-text cursor-pointer" onClick={() => setSelected([])}>
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {RIDER_DOC_GROUPS.map((group) => {
          const groupSlots = slots.filter((s) => s.group === group);
          if (groupSlots.length === 0) return null;
          return (
            <fieldset key={group}>
              <legend className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
                {tv(`partners.rider.group.${group}` as never)}
              </legend>
              {groupSlots.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2.5 py-1.5 text-[13px] text-text cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={selected.includes(s.key)}
                    onChange={() => toggle(s.key)}
                  />
                  <span className="min-w-0 flex-1 truncate">{riderDocLabel(tv as never, s.key)}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[s.status] ?? STATUS_TONE.missing}`}>
                    {tv(`status.${s.status}` as never)}
                  </span>
                </label>
              ))}
            </fieldset>
          );
        })}
      </div>
      {selected.length === 0 && <p className="text-xs text-danger mb-3">{t("pick_one")}</p>}

      <label htmlFor={noteId} className="block text-xs font-semibold text-text mb-2">
        {t("reason")}
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={RIDER_NOTE_MAX}
        placeholder={t("reason_placeholder")}
        className={`${fInput} resize-none`}
      />
      <p className="mt-1 text-end text-[11px] text-subtext tabular-nums" dir="ltr">
        {note.length}/{RIDER_NOTE_MAX}
      </p>

      <p
        className={`mt-3 rounded-lg p-3 text-[13px] ${approved ? "bg-warning-light text-warning font-semibold" : "bg-muted text-subtext"}`}
      >
        {approved ? t("warning_offline", { name }) : t("note_neutral", { name })}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-light p-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {t("cancel")}
        </Button>
        <Button onClick={send} loading={pending} disabled={!canSend}>
          {pending ? t("sending") : t("send")}
        </Button>
      </div>
    </Modal>
  );
}
