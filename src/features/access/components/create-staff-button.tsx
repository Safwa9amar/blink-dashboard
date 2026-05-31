"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { STAFF_ROLES, type StaffRole, type StaffStatus } from "../data";
import { useStaffStore } from "../store";

const STATUSES: StaffStatus[] = ["active", "invited", "suspended"];

export function CreateStaffButton() {
  const t = useTranslations("access");
  const addMember = useStaffStore((s) => s.addMember);

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("ops_admin");
  const [status, setStatus] = useState<StaffStatus>("active");
  const [error, setError] = useState("");

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRole("ops_admin");
    setStatus("active");
    setError("");
  }

  function close() {
    setOpen(false);
    reset();
  }

  function handleCreate() {
    if (!firstName.trim() || !email.trim() || !phone.trim()) {
      setError(t("create.required"));
      return;
    }
    // Demo path: adds to the client store so the new member shows up instantly.
    // The migration-ready Supabase insert is createStaffMember() in action.ts.
    addMember({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      staffRole: role,
      status,
    });
    close();
  }

  const label = "block text-sm font-medium text-subtext mb-1";
  const field =
    "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-text outline-none focus:border-primary";

  return (
    <>
      <Button icon="plus" size="sm" onClick={() => setOpen(true)}>
        {t("create.button")}
      </Button>

      <Modal open={open} onClose={close} title={t("create.title")}>
        <p className="text-sm text-subtext mb-4">{t("create.desc")}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t("create.first_name")}</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>{t("create.last_name")}</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={label}>{t("create.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("grant.email_ph")} className={field} />
          </div>

          <div>
            <label className={label}>{t("create.phone")}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213 …" className={field} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t("create.role")}</label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={`${field} cursor-pointer`}>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}.name`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>{t("create.status")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as StaffStatus)} className={`${field} cursor-pointer`}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
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
          <Button variant="primary" size="sm" onClick={handleCreate}>
            {t("create.submit")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
