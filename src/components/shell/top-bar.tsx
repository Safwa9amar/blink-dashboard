"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { NotificationBell } from "@/features/notifications";
import type { StaffRole } from "@/lib/auth/access";
import { LanguageSwitcher } from "../language-switcher";
import { ThemeSwitcher } from "../theme-switcher";
import { CreateMenu } from "./create-menu";
import { StaffMenu } from "./staff-menu";

const noopSubscribe = () => () => {};
const isMacSnapshot = () => /Mac|iPhone|iPad/.test(navigator.platform);

export function TopBar({
  staffRole,
  staffName,
  onOpenSearch,
  onOpenDrawer,
}: {
  staffRole: StaffRole;
  staffName: string;
  onOpenSearch: () => void;
  onOpenDrawer: () => void;
}) {
  const t = useTranslations("shell");
  const isMac = useSyncExternalStore(noopSubscribe, isMacSnapshot, () => true);

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-4 bg-card border-b border-border">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label={t("topbar.open_menu")}
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-subtext hover:text-text hover:bg-background cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-5 h-5" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Image src="/images/logo-b.png" alt="Blink" width={28} height={28} style={{ height: "auto" }} />
        <span className="text-base font-bold text-text leading-none">Blink</span>
        <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-widest text-subtext">
          {t("admin")}
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex-1 max-w-md mx-auto h-9 flex items-center gap-2 px-3 rounded-xl bg-background border border-border text-sm text-subtext hover:border-primary/40 transition-colors cursor-pointer min-w-0"
      >
        <DashIcon name="search" className="w-4 h-4 shrink-0" />
        <span className="truncate text-start flex-1">{t("topbar.search_placeholder")}</span>
        <kbd className="hidden sm:inline text-[10px] font-semibold border border-border rounded-md px-1.5 py-0.5 bg-card" dir="ltr">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <div className="flex items-center gap-2 ms-auto">
        <CreateMenu staffRole={staffRole} />
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <ThemeSwitcher />
        <NotificationBell />
        <StaffMenu staffRole={staffRole} staffName={staffName} />
      </div>
    </header>
  );
}
