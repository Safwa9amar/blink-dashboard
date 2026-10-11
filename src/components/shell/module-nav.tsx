"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { pageCount, resolvePath, visibleModules } from "@/lib/nav/modules";
import type { StaffRole } from "@/lib/auth/access";
import { useAttention } from "./attention-provider";

// The 232px module menu. `collapsed` animates the width to 0 (the toggle lives in the
// shell's content header so it stays reachable).
export function ModuleNav({ staffRole, collapsed = false }: { staffRole: StaffRole; collapsed?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("shell.modules");
  const ts = useTranslations("sidebar");
  const tn = useTranslations("shell.nav");
  const tsec = useTranslations("shell.sections");
  const counts = useAttention();

  const modules = visibleModules(staffRole);
  const resolved = resolvePath(pathname);
  const current = modules.find((m) => m.key === resolved?.module.key) ?? modules.find((m) => m.key === "home") ?? modules[0];
  if (!current) return null;

  return (
    <aside
      aria-hidden={collapsed}
      className={`shrink-0 h-full bg-card border-e border-border overflow-hidden transition-[width] duration-200 ${
        collapsed ? "w-0 border-e-0" : "w-[232px]"
      }`}
    >
      <div className="w-[232px] h-full overflow-y-auto px-2.5 py-4">
        <h2 className="text-sm font-bold text-text px-2.5 pb-0.5">{t(`${current.key}.name`)}</h2>
        <p className="text-[11.5px] leading-snug text-subtext px-2.5 pb-3.5 mb-2 border-b border-border">
          {t(`${current.key}.description`)}
        </p>
        <ul className="space-y-0.5">
          {current.pages.map((page, i) => {
            const showHeading = !collapsed && page.section && page.section !== current.pages[i - 1]?.section;
            const active = resolved?.page.href === page.href;
            const count = pageCount(page, counts);
            return (
              <li key={page.href}>
                {showHeading && (
                  <div className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase text-subtext opacity-75">
                    {tsec(page.section as never)}
                  </div>
                )}
                <Link
                  href={page.href}
                  tabIndex={collapsed ? -1 : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-soft-pink text-primary font-semibold"
                      : "text-subtext font-medium hover:bg-background hover:text-text"
                  }`}
                >
                  <DashIcon name={page.icon} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ts(page.key as never)}</span>
                  {count > 0 && (
                    <span
                      title={tn("waiting", { count })}
                      className="ms-auto text-[11px] font-bold text-white bg-primary rounded-full px-[7px] leading-[18px]"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
