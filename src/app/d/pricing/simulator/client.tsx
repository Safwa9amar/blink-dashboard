"use client";

import { SimulatorView, type SimScenario, type Tier, type Zone } from "@/features/pricing";

export default function PricingSimulatorClient({ scenario, zones, tiers }: { scenario?: SimScenario; zones: Zone[]; tiers: Tier[] }) {
  return <SimulatorView initialScenario={scenario} zones={zones} tiers={tiers} />;
}
