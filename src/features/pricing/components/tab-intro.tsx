"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { termTags } from "./term";

const TABS: Record<string, string> = {
  "/pricing": "overview",
  "/pricing/zones": "zones",
  "/pricing/tiers": "tiers",
  "/pricing/vehicles": "vehicles",
  "/pricing/formula": "formula",
  "/pricing/overrides": "overrides",
  "/pricing/simulator": "simulator",
  "/pricing/history": "history",
};

/** One sentence under the tab bar: what this page is for and when to use it. */
export function TabIntro() {
  const t = useTranslations("pricing");
  const pathname = usePathname().replace(/\/$/, "");
  const tab = TABS[pathname];
  if (!tab) return null;
  return <p className="mb-5 max-w-3xl text-[13px] leading-relaxed text-subtext">{(t.rich as unknown as (key: string, values: typeof termTags) => ReactNode)(`intro.${tab}`, termTags)}</p>;
}
