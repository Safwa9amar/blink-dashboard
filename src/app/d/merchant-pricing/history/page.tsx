import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalogRows } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("merchant_pricing", undefined, "tab_history");
}

// History tab — the latest decided items: price suggestions applied (automatically
// within ±20%, or by staff) / rejected by staff, and rejected products (an approved
// product looks like any other live product).
export default async function CatalogHistoryPage() {
  const { rows, total, error } = await getCatalogRows("history");
  return <Client view="history" rows={rows} total={total} error={error} />;
}
