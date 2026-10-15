"use client";

import { useTranslations } from "next-intl";
import { CsatTab } from "@/features/support/components/csat-tab";
import type { CsatStats } from "@/features/support/csat-agents";

export default function CsatClient({ stats }: { stats: CsatStats }) {
  const t = useTranslations("support");
  return <CsatTab t={t} stats={stats} />;
}
