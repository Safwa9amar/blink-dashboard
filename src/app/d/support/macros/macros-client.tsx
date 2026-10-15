"use client";

import { useTranslations } from "next-intl";
import { MacrosTab } from "@/features/support/components/macros-tab";
import type { MacroRow } from "@/features/support/macros";

export default function MacrosClient({
  macros,
  migrationPending,
  error,
}: {
  macros: MacroRow[];
  migrationPending: boolean;
  error?: string;
}) {
  const t = useTranslations("support");
  return <MacrosTab t={t} macros={macros} migrationPending={migrationPending} error={error} />;
}
