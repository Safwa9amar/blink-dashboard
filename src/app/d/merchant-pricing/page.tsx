import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalogRows } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("merchant_pricing", undefined, "tab_prices");
}

// Price suggestions tab — suggestions outside the ±20% tolerance wait here,
// oldest first so nobody waits longest.
export default async function PriceSuggestionsPage() {
  const { rows, total, error } = await getCatalogRows("prices");
  return <Client view="prices" rows={rows} total={total} error={error} />;
}
