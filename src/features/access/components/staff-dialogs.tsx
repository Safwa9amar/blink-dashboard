"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { changeStaffRole } from "@/app/d/access/action";
import type { StaffRole } from "../data";
import { ErrorBox, LABEL, RoleSelect, useErrorText } from "./shared";

export function ConfirmDialog({
  title,
  desc,
  actionLabel,
  danger,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  danger?: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("access");
  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-subtext">{desc}</p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
          {t("cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm} loading={busy}>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function ChangeRoleDialog({
  userId,
  name,
  current,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  current: StaffRole;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [role, setRole] = useState<StaffRole>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await changeStaffRole(userId, role);
    setBusy(false);
    if (res.error) setError(errorText(res.error));
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title={t("role_dialog.title")}>
      <p className="text-sm text-subtext mb-4">{t("role_dialog.desc", { name })}</p>
      <label htmlFor="cr-role" className={LABEL}>
        {t("role_dialog.role")}
      </label>
      <RoleSelect id="cr-role" value={role} onChange={setRole} />
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
          {t("cancel")}
        </Button>
        <Button size="sm" onClick={save} loading={busy} disabled={role === current}>
          {busy ? t("role_dialog.saving") : t("role_dialog.save")}
        </Button>
      </div>
    </Modal>
  );
}

export function TempPasswordDialog({
  email,
  name,
  password,
  reset,
  onDone,
}: {
  email: string;
  name: string;
  password: string;
  reset: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("access");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the password is still selectable in the box.
    }
  }

  return (
    <Modal open onClose={onDone} title={t("temp.title")}>
      <p className="text-sm text-subtext mb-4">{t(reset ? "temp.reset" : "temp.created", { name })}</p>
      <div className="rounded-xl border border-border bg-background p-3 space-y-2.5 font-mono text-sm" dir="ltr">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-subtext">{t("temp.email")}</div>
          <div className="text-text break-all select-all">{email}</div>
        </div>
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-subtext">{t("temp.password")}</div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-text text-base font-semibold tracking-wide select-all break-all">{password}</span>
            <Button variant="secondary" size="xs" icon="copy" onClick={copy} className="shrink-0 font-sans">
              {copied ? t("temp.copied") : t("temp.copy")}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-warning mt-3" role="status" aria-live="polite">
        {t("temp.note")}
      </p>
      <div className="flex justify-end mt-6">
        <Button size="sm" onClick={onDone}>
          {t("temp.done")}
        </Button>
      </div>
    </Modal>
  );
}
