"use client";

import { useState } from "react";
import { StatGrid, StatCard, Toolbar, FilterPills, DataTable, Badge, NameCell, Button, type Column } from "@/components/ui";
import { TICKETS, PRIO, TK_STATUS, supLbl, type Ticket } from "../data";
import type { TFn } from "../types";
import { TicketDetail } from "./ticket-detail";

export function TicketsTab({ t }: { t: TFn }) {
  const [open, setOpen] = useState<Ticket | null>(null);
  const [queue, setQueue] = useState("all");

  if (open) return <TicketDetail ticket={open} t={t} onBack={() => setOpen(null)} />;

  const rows = queue === "all" ? TICKETS : TICKETS.filter((r) => r.status === queue);

  const columns: Column<Ticket>[] = [
    { key: "id", label: t("col.ticket"), render: (r) => <span className="font-mono text-primary font-semibold">{r.id}</span> },
    { key: "subj", label: t("col.subject"), render: (r) => <span className="font-semibold text-text">{r.subj}</span> },
    { key: "who", label: t("col.reporter"), render: (r) => <NameCell name={r.who} /> },
    { key: "cat", label: t("col.category"), tdClass: "text-subtext" },
    {
      key: "prio",
      label: t("col.priority"),
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-[13px] capitalize" style={{ color: PRIO[r.prio] }}>
          <span className="w-2 h-2 rounded-full" style={{ background: PRIO[r.prio] }} />
          {r.prio}
        </span>
      ),
    },
    { key: "status", label: t("col.status"), render: (r) => <Badge variant={TK_STATUS[r.status]}>{supLbl(r.status)}</Badge> },
    { key: "age", label: t("col.age"), render: (r) => <span className="text-subtext">{r.age}</span> },
    {
      key: "open",
      label: "",
      sortable: false,
      render: (r) => (
        <Button variant="secondary" size="xs" icon="chevron-right" onClick={() => setOpen(r)}>
          {t("det.open")}
        </Button>
      ),
    },
  ];

  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("t.open")} value={42} variant="danger" icon="support" change={t("t.open_chg")} />
        <StatCard label={t("t.progress")} value={18} variant="warning" icon="clock" change={t("t.progress_chg")} />
        <StatCard label={t("t.resolved")} value={67} variant="success" icon="trending" change={t("t.resolved_chg")} />
        <StatCard label={t("t.csat")} value="4.6" variant="primary" icon="star" change={t("t.csat_chg")} />
      </StatGrid>
      <FilterPills
        options={[
          ["all", t("t.all"), "support"],
          ["open", t("t.open"), "warn"],
          ["in_progress", t("t.progress"), "clock"],
          ["resolved", t("t.resolved"), "shield"],
        ]}
        value={queue}
        onChange={setQueue}
      />
      <Toolbar placeholder={t("t.search")} showExport />
      <DataTable columns={columns} data={rows} empty={t("tickets_empty")} />
    </>
  );
}
