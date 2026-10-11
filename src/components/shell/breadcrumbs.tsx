"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { resolvePath } from "@/lib/nav/modules";

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("shell");
  const ts = useTranslations("sidebar");
  const resolved = resolvePath(pathname);
  if (!resolved) return null;

  return (
    <nav aria-label={t("breadcrumbs.label")} className="flex items-center gap-1.5 text-xs text-subtext min-w-0">
      <span className="truncate">{t(`modules.${resolved.module.key}.name`)}</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 shrink-0 rtl:rotate-180"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
      <span className="font-semibold text-text truncate">{ts(resolved.page.key as never)}</span>
    </nav>
  );
}
