import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import type { SimScenario } from "@/features/pricing";
import { getPricingAccess } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.simulator");
}

const SCENARIOS: SimScenario[] = ["store", "courier", "ride", "deposit", "withdrawal"];

export default async function PricingSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await getPricingAccess();
  const { scenario } = await searchParams;
  const s = SCENARIOS.find((x) => x === scenario);
  return <Client scenario={s} />;
}
