"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashIcon, Skeleton } from "@/components/ui";
import { getRecord } from "@/lib/shell/actions";
import type { RecordDetail, RecordKind } from "@/lib/shell/search-types";
import { enumLabel, formatWhen } from "./search-format";

const PAGE_LABEL: Record<RecordKind, string> = { order: "orders", transaction: "blink_cash", person: "users", store: "merchants" };

/** Side panel (`end-0`, so it mirrors in RTL) with a record's key fields. */
export function RecordPeek({ kind, id, onClose }: { kind: RecordKind; id: string; onClose: () => void }) {
  const t = useTranslations("search");
  const tNav = useTranslations("sidebar");
  const locale = useLocale();
  const [state, setState] = useState<{ key: string; detail: RecordDetail | null } | null>(null);
  const key = `${kind}:${id}`;
  const loading = state?.key !== key;
  const detail = loading ? null : state.detail;

  useEffect(() => {
    let live = true;
    getRecord(kind, id)
      .then((d) => live && setState({ key, detail: d }))
      .catch(() => live && setState({ key, detail: null }));
    return () => {
      live = false;
    };
  }, [kind, id, key]);

  const fieldValue = (label: string, value: string) => {
    if (!value || value === "—") return "—";
    if (label === "status" || label === "type" || label === "role") return enumLabel(t, label, value);
    if (label === "created" || label === "updated" || label === "joined") return formatWhen(value, locale);
    return value;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-label={t(`groups.${kind}`)}
        className="absolute inset-y-0 end-0 w-full max-w-sm bg-card border-s border-border shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtext">{t(`groups.${kind}`)}</p>
            <h2 className="text-base font-semibold text-text truncate">{detail?.title ?? "…"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover cursor-pointer"
          >
            <DashIcon name="x" className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !detail ? (
            <p className="text-sm text-subtext py-8 text-center">{t("not_found")}</p>
          ) : (
            <dl className="divide-y divide-border">
              {detail.fields.map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
                  <dt className="text-subtext shrink-0">{t(`fields.${f.label}`)}</dt>
                  <dd className="text-text font-medium text-end break-words min-w-0" dir="auto">
                    {fieldValue(f.label, f.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {detail && (
          <footer className="px-5 py-4 border-t border-border">
            <Link
              href={detail.listHref}
              onClick={onClose}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary hover:underline"
            >
              {t("open_in", { page: tNav(PAGE_LABEL[kind]) })}
              <DashIcon name="chevron-right" className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
