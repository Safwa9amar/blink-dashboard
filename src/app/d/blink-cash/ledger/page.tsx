import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Ledger } from "@/features/blink-cash";
import { parseLedgerFilters, type SearchParams } from "@/features/blink-cash/lib/filters";
import { getLedgerPage } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_ledger");
}

// Ledger — filters live in the URL and the server pages the rows (25 per page).
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseLedgerFilters(await searchParams);
  const { rows, total, migrationPending, error } = await getLedgerPage(filters);
  return <Ledger rows={rows} total={total} filters={filters} migrationPending={migrationPending} error={error} />;
}
