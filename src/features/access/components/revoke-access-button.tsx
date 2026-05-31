"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import type { StaffMember } from "../data";
import { useStaffStore } from "../store";

export function RevokeAccessButton({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("access");
  const remove = useStaffStore((s) => s.remove);

  function handleRevoke() {
    // Demo path: removes from the client store. The migration-ready Supabase
    // update (setStaffRole(id, null)) lives in action.ts.
    remove(member.id);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t("revoke.button")}
        className="p-1.5 rounded-lg hover:bg-danger-light text-subtext hover:text-danger transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("revoke.title")}>
        <p className="text-sm text-subtext">{t("revoke.desc", { name: member.name })}</p>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" size="sm" onClick={handleRevoke}>
            {t("revoke.confirm")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
