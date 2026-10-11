"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { completeDeletionRequest } from "@/app/d/deletion-requests/action";
import type { DeletionRequest } from "../types";

export function CompleteDeletionButton({ request }: { request: DeletionRequest }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("deletion_requests");
  const name = request.name || t("deleted_user");

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeDeletionRequest(request.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        {t("complete")}
      </Button>

      <Modal open={open} onClose={close} title={t("complete_title")}>
        <p className="text-sm text-[var(--text)] mb-3">{t("complete_intro", { name })}</p>
        <ul className="list-disc ps-5 space-y-1 text-sm text-[var(--subtext)] mb-3">
          <li>{t("complete_login")}</li>
          <li>{t("complete_profile")}</li>
          <li>{t("complete_documents")}</li>
        </ul>
        <p className="text-sm text-[var(--subtext)] mb-3">{t("complete_kept")}</p>
        <p className="text-sm font-semibold text-[var(--danger)] mb-5">{t("complete_irreversible")}</p>

        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-xl p-3 mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={close} disabled={isPending}>
            {t("keep_pending")}
          </Button>
          <Button variant="danger" size="sm" loading={isPending} onClick={handleComplete}>
            {isPending ? t("completing") : t("complete_confirm")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
