import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ManagedDeepLink } from "@/features/deep-links";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("deep_links");
}

// Managed deep links are broadcast content (no per-user owner), so they're read
// with the service-role admin client — the console sees inactive links too, while
// the `deep_links_select_active` RLS keeps the app scoped to active ones.
export default async function DeepLinksPage() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("deep_links")
    .select("*")
    .order("created_at", { ascending: false });

  return <Client links={(data as ManagedDeepLink[] | null) ?? []} error={error?.message ?? null} />;
}
