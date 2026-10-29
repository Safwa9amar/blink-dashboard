import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getPricingAccess, getZones } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.zones");
}

export default async function PricingZonesPage() {
  const { canEdit } = await getPricingAccess();
  const [zones, catalog] = await Promise.all([getZones(), getCatalog()]);
  return (
    <Client
      zones={zones.data.zones}
      tiers={zones.data.tiers}
      unzonedTier={zones.data.unzoned_tier}
      fees={catalog.data}
      canEdit={canEdit}
      error={zones.error ?? catalog.error}
    />
  );
}
