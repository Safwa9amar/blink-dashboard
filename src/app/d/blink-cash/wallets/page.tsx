import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Wallets } from "@/features/blink-cash";
import { parseWalletFilters, type SearchParams } from "@/features/blink-cash/lib/filters";
import { getWalletsPage } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_wallets");
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseWalletFilters(await searchParams);
  const { rows, total, migrationPending, error } = await getWalletsPage(filters);
  return <Wallets rows={rows} total={total} filters={filters} migrationPending={migrationPending} error={error} />;
}
