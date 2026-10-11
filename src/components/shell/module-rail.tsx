"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { moduleHasAttention, resolvePath, visibleModules } from "@/lib/nav/modules";
import type { StaffRole } from "@/lib/auth/access";
import { useAttention } from "./attention-provider";

export function ModuleRail({ staffRole }: { staffRole: StaffRole }) {
  const pathname = usePathname();
  const t = useTranslations("shell.modules");
  const tn = useTranslations("shell.nav");
  const counts = useAttention();
  const activeKey = resolvePath(pathname)?.module.key;

  return (
    <nav
      aria-label={tn("modules")}
      className="w-[76px] shrink-0 h-full bg-rail flex flex-col items-center gap-0.5 py-2.5 overflow-y-auto"
    >
      {visibleModules(staffRole).map((m) => {
        const active = m.key === activeKey;
        return (
          <Link
            key={m.key}
            href={m.pages[0].href}
            aria-current={active ? "page" : undefined}
            className={`relative w-[66px] pt-2 pb-1.5 rounded-[10px] flex flex-col items-center gap-1 text-[10.5px] font-semibold text-center transition-colors ${
              active
                ? "bg-primary/20 text-rail-active"
                : "text-rail-text hover:bg-white/5 hover:text-rail-active"
            }`}
          >
            <DashIcon name={m.icon} className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
            <span className="max-w-full truncate px-0.5">{t(`${m.key}.name`)}</span>
            {moduleHasAttention(m, counts) && (
              <span className="absolute top-1.5 end-3 w-2 h-2 rounded-full bg-primary ring-2 ring-rail" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
