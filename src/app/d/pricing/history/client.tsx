"use client";

import { HistoryView, type Change } from "@/features/pricing";

export default function PricingHistoryClient({ changes, error, limit }: { changes: Change[]; error?: string; limit: number }) {
  return <HistoryView changes={changes} error={error} limit={limit} />;
}
