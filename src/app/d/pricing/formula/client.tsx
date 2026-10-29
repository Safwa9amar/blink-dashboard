"use client";

import { FormulaView, type Fee, type Tier, type Zone } from "@/features/pricing";

export default function PricingFormulaClient(props: { fees: Fee[]; zones: Zone[]; tiers: Tier[]; canEdit: boolean; error?: string }) {
  return <FormulaView {...props} />;
}
