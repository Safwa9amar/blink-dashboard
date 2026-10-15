import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getAgentDues } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "agent_float");
}

// Agents tab — what each agent owes Blink in cash, from blink-server.
export default async function Page() {
  const { summary, error } = await getAgentDues();
  return <Client tab="agents" agents={summary} agentsError={error} />;
}
