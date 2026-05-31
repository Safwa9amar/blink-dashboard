import { createClient } from "@/lib/supabase/server";
import AgentShopsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("agent_shops");
}

export default async function AgentShopsPage() {
  const supabase = await createClient();

  const { data: shops, error } = await supabase
    .from("agent_shops")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <AgentShopsClient shops={shops} error={error?.message} />;
}
