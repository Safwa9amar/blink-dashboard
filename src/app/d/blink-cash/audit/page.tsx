import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Audit } from "@/features/blink-cash";
import { parseAuditFilters, type SearchParams } from "@/features/blink-cash/lib/filters";
import { getAudit } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_audit");
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseAuditFilters(await searchParams);
  const { events, total, migrationPending, error } = await getAudit(filters);
  return <Audit events={events} total={total} filters={filters} migrationPending={migrationPending} error={error} />;
}
