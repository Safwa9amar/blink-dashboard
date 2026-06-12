import { createAdminClient } from "@/lib/supabase/admin";
import AgentsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("agents");
}

// Module-scope so the "last N days" cutoff isn't an impure call inside the
// server component's render (react-hooks/purity).
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AgentsPage() {
  // Service-role client to read every agent row past `users` RLS
  // (users_select_own). Page is staff-gated by d/layout. Same pattern as /customers.
  const supabase = await createAdminClient();

  // An agent = persona `role='agent'` AND no console authority
  // (`staff_role IS NULL`). Display ID ("BK-AG-…") comes from agent_profiles.
  const agents = () =>
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "agent").is("staff_role", null);

  const [list, totalRes, newRes, maleRes, femaleRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, phone_number, gender, wilaya, created_at, agent_profiles(agent_id)"
      )
      .eq("role", "agent")
      .is("staff_role", null)
      .order("created_at", { ascending: false })
      .limit(50),
    agents(),
    agents().gte("created_at", daysAgoISO(30)),
    agents().eq("gender", "male"),
    agents().eq("gender", "female"),
  ]);

  return (
    <AgentsClient
      agents={list.data}
      error={list.error?.message}
      total={totalRes.count ?? 0}
      newCount={newRes.count ?? 0}
      male={maleRes.count ?? 0}
      female={femaleRes.count ?? 0}
    />
  );
}
