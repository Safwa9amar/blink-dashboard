import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCatalog, getOverrides, getPricingAccess } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.overrides");
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function PricingOverridesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { canEdit } = await getPricingAccess();
  const [catalog, list] = await Promise.all([
    getCatalog(),
    getOverrides({
      key: one(sp.key),
      status: one(sp.status),
      wilaya_code: one(sp.wilaya_code),
      merchant_id: one(sp.merchant_id),
      agent_id: one(sp.agent_id),
    }),
  ]);
  return (
    <Client
      overrides={list.data}
      fees={catalog.data}
      canEdit={canEdit}
      error={list.error ?? catalog.error}
      highlight={one(sp.highlight)}
    />
  );
}
