import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getPricingAccess } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.defaults");
}

export default async function PricingDefaultsPage() {
  const { canEdit } = await getPricingAccess();
  const { data, error } = await getCatalog();
  return <Client fees={data} canEdit={canEdit} error={error} />;
}
