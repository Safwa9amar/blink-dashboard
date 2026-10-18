"use client";

import { DefaultsBoard, type Fee } from "@/features/pricing";

export default function PricingDefaultsClient({ fees, canEdit, error }: { fees: Fee[]; canEdit: boolean; error?: string }) {
  return <DefaultsBoard fees={fees} canEdit={canEdit} error={error} />;
}
