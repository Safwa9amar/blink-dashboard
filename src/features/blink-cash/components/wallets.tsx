"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, FilterPills, type Column } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { formatDA } from "../data";
import { formatDateTime } from "../lib/format";
import { toQuery, type WalletFilters } from "../lib/filters";
import { available } from "../lib/statement";
import type { WalletRow } from "../ops-types";
import type { TFn } from "../types";
import { LoadError, MigrationNotice, Pagination } from "./ops-shared";

export const WALLETS_PAGE = 25;

export function Wallets({
  rows,
  total,
  filters,
  migrationPending,
  error,
}: {
  rows: WalletRow[];
  total: number;
  filters: WalletFilters;
  migrationPending?: boolean;
  error?: string;
}) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const { page, ...rest } = filters;

  const columns: Column<WalletRow>[] = [
    {
      key: "name",
      label: t("wallets.col_user"),
      render: (r) => (
        <div className="min-w-[140px]">
          <Link href={`/blink-cash/wallets/${r.userId}`} className="font-semibold text-primary hover:underline" dir="auto">
            {r.name ?? r.userId.slice(0, 8)}
          </Link>
          {r.phone && (
            <p className="text-xs text-subtext" dir="ltr">
              {r.phone}
            </p>
          )}
        </div>
      ),
    },
    { key: "balance", label: t("wallet.balance"), render: (r) => <span className="font-mono font-semibold whitespace-nowrap">{formatDA(r.balance)}</span> },
    { key: "held", label: t("wallet.held"), render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{formatDA(r.held)}</span> },
    {
      key: "available",
      label: t("wallet.available"),
      render: (r) => <span className="font-mono whitespace-nowrap">{formatDA(available(r.balance, r.held))}</span>,
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={r.status === "frozen" ? "danger" : "success"}>{t(`wallet.status_${r.status}`)}</Badge>,
    },
    { key: "updatedAt", label: t("wallets.col_activity"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.updatedAt, locale)}</span> },
  ];

  const go = (next: Record<string, string | undefined>) => router.push(`${pathname}?${toQuery({ ...rest, ...next })}`.replace(/\?$/, ""));

  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <FilterPills<string>
        options={[
          ["", t("f.all")],
          ["active", t("wallet.status_active")],
          ["frozen", t("wallet.status_frozen")],
        ]}
        value={filters.status ?? ""}
        onChange={(v) => go({ status: v || undefined, q: filters.q })}
      />
      <form
        className="flex items-end gap-3 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: q.trim() || undefined });
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-text min-w-[220px] flex-1 max-w-xs">
          {t("wallets.q")}
          <input className={fInput} dir="auto" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={t("wallets.search")} />
        </label>
        <Button type="submit">{t("ledger.apply")}</Button>
      </form>
      {error && !migrationPending ? (
        <LoadError t={t} error={error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            empty={t("wallets.empty")}
            enablePagination={false}
            enableSorting={false}
            rowHref={(r) => `/blink-cash/wallets/${r.userId}`}
          />
          <Pagination base="/blink-cash/wallets" query={rest} page={page} total={total} size={WALLETS_PAGE} />
        </>
      )}
    </>
  );
}
