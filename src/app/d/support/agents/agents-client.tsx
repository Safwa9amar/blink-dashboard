"use client";

import { useTranslations } from "next-intl";
import { AgentsTab } from "@/features/support/components/agents-tab";
import type { AgentRow } from "@/features/support/csat-agents";

export default function AgentsClient({
  agents,
  generatedAt,
  migrationPending,
}: {
  agents: AgentRow[];
  generatedAt: string;
  migrationPending: boolean;
}) {
  const t = useTranslations("support");
  return <AgentsTab t={t} agents={agents} generatedAt={generatedAt} migrationPending={migrationPending} />;
}
