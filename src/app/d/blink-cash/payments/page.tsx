import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { GatewayPayments } from "@/features/blink-cash/components/gateway-payments";
import { parseGatewayFilters, type SearchParams } from "@/features/blink-cash/lib/filters";
import { getGatewayPayments, getPaymentProviders } from "../data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_payments");
}

// Payments tab — online gateways (provider status) and every gateway payment, filtered in the URL.
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseGatewayFilters(await searchParams);
  const [{ payments, total, error }, { providers, error: providersError }] = await Promise.all([
    getGatewayPayments(filters),
    getPaymentProviders(),
  ]);
  return (
    <GatewayPayments
      providers={providers}
      providersError={providersError}
      payments={payments}
      total={total}
      filters={filters}
      error={error}
    />
  );
}
