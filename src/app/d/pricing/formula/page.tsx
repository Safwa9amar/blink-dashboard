import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getPricingAccess, getZones } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.formula");
}

export default async function PricingFormulaPage() {
  const { canEdit } = await getPricingAccess();
  const [catalog, zones] = await Promise.all([getCatalog(), getZones()]);
  return <Client fees={catalog.data} zones={zones.data.zones} tiers={zones.data.tiers} canEdit={canEdit} error={catalog.error} />;
}
