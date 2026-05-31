"use client";

import { useState } from "react";
import Link from "next/link";
import {
  StatGrid,
  StatCard,
  Button,
  SearchBox,
  DataTable,
  Badge,
  FilterPills,
  DashIcon,
  type Column,
} from "@/components/ui";
import { NTYPES, NTYPE_KEYS, NSTATUS, N_ROLE_VARIANT, type Campaign, type TFn } from "../data";
import { useNotificationsStore } from "../store";
import { TypePill } from "./type-pill";
import { ChanIcons } from "./chan-icons";

export function Campaigns({ t, onNew }: { t: TFn; onNew: () => void }) {
  const [tf, setTf] = useState("all");
  const [q, setQ] = useState("");
  const campaigns = useNotificationsStore((s) => s.campaigns);
  const deleteCampaign = useNotificationsStore((s) => s.deleteCampaign);

  const sentCount = campaigns.filter((c) => c.status === "sent").length;
  const scheduledCount = campaigns.filter((c) => c.status === "scheduled").length;

  const columns: Column<Campaign>[] = [
    {
      key: "title",
      label: t("col.campaign"),
      render: (r) => (
        <Link href={`/notifications/${r.id}`} className="font-semibold text-text hover:text-primary transition-colors">
          {r.title}
        </Link>
      ),
    },
    { key: "type", label: t("col.type"), render: (r) => <TypePill type={r.type} /> },
    { key: "chans", label: t("col.channels"), render: (r) => <ChanIcons chans={r.chans} /> },
    { key: "audience", label: t("col.audience"), render: (r) => <Badge variant={N_ROLE_VARIANT[r.audience]}>{r.audience}</Badge> },
    { key: "reach", label: t("col.reach"), render: (r) => <span className="font-mono">{r.reach ? r.reach.toLocaleString() : "—"}</span> },
    { key: "opens", label: t("col.open_rate"), render: (r) => <span className="text-subtext">{r.opens}</span> },
    { key: "status", label: t("col.status"), render: (r) => <Badge variant={NSTATUS[r.status]}>{r.status}</Badge> },
    { key: "date", label: t("col.when"), tdClass: "text-subtext" },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            if (confirm(t("confirm_delete_campaign"))) deleteCampaign(r.id);
          }}
          aria-label={t("delete")}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
        >
          <DashIcon name="trash" className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const rows = campaigns
    .filter((c) => (tf === "all" ? true : c.type === tf))
    .filter((c) => (q ? c.title.toLowerCase().includes(q.toLowerCase()) : true));

  const filterOptions: [string, string, string?][] = [
    ["all", t("all")],
    ...NTYPE_KEYS.map((k) => [k, NTYPES[k].label, NTYPES[k].icon] as [string, string, string]),
  ];

  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("stats.sent")} value={sentCount} variant="primary" icon="bell" change={t("stats.sent_chg")} />
        <StatCard label={t("stats.scheduled")} value={scheduledCount} variant="info" icon="calendar2" change={t("stats.scheduled_chg")} />
        <StatCard label={t("stats.open")} value="44%" variant="success" icon="trending" change={t("stats.open_chg")} />
        <StatCard label={t("stats.optout")} value="1.2%" variant="warning" icon="activity" change={t("stats.optout_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search_campaigns")} value={q} onChange={setQ} />
        <Button icon="send" onClick={onNew} className="ms-auto">
          {t("new_notification")}
        </Button>
      </div>
      <FilterPills options={filterOptions} value={tf} onChange={setTf} />
      <DataTable columns={columns} data={rows} empty={t("empty")} />
    </>
  );
}
