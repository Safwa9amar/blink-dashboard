"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { STAFF_ROLES, type StaffMember, type StaffRole } from "../data";
import { useStaffStore } from "../store";

export function EditAccessButton({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("access");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t("edit.title")}
        className="p-1.5 rounded-lg hover:bg-card-hover text-subtext hover:text-text transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
      </button>
      {open && <EditAccessModal member={member} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditAccessModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const t = useTranslations("access");
  const updateRole = useStaffStore((s) => s.updateRole);
  const [role, setRole] = useState<StaffRole>(member.staffRole);

  function handleSave() {
    // Demo path: updates the client store. The migration-ready Supabase update is
    // setStaffRole() in action.ts.
    updateRole(member.id, role);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={t("edit.title")}>
      <p className="text-sm text-subtext mb-4">{t("edit.desc", { name: member.name })}</p>

      <label className="block text-sm font-medium text-subtext mb-1">{t("edit.role")}</label>
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

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave}>
          {t("edit.save")}
        </Button>
      </div>
    </Modal>
  );
}
