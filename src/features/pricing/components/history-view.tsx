"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, fInput, type Column } from "@/components/ui";
import { formatValueInline } from "../format";
import { PRICING_KEYS, type Change, type TFn } from "../types";

export function HistoryView({ changes, error }: { changes: Change[]; error?: string }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  const columns: Column<Change>[] = [
    {
      key: "created_at",
      label: t("history.col.when"),
      render: (c) => (
        <span className="text-xs text-subtext whitespace-nowrap">
          {new Date(c.created_at).toLocaleString(locale === "ar" ? "ar-DZ-u-nu-latn" : locale, {
            timeZone: "Africa/Algiers",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    { key: "actor_name", label: t("history.col.actor"), render: (c) => c.actor_name || "—" },
    {
      key: "key",
      label: t("history.col.fee"),
      render: (c) => <span className="font-semibold text-text">{t(`fees.${c.key}.name`)}</span>,
    },
    { key: "action", label: t("history.col.action"), render: (c) => t(`history.action.${c.action}`) },
    {
      key: "diff",
      label: t("history.col.change"),
      sortable: false,
      render: (c) => (
        <span className="text-sm text-text">
          <span className="text-subtext">{c.before ? formatValueInline(c.key, c.before, tf) : "—"}</span>
          {" → "}
          {c.after ? formatValueInline(c.key, c.after, tf) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <select
          className={`${fInput} !w-auto min-w-[200px]`}
          value={params.get("key") ?? ""}
          onChange={(e) => router.replace(e.target.value ? `/pricing/history?key=${e.target.value}` : "/pricing/history")}
        >
          <option value="">{t("overrides.filter.all_fees")}</option>
          {PRICING_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`fees.${k}.name`)}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={changes} error={error} emptyMessage={t("history.empty")} />
    </div>
  );
}
