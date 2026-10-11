"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { CREATE_ACTIONS } from "@/lib/nav/modules";
import { useDismiss } from "./use-dismiss";

export function CreateMenu({ staffRole }: { staffRole: StaffRole }) {
  const t = useTranslations("shell.create");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  const actions = CREATE_ACTIONS.filter((a) => canAccessPath(staffRole, a.href));
  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 px-3 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
      >
        <DashIcon name="plus" className="w-4 h-4" />
        <span className="hidden sm:inline">{t("button")}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50"
        >
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              role="menuitem"
              onClick={close}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text hover:bg-background"
            >
              <DashIcon name={a.icon} className="w-4 h-4 text-subtext" />
              {t(a.key as never)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
