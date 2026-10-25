"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, FilterPills } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { TX_STATUSES, toQuery, type LedgerFilters } from "../lib/filters";
import type { TFn } from "../types";

/**
 * Ledger filter controls. Everything lives in the URL: the status pills navigate at once,
 * the text / select / date fields apply together on Enter or "Apply". Keyed by the query by
 * the page so it resets when the filters change from elsewhere.
 */
export function LedgerFilterBar({ t, filters }: { t: TFn; filters: LedgerFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState({
    q: filters.q,
    type: filters.type ?? "",
    method: filters.method ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
  });
  const go = (next: Partial<typeof draft> & { status?: string }) =>
    router.push(`${pathname}?${toQuery({ ...draft, status: filters.status, ...next })}`.replace(/\?$/, ""));
  const set = (k: keyof typeof draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const dirty = !!(filters.q || filters.type || filters.method || filters.from || filters.to || filters.status);

  return (
    <div className="mb-4">
      <FilterPills<string>
        options={[["", t("f.all")], ...TX_STATUSES.map((s): [string, string] => [s, t(`tx_status.${s}`)])]}
        value={filters.status ?? ""}
        onChange={(v) => go({ status: v })}
      />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          go({});
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-text min-w-[220px] flex-1 max-w-xs">
          {t("ledger.q")}
          <input className={fInput} dir="auto" value={draft.q} onChange={set("q")} placeholder={t("ledger.search")} maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("col.type")}
          <select className={fInput} value={draft.type} onChange={set("type")}>
            <option value="">{t("f.all")}</option>
            <option value="deposit">{t("tx_type.deposit")}</option>
            <option value="withdrawal">{t("tx_type.withdrawal")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("col.method")}
          <select className={fInput} value={draft.method} onChange={set("method")}>
            <option value="">{t("f.all")}</option>
            <option value="agent">{t("method.agent")}</option>
            <option value="electronic">{t("method.electronic")}</option>
            <option value="online">{t("method.online")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("ledger.from")}
          <input type="date" className={fInput} value={draft.from} onChange={set("from")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("ledger.to")}
          <input type="date" className={fInput} value={draft.to} onChange={set("to")} />
        </label>
        <Button type="submit" size="md">
          {t("ledger.apply")}
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
            {t("ledger.reset")}
          </Button>
        )}
      </form>
    </div>
  );
}
