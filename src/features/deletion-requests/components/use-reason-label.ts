"use client";

import { useTranslations } from "next-intl";
import { DELETION_REASONS } from "../types";

/** Translates the app's reason code; an unknown code is shown as-is. */
export function useReasonLabel() {
  const t = useTranslations("deletion_requests");
  return (reason: string | null) => {
    if (!reason) return "—";
    return (DELETION_REASONS as readonly string[]).includes(reason)
      ? t(`reasons.${reason}` as Parameters<typeof t>[0])
      : reason;
  };
}
