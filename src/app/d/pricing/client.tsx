"use client";

import { OverviewView, type Change, type Fee, type Override, type Tier, type Zone } from "@/features/pricing";

export default function PricingOverviewClient(props: {
  fees: Fee[];
  overrides: Override[];
  zones: Zone[];
  tiers: Tier[];
  lastChange: Change | null;
  canEdit: boolean;
  error?: string;
  nowIso: string;
}) {
  return <OverviewView {...props} />;
}
