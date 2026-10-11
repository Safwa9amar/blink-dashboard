"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, DashIcon, EmptyState } from "@/components/ui";
import type { AttentionRow } from "../types";

export function AttentionList({ rows }: { rows: AttentionRow[] }) {
  const t = useTranslations("overview");
  const locale = useLocale();
  return (
    <Card title={t("attention.title")} description={t("attention.description")}>
      {rows.length === 0 ? (
        <EmptyState title={t("attention.empty")} />
      ) : (
        <ul className="divide-y divide-border -my-2">
          {rows.map((r) => (
            <li key={r.key}>
              <Link href={r.href} className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-text hover:text-primary transition-colors">
                <span>{t(`attention.${r.key}`)}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="warning">{r.count.toLocaleString(locale)}</Badge>
                  <DashIcon name="chevron-right" className="w-4 h-4 text-subtext rtl:rotate-180" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
