"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { StaffRole } from "@/lib/auth/access";
import { ModuleNav } from "./module-nav";
import { ModuleRail } from "./module-rail";

// Below 1024px: overlay panel from the start edge holding rail + module menu. The shell
// closes it on navigation (it is only "open" for the pathname it was opened on) and Esc.
export function MobileDrawer({
  open,
  onClose,
  staffRole,
}: {
  open: boolean;
  onClose: () => void;
  staffRole: StaffRole;
}) {
  const t = useTranslations("shell.topbar");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-40 flex">
      <div className="flex h-full max-w-[90vw] shadow-xl">
        <ModuleRail staffRole={staffRole} />
        <ModuleNav staffRole={staffRole} />
      </div>
      <button
        type="button"
        aria-label={t("close_menu")}
        onClick={onClose}
        className="flex-1 bg-black/40 cursor-pointer"
      />
    </div>
  );
}
