import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { agentRows } from "@/features/support/csat-agents";
import { loadDesk } from "../desk-data";
import AgentsClient from "./agents-client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "tab_agents");
}

export default async function Page() {
  const desk = await loadDesk({ days: 30 });
  const agents = agentRows(desk.staff, desk.conversations, desk.cases, desk.lastAgentMessageAt, new Date(desk.generatedAt));
  return <AgentsClient agents={agents} generatedAt={desk.generatedAt} migrationPending={desk.migrationPending} />;
}
