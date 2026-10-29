"use client";

import { TiersView, type Fee, type Override, type Tier } from "@/features/pricing";

export default function PricingTiersClient(props: {
  fees: Fee[];
  overrides: Override[];
  tiers: Tier[];
  canEdit: boolean;
  highlightTier?: string;
  error?: string;
}) {
  return <TiersView {...props} />;
}
