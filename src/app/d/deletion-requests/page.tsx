import { createAdminClient } from "@/lib/supabase/admin";
import DeletionRequestsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { DELETION_REQUEST_SELECT } from "@/features/deletion-requests";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("deletion_requests", undefined, "tab_requests");
}

// Requests tab — the pending queue, oldest first so nobody waits longest.
export default async function DeletionRequestsPage() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select(DELETION_REQUEST_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);

  return <DeletionRequestsClient view="requests" requests={data} error={error?.message} />;
}
