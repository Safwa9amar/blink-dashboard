import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { ReconciliationView } from "@/features/blink-cash";
import { getStaffActor } from "@/lib/auth/staff";
import { getReconciliation } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "recon.title");
}

// Reconciliation — ledger balance vs the derived balance per wallet (blink-server computes it).
export default async function Page() {
  const { data, notDeployed, error } = await getReconciliation();
  const actor = await getStaffActor("/blink-cash");
  return <ReconciliationView data={data} notDeployed={notDeployed} error={error} isSuper={actor?.role === "super_admin"} />;
}
