import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { DEMAND_RANGES, type DemandRange } from "@/features/demand";
import { loadDemand } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("demand");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requirePathAccess("/demand");
  const { range: raw } = await searchParams;
  const range = (DEMAND_RANGES as string[]).includes(raw ?? "") ? (raw as DemandRange) : "7d";
  const initial = await loadDemand(range);
  return <Client initial={initial} />;
}
