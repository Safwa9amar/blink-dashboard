"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { DashIcon } from "@/components/ui";
import type { StaffRole } from "@/lib/auth/access";
import { useDismiss } from "./use-dismiss";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export function StaffMenu({ staffRole, staffName }: { staffRole: StaffRole; staffName: string }) {
  const t = useTranslations("shell.staff_menu");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={staffName}
        className="w-9 h-9 rounded-full bg-soft-pink text-primary text-xs font-bold flex items-center justify-center border border-soft-border cursor-pointer"
      >
        {initialsOf(staffName)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50"
        >
          <div className="px-2.5 py-2 border-b border-border mb-1">
            <div className="text-[10px] uppercase tracking-wider text-subtext font-medium">{t("signed_in_as")}</div>
            <div className="text-sm font-semibold text-text truncate">{staffName}</div>
            <div className="text-xs text-subtext">{t(`roles.${staffRole}`)}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              router.push("/login/password");
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-subtext hover:text-text hover:bg-background transition-colors cursor-pointer"
          >
            <DashIcon name="lock" className="w-4 h-4" />
            {t("change_password")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
          >
            <DashIcon name="logout" className="w-4 h-4" />
            {t("sign_out")}
          </button>
        </div>
      )}
    </div>
  );
}
