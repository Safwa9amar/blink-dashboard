"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { cancelDeletionRequest } from "@/app/d/deletion-requests/action";
import type { DeletionRequest } from "../types";

// What filing the request switched off for each role, and how it comes back.
const ROLE_NOTE: Record<string, string> = {
  merchant: "cancel_note_merchant",
  agent: "cancel_note_agent",
  rider: "cancel_note_rider",
};

export function CancelDeletionButton({ request }: { request: DeletionRequest }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("deletion_requests");
  const name = request.name || t("deleted_user");
  const note = ROLE_NOTE[request.role];

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelDeletionRequest(request.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {t("cancel_request")}
      </Button>

      <Modal open={open} onClose={close} title={t("cancel_title")}>
        <p className="text-sm text-[var(--text)] mb-3">{t("cancel_intro", { name })}</p>
        {note && (
          <p className="text-sm text-[var(--subtext)] mb-5">{t(note as Parameters<typeof t>[0])}</p>
        )}

        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-xl p-3 mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={close} disabled={isPending}>
            {t("back")}
          </Button>
          <Button variant="primary" size="sm" loading={isPending} onClick={handleCancel}>
            {isPending ? t("cancelling") : t("cancel_confirm")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
