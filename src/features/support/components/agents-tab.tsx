"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Card, DataTable, Badge, NameCell, DashIcon, EmptyState, StatCard, type Column } from "@/components/ui";
import { formatDay } from "@/features/promotions";
import { formatMinutes } from "../metrics";
import { isOnline, type AgentRow } from "../csat-agents";
import type { TFn } from "../types";

const DOT = { online: "#22C55E", offline: "#9BA1A6" } as const;

export function AgentsTab({
  t,
  agents,
  generatedAt,
  migrationPending = false,
}: {
  t: TFn;
  agents: AgentRow[];
  /** Server read time; the initial render uses it so SSR and hydration agree. */
  generatedAt: string;
  migrationPending?: boolean;
}) {
  const locale = useLocale();
  // Relative "last active" times depend on the clock, so they only appear after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  const clock = now ?? new Date(generatedAt).getTime();
  const units = { m: t("agt.u_m"), h: t("agt.u_h"), d: t("agt.u_d") };

  const lastActive = (iso: string | null) => {
    if (!iso) return t("agt.never");
    if (now == null) return formatDay(iso, locale);
    const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (mins < 60) return rtf.format(-mins, "minute");
    if (mins < 60 * 24) return rtf.format(-Math.round(mins / 60), "hour");
    return rtf.format(-Math.round(mins / 1440), "day");
  };

  const columns: Column<AgentRow>[] = [
    { key: "name", label: t("agt.agent"), render: (r) => <NameCell name={r.name} /> },
    {
      key: "staffRole",
      label: t("agt.role"),
      render: (r) => <Badge variant="default">{t(`agt.role_${r.staffRole}`)}</Badge>,
    },
    {
      key: "status",
      label: t("col.status"),
      sortable: false,
      render: (r) => {
        const on = isOnline(r.lastActiveAt, clock);
        return (
          <span className="inline-flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: DOT[on ? "online" : "offline"] }}>
              <span className="w-2 h-2 rounded-full" style={{ background: DOT[on ? "online" : "offline"] }} />
              {t(on ? "agt.st_online" : "agt.st_offline")}
            </span>
            {!on && <span className="text-[11.5px] text-subtext">{t("agt.last_active", { when: lastActive(r.lastActiveAt) })}</span>}
          </span>
        );
      },
    },
    { key: "openAssigned", label: t("agt.open"), render: (r) => <span className="font-mono text-text">{r.openAssigned}</span> },
    {
      key: "resolved30",
      label: t("agt.resolved"),
      render: (r) => (
        <span className="font-mono text-text">
          {r.resolved7} <span className="text-subtext">/ {r.resolved30}</span>
        </span>
      ),
    },
    {
      key: "medianFirstResponse",
      label: t("agt.frt"),
      render: (r) => <span className="text-subtext tabular-nums">{r.medianFirstResponse != null ? formatMinutes(r.medianFirstResponse, units) : "—"}</span>,
    },
    {
      key: "csatAvg",
      label: t("agt.csat"),
      render: (r) =>
        r.csatAvg != null ? (
          <span className="inline-flex items-center gap-1 font-semibold text-text">
            <DashIcon name="star" className="w-3.5 h-3.5 text-warning" />
            {r.csatAvg.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
            <span className="text-[11px] text-subtext font-normal">({r.csatCount})</span>
          </span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
  ];

  const online = agents.filter((a) => isOnline(a.lastActiveAt, clock)).length;
  const open = agents.reduce((s, a) => s + a.openAssigned, 0);
  const res7 = agents.reduce((s, a) => s + a.resolved7, 0);
  const rated = agents.filter((a) => a.csatAvg != null);
  const ratedN = rated.reduce((s, a) => s + a.csatCount, 0);
  const teamCsat = ratedN ? rated.reduce((s, a) => s + (a.csatAvg as number) * a.csatCount, 0) / ratedN : null;

  if (migrationPending && agents.length === 0) {
    return (
      <Card>
        <EmptyState title={t("mac.migration_title")} description={t("mac.migration")} />
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t("agt.online")} value={online} variant="success" icon="users" change={t("agt.online_chg", { n: agents.length })} />
        <StatCard label={t("agt.open_total")} value={open} variant="warning" icon="activity" change={t("agt.open_total_chg")} />
        <StatCard label={t("agt.resolved_7")} value={res7} variant="info" icon="check" change={t("agt.resolved_7_chg")} />
        <StatCard
          label={t("agt.team_csat")}
          value={teamCsat != null ? teamCsat.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "—"}
          variant="primary"
          icon="star"
          change={t("agt.team_csat_chg")}
        />
      </div>
      <DataTable columns={columns} data={agents} keyField="id" empty={t("agt.empty")} />
    </>
  );
}
