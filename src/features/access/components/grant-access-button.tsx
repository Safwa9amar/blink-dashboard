"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { STAFF_ROLES, type StaffRole } from "../data";
import { useStaffStore } from "../store";

// Quick "invite an existing Blink user by email" flow — a lighter alternative to
// the full create-staff form. Adds them as `invited`.
export function GrantAccessButton() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("access");
  const inviteByEmail = useStaffStore((s) => s.inviteByEmail);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("support_admin");
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setEmail("");
    setRole("support_admin");
    setError("");
  }

  function handleGrant() {
    if (!email.trim()) {
      setError(t("create.required"));
      return;
    }
    // Demo path: adds to the client store. The migration-ready Supabase update is
    // grantStaffRole() in action.ts.
    inviteByEmail(email.trim(), role);
    close();
  }

  return (
    <>
      <Button variant="secondary" icon="mail" size="sm" onClick={() => setOpen(true)}>
        {t("grant.button")}
      </Button>

      <Modal open={open} onClose={close} title={t("grant.title")}>
        <p className="text-sm text-subtext mb-4">{t("grant.desc")}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-subtext mb-1">{t("grant.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("grant.email_ph")}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-subtext mb-1">{t("grant.role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-text outline-none focus:border-primary cursor-pointer"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}.name`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 bg-danger-light border border-danger/20 rounded-xl">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={close}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" disabled={!email.trim()} onClick={handleGrant}>
            {t("grant.submit")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
