import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getHistory, getOverrides, getPricingAccess, getZones } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.overview");
}

export default async function PricingOverviewPage() {
  const { canEdit } = await getPricingAccess();
  const [catalog, overrides, history, zones] = await Promise.all([getCatalog(), getOverrides({}), getHistory(undefined, 1), getZones()]);
  return (
    <Client
      fees={catalog.data}
      overrides={overrides.data}
      zones={zones.data.zones}
      tiers={zones.data.tiers}
      lastChange={history.data[0] ?? null}
      canEdit={canEdit}
      error={catalog.error}
      nowIso={new Date().toISOString()}
    />
  );
}
