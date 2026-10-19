"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";

/** A yes / no confirmation in the UI kit Modal (never window.confirm). */
export function PackConfirm({
  title,
  body,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  /** Red confirm button (irreversible actions). */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("packs.manage");
  return (
    <Modal open title={title} onClose={loading ? () => {} : onCancel}>
      <p className="text-sm text-text whitespace-pre-wrap break-words mb-5">{body}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" disabled={loading} onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          icon={danger ? "trash" : "archive"}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
