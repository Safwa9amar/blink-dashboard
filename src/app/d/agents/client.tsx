"use client";

import { useTranslations } from "next-intl";
import { PageHeader, StatGrid, StatCard, DataTable, type Column } from "@/components/ui";
import {
  EditAgentButton,
  DeleteAgentButton,
  AgentDetailButton,
  type Agent,
} from "@/features/agents";

// agent_profiles is embedded as a to-one (unique user_id) but PostgREST can
// surface it as a single-element array — normalise both to the display ID.
function displayId(row: Record<string, unknown>): string | null {
  const profile = row.agent_profiles as
    | { agent_id?: string | null }
    | { agent_id?: string | null }[]
    | null
    | undefined;
  if (!profile) return null;
  const one = Array.isArray(profile) ? profile[0] : profile;
  return one?.agent_id ?? null;
}

export default function AgentsClient({
  agents,
  error,
  total,
  newCount,
  male,
  female,
}: {
  agents: Record<string, unknown>[] | null;
  error?: string;
  total: number;
  newCount: number;
  male: number;
  female: number;
}) {
  const t = useTranslations("agents");

  const rows: Agent[] = (agents ?? []).map((row) => ({
    id: row.id as string,
    agent_id: displayId(row),
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone_number: row.phone_number as string | null,
    gender: row.gender as string | null,
    wilaya: row.wilaya as string | null,
    created_at: row.created_at as string,
  }));

  const columns: Column<Agent>[] = [
    {
      key: "agent_id",
      label: t("agent_id"),
      render: (a) =>
        a.agent_id ? (
          <span className="font-mono text-primary font-medium">{a.agent_id}</span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "name",
      label: t("name"),
      render: (a) => (
        <span className="font-medium text-text">
          {[a.first_name, a.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: t("phone"), render: (a) => a.phone_number || "—" },
    {
      key: "email",
      label: t("email"),
      render: (a) => <span className="text-subtext">{a.email || "—"}</span>,
    },
    { key: "wilaya", label: t("wilaya"), render: (a) => a.wilaya || "—" },
    {
      key: "gender",
      label: t("gender"),
      render: (a) => <span className="capitalize">{a.gender || "—"}</span>,
    },
    {
      key: "created_at",
      label: t("joined"),
      render: (a) => (
        <span className="text-subtext">{new Date(a.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (a) => (
        <div className="flex items-center gap-1">
          <AgentDetailButton agent={a} />
          <EditAgentButton agent={a} />
          <DeleteAgentButton agentId={a.id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("total")} value={total} icon="store" variant="primary" />
        <StatCard label={t("new_30d")} value={newCount} icon="trending" variant="info" />
        <StatCard label={t("male")} value={male} icon="activity" variant="success" />
        <StatCard label={t("female")} value={female} icon="activity" variant="warning" />
      </StatGrid>

      <DataTable columns={columns} data={rows} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
