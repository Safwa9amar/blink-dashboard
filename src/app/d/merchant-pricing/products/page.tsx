import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalogRows } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("merchant_pricing", undefined, "tab_products");
}

// New products tab — products a merchant created by hand (not from the Blink
// library) stay hidden from customers until approved here. Oldest first.
export default async function NewProductsPage() {
  const { rows, total, error } = await getCatalogRows("products");
  return <Client view="products" rows={rows} total={total} error={error} />;
}
