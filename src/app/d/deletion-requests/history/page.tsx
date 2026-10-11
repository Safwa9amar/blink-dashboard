import { createAdminClient } from "@/lib/supabase/admin";
import DeletionRequestsClient from "../client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { DELETION_REQUEST_SELECT } from "@/features/deletion-requests";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("deletion_requests", undefined, "tab_history");
}

// History tab — every processed request (deleted accounts + cancelled requests),
// most recent first. Deleted users show from their saved snapshot.
export default async function DeletionHistoryPage() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select(DELETION_REQUEST_SELECT)
    .in("status", ["completed", "cancelled"])
    .order("processed_at", { ascending: false })
    .limit(500);

  return <DeletionRequestsClient view="history" requests={data} error={error?.message} />;
}
