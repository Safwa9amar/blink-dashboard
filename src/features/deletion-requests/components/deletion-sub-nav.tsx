"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";

/** Requests (the pending queue) · History (every deleted or cancelled request). */
export function DeletionSubNav({ pending, processed }: { pending: number; processed: number }) {
  const t = useTranslations("deletion_requests");
  return (
    <SubNav
      items={[
        {
          href: "/deletion-requests",
          label: t("tab_requests"),
          icon: "clock",
          count: pending ? String(pending) : undefined,
        },
        {
          href: "/deletion-requests/history",
          label: t("tab_history"),
          icon: "doc",
          count: processed ? String(processed) : undefined,
        },
      ]}
    />
  );
}
