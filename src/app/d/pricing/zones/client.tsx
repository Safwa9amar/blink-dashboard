"use client";

import { ZonesView, type Fee, type Tier, type Zone } from "@/features/pricing";

export default function PricingZonesClient(props: {
  zones: Zone[];
  tiers: Tier[];
  unzonedTier: string;
  fees: Fee[];
  canEdit: boolean;
  error?: string;
}) {
  return <ZonesView {...props} />;
}
