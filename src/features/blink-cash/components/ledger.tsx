"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui";
import { LEDGER_PAGE_SIZE, toQuery, type LedgerFilters } from "../lib/filters";
import type { LedgerRow, TFn } from "../types";
import { LedgerFilterBar } from "./ledger-filters";
import { ledgerColumns } from "./ledger-columns";
import { ExportLink, LoadError, MigrationNotice, Pagination } from "./ops-shared";

/** Ledger tab: filters in the URL, rows paged by the server, each row opens its detail page. */
export function Ledger({
  rows,
  total,
  filters,
  migrationPending,
  error,
}: {
  rows: LedgerRow[];
  total: number;
  filters: LedgerFilters;
  migrationPending?: boolean;
  error?: string;
}) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const { page, ...rest } = filters;
  const qs = toQuery(rest);
  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] text-subtext tabular-nums">{t("ledger.count", { n: total })}</span>
        <div className="ms-auto">
          <ExportLink href={`/blink-cash/export/ledger${qs ? `?${qs}` : ""}`} label={t("export")} />
        </div>
      </div>
      <LedgerFilterBar key={qs} t={t} filters={filters} />
      {error && !migrationPending ? (
        <LoadError t={t} error={error} />
      ) : (
        <>
          <DataTable
            columns={ledgerColumns(t)}
            data={rows}
            empty={t("ledger.empty")}
            enablePagination={false}
            enableSorting={false}
            rowHref={(r) => `/blink-cash/ledger/${r.id}`}
          />
          <Pagination base="/blink-cash/ledger" query={rest} page={page} total={total} size={LEDGER_PAGE_SIZE} />
        </>
      )}
    </>
  );
}
