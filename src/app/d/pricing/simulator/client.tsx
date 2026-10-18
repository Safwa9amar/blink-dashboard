"use client";

import { SimulatorView, type SimScenario } from "@/features/pricing";

export default function PricingSimulatorClient({ scenario }: { scenario?: SimScenario }) {
  return <SimulatorView initialScenario={scenario} />;
}
