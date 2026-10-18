"use client";

import { HistoryView, type Change } from "@/features/pricing";

export default function PricingHistoryClient({ changes, error }: { changes: Change[]; error?: string }) {
  return <HistoryView changes={changes} error={error} />;
}
