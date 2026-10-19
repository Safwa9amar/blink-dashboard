import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getAgentDues } from "../data";
import { getAgentLimits, getSettings } from "../ops-data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "agent_float");
}

// Agents tab — what each agent owes Blink in cash (blink-server), with each agent's cash limit
// (agent_profiles.credit_limit, falling back to the settings default) and its capacity.
export default async function Page() {
  const [{ summary, error }, lim, { settings }] = await Promise.all([getAgentDues(), getAgentLimits(), getSettings()]);
  const agents = summary
    ? { ...summary, agents: summary.agents.map((a) => ({ ...a, creditLimit: a.id in lim.limits ? lim.limits[a.id] : (a.creditLimit ?? null) })) }
    : null;
  return (
    <Client
      tab="agents"
      agents={agents}
      agentsError={error}
      agentDefaultLimit={lim.defaultLimit}
      limitsPending={lim.migrationPending}
      methods={settings?.dues_payment_methods}
    />
  );
}
