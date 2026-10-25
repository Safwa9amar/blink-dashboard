"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { inboxKind } from "@/lib/shell/inbox-kinds";
import type { InboxItem } from "@/lib/shell/inbox-types";
import { money } from "./format";

// Every ICU argument the kinds' copy uses, so a param missing from an older row
// renders blank instead of failing the whole message.
const DEFAULTS: Record<string, string | number> = {
  store: "", product: "", pack: "", shop: "", trip: "", rule: "", title: "", subject: "",
  rating: 0, recipients: 0, role: "customer", scope: "account", amount: "", provider: "",
};

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
/** A raw code ("out_of_stock") reads as words; free text is left alone. */
const subLine = (v: unknown): string => {
  const s = text(v);
  return /^[a-z]+(_[a-z]+)+$/.test(s) ? s.replace(/_/g, " ") : s;
};

/** Renders a notification's title (+ optional second line) in the viewer's language. */
export function useInboxText() {
  const t = useTranslations("inbox");
  return useCallback(
    (item: InboxItem): { title: string; sub: string } => {
      const kind = inboxKind(item.kind);
      const key = `kinds.${item.kind}`;
      // A kind the dashboard doesn't know yet: the DB's English summary.
      if (!kind || !t.has(key)) return { title: item.summary, sub: "" };
      const p = item.params;
      const args = {
        ...DEFAULTS,
        ...p,
        name: text(p.name) || t("someone"),
        amount: typeof p.amount === "number" ? money(p.amount) : text(p.amount),
        count: item.count,
      };
      return { title: t(key, args), sub: kind.sub ? subLine(p[kind.sub]) : "" };
    },
    [t]
  );
}
