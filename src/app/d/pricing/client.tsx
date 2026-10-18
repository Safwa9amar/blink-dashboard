"use client";

import { OverviewView, type Change, type Fee, type Override } from "@/features/pricing";

export default function PricingOverviewClient(props: {
  fees: Fee[];
  overrides: Override[];
  lastChange: Change | null;
  canEdit: boolean;
  error?: string;
  nowIso: string;
}) {
  return <OverviewView {...props} />;
}
