"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader, StatGrid, StatCard, DataTable, SearchBox, Badge, type Column } from "@/components/ui";
import {
  EditAgentButton,
  DeleteAgentButton,
  AgentDetailButton,
  matchesAgent,
  SHOP_REVIEW_VARIANT,
  type Agent,
} from "@/features/agents";

export default function AgentsClient({
  agents,
  error,
  total,
  newCount,
  male,
  female,
}: {
  agents: Agent[];
  error?: string;
  total: number;
  newCount: number;
  male: number;
  female: number;
}) {
  const t = useTranslations("agents");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => agents.filter((a) => matchesAgent(a, query)), [agents, query]);

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
    { key: "phone_number", label: t("phone"), render: (a) => <span dir="ltr">{a.phone_number || "—"}</span> },
    {
      key: "shop",
      label: t("shop"),
      sortable: false,
      render: (a) => {
        const shop = a.shops[0];
        if (!shop) return <span className="text-subtext">{t("no_shop")}</span>;
        return (
          <span className="flex flex-col">
            <span className="font-medium text-text">
              {shop.name || "—"}
              {a.shops.length > 1 && <span className="text-subtext font-normal">{` +${a.shops.length - 1}`}</span>}
            </span>
            <span className="text-xs text-subtext max-w-[220px] truncate">
              {[a.wilaya, shop.address].filter(Boolean).join(" · ") || "—"}
            </span>
          </span>
        );
      },
    },
    {
      key: "shop_review",
      label: t("shop_review_status"),
      sortable: false,
      render: (a) => {
        const shop = a.shops[0];
        return shop ? (
          <Badge variant={SHOP_REVIEW_VARIANT[shop.review]}>{t(`shop_review.${shop.review}`)}</Badge>
        ) : (
          <span className="text-subtext">—</span>
        );
      },
    },
    { key: "wilaya", label: t("wilaya"), render: (a) => a.wilaya || "—" },
    {
      key: "created_at",
      label: t("joined"),
      render: (a) => (
        <span className="text-subtext">{new Date(a.created_at).toLocaleDateString(locale)}</span>
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
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/agents/verification" className="text-[13px] font-semibold text-primary hover:underline">
            {t("review")}
          </Link>
        }
      />

      <StatGrid cols={4}>
        <StatCard label={t("total")} value={total} icon="store" variant="primary" />
        <StatCard label={t("new_30d")} value={newCount} icon="trending" variant="info" />
        <StatCard label={t("male")} value={male} icon="activity" variant="success" />
        <StatCard label={t("female")} value={female} icon="activity" variant="warning" />
      </StatGrid>

      <div className="mb-4">
        <SearchBox placeholder={t("search")} value={query} onChange={setQuery} />
      </div>
      <DataTable columns={columns} data={rows} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
