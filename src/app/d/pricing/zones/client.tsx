"use client";

import { ZonesView, type Fee, type Override, type Tier, type Zone } from "@/features/pricing";

export default function PricingZonesClient(props: {
  zones: Zone[];
  tiers: Tier[];
  unzonedTier: string;
  fees: Fee[];
  overrides: Override[];
  canEdit: boolean;
  error?: string;
}) {
  return <ZonesView {...props} />;
}
