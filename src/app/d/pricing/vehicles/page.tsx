import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPricingAccess, getVehicleClasses } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.vehicles");
}

export default async function PricingVehiclesPage() {
  const { canEdit } = await getPricingAccess();
  const classes = await getVehicleClasses();
  return <Client classes={classes.data} canEdit={canEdit} error={classes.error} />;
}
