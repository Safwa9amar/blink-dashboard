"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { ScheduledNotification } from "../types";
import { useNotificationsStore } from "../store";
import { cancelScheduled } from "@/app/d/notifications/action";
import { TypePill } from "./type-pill";
import { ChanIcons } from "./chan-icons";
import { EditScheduled } from "./edit-scheduled";

// A unified table row — either a real queued broadcast (kind "scheduled", from
// the scheduled_notifications DB table) or a local campaign record (kind
// "local", from the Zustand store: sent history & drafts).
interface Row {
  id: string;
  kind: "scheduled" | "local";
  title: string;
  type: string;
  chans: string[];
  audience: string;
  reach: number;
  opens: string;
  status: string; // key into NSTATUS (badge variant)
  statusLabel: string; // text shown
  date: string;
  scheduledId?: string; // present on pending rows that can be canceled
  sched?: ScheduledNotification; // original queue row (for the edit modal)
}

// pending → "scheduled" reads friendlier; the rest map 1:1.
const SCHED_STATUS_LABEL: Record<string, string> = {
  pending: "scheduled",
  sending: "sending",
  sent: "sent",
  failed: "failed",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function Campaigns({
  t,
  onNew,
  scheduled = [],
}: {
  t: TFn;
  onNew: () => void;
  scheduled?: ScheduledNotification[];
}) {
  const router = useRouter();
  const [tf, setTf] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ScheduledNotification | null>(null);
  const campaigns = useNotificationsStore((s) => s.campaigns);
  const deleteCampaign = useNotificationsStore((s) => s.deleteCampaign);

  // Real queue rows first; the local store keeps sent history + drafts (its mock
  // "scheduled" seed is dropped — scheduling is DB-backed now).
  const scheduledRows: Row[] = scheduled.map((s) => ({
    id: `sched:${s.id}`,
    kind: "scheduled",
    title: s.title,
    type: s.type,
    chans: s.channels,
    audience: s.audience,
    reach: s.recipients,
    opens: "—",
    status: s.status,
    statusLabel: SCHED_STATUS_LABEL[s.status] ?? s.status,
    date: formatWhen(s.scheduledAt),
    scheduledId: s.status === "pending" ? s.id : undefined,
    sched: s,
  }));

  const localRows: Row[] = campaigns
    .filter((c) => c.status !== "scheduled")
    .map((c: Campaign) => ({
      id: c.id,
      kind: "local",
      title: c.title,
      type: c.type,
      chans: c.chans,
      audience: c.audience,
      reach: c.reach,
      opens: c.opens,
      status: c.status,
      statusLabel: c.status,
      date: c.date,
    }));

  const sentCount = campaigns.filter((c) => c.status === "sent").length;
  const scheduledCount = scheduled.filter(
    (s) => s.status === "pending" || s.status === "sending"
  ).length;

  const onCancel = async (id: string) => {
    if (!confirm(t("confirm_cancel_scheduled"))) return;
    const res = await cancelScheduled(id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "title",
      label: t("col.campaign"),
      render: (r) =>
        r.kind === "local" ? (
          <Link
            href={`/notifications/${r.id}`}
            className="font-semibold text-text hover:text-primary transition-colors"
          >
            {r.title}
          </Link>
        ) : (
          <span className="font-semibold text-text">{r.title}</span>
        ),
    },
    { key: "type", label: t("col.type"), render: (r) => <TypePill type={r.type} /> },
    { key: "chans", label: t("col.channels"), render: (r) => <ChanIcons chans={r.chans} /> },
    {
      key: "audience",
      label: t("col.audience"),
      render: (r) => <Badge variant={N_ROLE_VARIANT[r.audience] ?? "default"}>{r.audience}</Badge>,
    },
    {
      key: "reach",
      label: t("col.reach"),
      render: (r) => <span className="font-mono">{r.reach ? r.reach.toLocaleString() : "—"}</span>,
    },
    { key: "opens", label: t("col.open_rate"), render: (r) => <span className="text-subtext">{r.opens}</span> },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={NSTATUS[r.status] ?? "default"}>{r.statusLabel}</Badge>,
    },
    { key: "date", label: t("col.when"), tdClass: "text-subtext" },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (r) =>
        r.kind === "scheduled" ? (
          r.scheduledId && r.sched ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(r.sched!)}
                aria-label={t("edit")}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-primary hover:bg-soft-pink transition-colors cursor-pointer"
              >
                <DashIcon name="pencil" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onCancel(r.scheduledId!)}
                aria-label={t("cancel")}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
              >
                <DashIcon name="x" className="w-4 h-4" />
              </button>
            </div>
          ) : null
        ) : (
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

  const rows = [...scheduledRows, ...localRows]
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
      {editing && (
        <EditScheduled
          t={t}
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
