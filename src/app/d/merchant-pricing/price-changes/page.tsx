import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { parseFilters } from "@/features/merchant-pricing";
import { getPriceChanges, getStoreOptions } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("merchant_pricing", undefined, "tab_changes");
}

// Price changes tab — every recorded product price change (blink-server), filtered
// and paged server-side from the URL (?store &source &from &to &page).
export default async function PriceChangesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const [{ data, error }, stores] = await Promise.all([getPriceChanges(filters), getStoreOptions()]);
  return <Client data={data} error={error} filters={filters} stores={stores} />;
}
