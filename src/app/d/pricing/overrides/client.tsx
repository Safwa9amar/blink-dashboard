"use client";

import { OverridesView, type Fee, type Override, type Tier, type Zone } from "@/features/pricing";

export default function PricingOverridesClient(props: {
  overrides: Override[];
  fees: Fee[];
  zones: Zone[];
  tiers: Tier[];
  canEdit: boolean;
  error?: string;
  highlight?: string;
  nowIso: string;
}) {
  return <OverridesView {...props} />;
}
