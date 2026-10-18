import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getHistory, getOverrides, getPricingAccess } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.overview");
}

export default async function PricingOverviewPage() {
  const { canEdit } = await getPricingAccess();
  const [catalog, overrides, history] = await Promise.all([getCatalog(), getOverrides({}), getHistory(undefined, 1)]);
  return (
    <Client
      fees={catalog.data}
      overrides={overrides.data}
      lastChange={history.data[0] ?? null}
      canEdit={canEdit}
      error={catalog.error}
      nowIso={new Date().toISOString()}
    />
  );
}
