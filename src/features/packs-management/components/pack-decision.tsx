"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { setPackStatus } from "@/app/d/packs-management/action";

/**
 * Staff actions on a pack. `review` (under review): approve, or reject with a note.
 * `deactivate` (live): take the pack down with a note. The note is shown to the
 * merchant and only sent with a rejection / deactivation (required then); approving
 * never sends it. `expectedUpdatedAt` is the pack version on screen — blink-server
 * refuses the decision (409) if the pack changed meanwhile. Errors stay inline.
 */
export function PackDecision({
  packId,
  expectedUpdatedAt,
  mode,
  onDone,
}: {
  packId: string;
  expectedUpdatedAt: string;
  mode: "review" | "deactivate";
  onDone: () => void;
}) {
  const t = useTranslations("packs");
  const noteId = useId();
  const hintId = useId();
  const [expanded, setExpanded] = useState(mode === "review");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<"active" | "inactive" | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(status: "active" | "inactive") {
    const trimmed = note.trim();
    if (status === "inactive" && !trimmed) {
      setError(t("decision.note_required"));
      return;
    }
    setError(null);
    setActing(status);
    startTransition(async () => {
      const result = await setPackStatus(packId, status, {
        note: status === "inactive" ? trimmed : undefined,
        expectedUpdatedAt,
      });
      setActing(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  if (!expanded) {
    return (
      <Button className="w-full" variant="secondary" icon="x" onClick={() => setExpanded(true)}>
        {t("action.deactivate")}
      </Button>
    );
  }

  return (
    <div className="pt-1">
      <div className="mb-3">
        <label htmlFor={noteId} className="block text-[12.5px] font-bold text-text mb-1">
          {mode === "review" ? t("decision.note_reject") : t("decision.note_deactivate")}
        </label>
        <p id={hintId} className="text-[11.5px] text-subtext mb-2">
          {mode === "review" ? t("decision.note_hint_review") : t("decision.note_hint_deactivate")}
        </p>
        <textarea
          id={noteId}
          aria-describedby={hintId}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          placeholder={mode === "review" ? t("decision.reject_placeholder") : t("decision.deactivate_placeholder")}
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

      {mode === "review" ? (
        <div className="flex gap-3">
          <Button
            className="flex-1"
            icon="check"
            loading={isPending && acting === "active"}
            disabled={isPending}
            onClick={() => run("active")}
          >
            {t("action.approve")}
          </Button>
          <Button
            className="flex-1"
            variant="secondary"
            icon="x"
            loading={isPending && acting === "inactive"}
            disabled={isPending}
            onClick={() => run("inactive")}
          >
            {t("action.reject")}
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            className="flex-1"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setExpanded(false);
              setError(null);
            }}
          >
            {t("action.cancel")}
          </Button>
          <Button className="flex-1" variant="danger" loading={isPending} onClick={() => run("inactive")}>
            {t("action.confirm_deactivate")}
          </Button>
        </div>
      )}
    </div>
  );
}
