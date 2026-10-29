import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getOverrides, getPricingAccess, getZones } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.tiers");
}

export default async function PricingTiersPage() {
  const { canEdit } = await getPricingAccess();
  const [catalog, overrides, zones] = await Promise.all([getCatalog(), getOverrides({ status: "active" }), getZones()]);
  return (
    <Client
      fees={catalog.data}
      overrides={overrides.data}
      tiers={zones.data.tiers}
      canEdit={canEdit}
      error={catalog.error ?? overrides.error ?? zones.error}
    />
  );
}
