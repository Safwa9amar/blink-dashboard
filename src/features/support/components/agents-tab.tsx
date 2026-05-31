"use client";

import { useState } from "react";
import { StatGrid, StatCard, Card, DataTable, Badge, NameCell, Toggle, DashIcon, type Column } from "@/components/ui";
import { AGENTS, type Agent } from "../data";
import type { TFn } from "../types";

const DOT: Record<string, string> = { online: "#22C55E", away: "#FAAD14", offline: "#9BA1A6" };

export function AgentsTab({ t }: { t: TFn }) {
  const [available, setAvailable] = useState(true);

  const columns: Column<Agent>[] = [
    { key: "name", label: t("agt.agent"), render: (r) => <NameCell name={r.name} /> },
    { key: "team", label: t("agt.team"), render: (r) => <Badge variant="default">{r.team}</Badge> },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold capitalize" style={{ color: DOT[r.status] }}>
          <span className="w-2 h-2 rounded-full" style={{ background: DOT[r.status] }} />
          {t(`agt.st_${r.status}`)}
        </span>
      ),
    },
    {
      key: "load",
      label: t("agt.load"),
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="w-16 h-1.5 rounded-full bg-muted overflow-hidden inline-block">
            <span
              className="h-full rounded-full inline-block"
              style={{ width: `${(r.load / r.cap) * 100}%`, background: r.load >= r.cap ? "#EF4444" : "#EE335F" }}
            />
          </span>
          <span className="text-[12px] text-subtext tabular-nums">{r.load}/{r.cap}</span>
        </span>
      ),
    },
    {
      key: "csat",
      label: t("agt.csat"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-semibold text-text">
          <DashIcon name="star" className="w-3.5 h-3.5 text-warning" />
          {r.csat.toFixed(1)}
        </span>
      ),
    },
    { key: "frt", label: t("agt.frt"), tdClass: "text-subtext tabular-nums" },
    { key: "resolved", label: t("agt.resolved"), render: (r) => <span className="font-mono text-text">{r.resolved}</span> },
  ];

  const online = AGENTS.filter((a) => a.status === "online").length;

  return (
    <>
      <Card className="mb-5 flex items-center gap-3.5" bodyClassName="">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: available ? "#22C55E" : "#9BA1A6" }} />
        <div className="flex-1">
          <b className="block text-sm font-bold text-text">{t("agt.you_label")}</b>
          <span className="text-[12.5px] text-subtext">{t(available ? "agt.you_on" : "agt.you_off")}</span>
        </div>
        <Toggle on={available} onClick={() => setAvailable((v) => !v)} />
      </Card>

      <StatGrid cols={4}>
        <StatCard label={t("agt.online")} value={online} variant="success" icon="users" change={t("agt.online_chg")} />
        <StatCard label={t("agt.queue_load")} value="68%" variant="warning" icon="activity" change={t("agt.queue_load_chg")} />
        <StatCard label={t("agt.team_csat")} value="4.5" variant="primary" icon="star" change={t("agt.team_csat_chg")} />
        <StatCard label={t("agt.avg_frt")} value="2.2m" variant="info" icon="clock" change={t("agt.avg_frt_chg")} />
      </StatGrid>

      <DataTable columns={columns} data={AGENTS} keyField="name" empty={t("agt.empty")} />
    </>
  );
}
