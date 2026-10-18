"use client";

import { OverridesView, type Fee, type Override } from "@/features/pricing";

export default function PricingOverridesClient(props: {
  overrides: Override[];
  fees: Fee[];
  canEdit: boolean;
  error?: string;
  highlight?: string;
}) {
  return <OverridesView {...props} />;
}
