"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { StatCard, Card, ChartHead, Donut, Legend, CHART, DashIcon } from "@/components/ui";
import type { DeskData } from "@/app/d/support/desk-data";
import {
  containmentRate,
  conversationsPerDay,
  countByRole,
  dayKey,
  firstResponseMinutes,
  formatMinutes,
  median,
  resolutionMinutes,
  slaMetRate,
  topSubjects,
} from "../metrics";
import { MigrationNotice, unitsOf } from "./desk-shared";
import type { TFn } from "../types";

const DAY = 86400000;
const ROLE_COLOR: Record<string, string> = {
  customer: CHART.info,
  rider: CHART.success,
  merchant: CHART.primary,
  agent: CHART.warning,
};

export function OverviewTab({ t, data }: { t: TFn; data: DeskData }) {
  const locale = useLocale();
  const units = unitsOf(t);

  const m = useMemo(() => {
    const now = new Date(data.generatedAt);
    const nowMs = now.getTime();
    const open = data.conversations.filter((c) => c.status === "waiting" || c.status === "assigned");
    const unassigned = open.filter((c) => !c.assigned_agent_id).length;
    const today = dayKey(now);
    const newToday = data.conversations.filter((c) => dayKey(c.created_at) === today).length;

    const cases7 = data.cases.filter((c) => nowMs - new Date(c.escalatedAt).getTime() <= 7 * DAY);
    const frt = median(cases7.map(firstResponseMinutes).filter((x): x is number => x != null));
    const res = median(cases7.map(resolutionMinutes).filter((x): x is number => x != null));
    const met = slaMetRate(cases7, data.policies, now);

    const rated = data.conversations.filter(
      (c) => c.csat_rating != null && nowMs - new Date(c.csat_at ?? c.last_message_at).getTime() <= 30 * DAY
    );
    const csat = rated.length ? rated.reduce((a, c) => a + (c.csat_rating ?? 0), 0) / rated.length : null;

    const escalatedIds = new Set(data.cases.map((c) => c.conversationId));
    const perDay = conversationsPerDay(
      data.conversations.map((c) => ({ created_at: c.created_at, escalated: escalatedIds.has(c.id) })),
      14,
      now
    );
    const containment = containmentRate(
      data.conversations.map((c) => data.cases.filter((k) => k.conversationId === c.id).length)
    );
    const roles = countByRole(data.conversations.map((c) => c.user_role));
    const subjects = topSubjects(data.conversations.map((c) => c.subject), 5);
    return { open: open.length, unassigned, newToday, frt, res, met, cases7: cases7.length, csat, rated: rated.length, perDay, containment, roles, subjects };
  }, [data]);

  const dur = (v: number | null) => (v == null ? "—" : formatMinutes(v, units));
  const peak = Math.max(1, ...m.perDay.map((d) => d.bot + d.escalated));
  const totalRoles = m.roles.reduce((a, r) => a + r.count, 0);
  const maxSubject = m.subjects[0]?.count ?? 1;
  const dayLabel = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

  return (
    <>
      {data.migrationPending && <MigrationNotice t={t} />}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard label={t("ov.open_now")} value={m.open} variant="danger" icon="support" change={t("ov.open_unassigned", { n: m.unassigned })} />
        <StatCard label={t("ov.new_today")} value={m.newToday} variant="primary" icon="chat" change={t("ov.new_today_sub")} />
        <StatCard label={t("ov.frt")} value={dur(m.frt)} variant="info" icon="clock" change={t("ov.median_7d")} />
        <StatCard label={t("ov.res")} value={dur(m.res)} variant="warning" icon="activity" change={t("ov.median_7d")} />
        <StatCard label={t("ov.sla_met")} value={pct(m.met)} variant="success" icon="shield" change={t("ov.sla_met_sub", { n: m.cases7 })} />
        <StatCard
          label={t("ov.csat")}
          value={m.csat == null ? "—" : m.csat.toFixed(1)}
          variant="primary"
          icon="star"
          change={m.csat == null ? t("ov.csat_none") : t("ov.csat_sub", { n: m.rated })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-5 items-start">
        <Card>
          <ChartHead
            title={t("ov.per_day")}
            description={t("ov.per_day_desc")}
            right={<Legend items={[{ label: t("ov.bot_only"), color: CHART.info }, { label: t("ov.escalated"), color: CHART.primary }]} />}
          />
          <div className="flex items-end gap-1.5 h-[200px]" dir="ltr">
            {m.perDay.map((d) => {
              const total = d.bot + d.escalated;
              return (
                <div key={d.day} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1" title={`${dayLabel(d.day)} · ${total}`}>
                  <span className="text-[10px] text-subtext tabular-nums">{total || ""}</span>
                  <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${(total / peak) * 82}%` }}>
                    <div style={{ flex: d.escalated, background: CHART.primary }} />
                    <div style={{ flex: d.bot, background: CHART.info }} />
                  </div>
                  <span className="text-[9px] text-subtext whitespace-nowrap">{dayLabel(d.day)}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <ChartHead title={t("ov.by_role")} description={t("ov.by_role_desc")} />
          {totalRoles ? (
            <Donut
              segments={m.roles.map((r) => ({
                name: t(`tk.role_${r.role}`),
                pct: Math.round((r.count / totalRoles) * 100),
                color: ROLE_COLOR[r.role],
              }))}
              centerValue={totalRoles.toLocaleString(locale)}
              centerLabel={t("ov.total")}
            />
          ) : (
            <p className="text-sm text-subtext">{t("ov.empty")}</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 items-start">
        <Card>
          <ChartHead title={t("ov.containment")} description={t("ov.containment_desc")} />
          <b className="block text-4xl font-extrabold text-text tabular-nums mb-3">{pct(m.containment)}</b>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-success" style={{ width: `${Math.round((m.containment ?? 0) * 100)}%` }} />
          </div>
        </Card>
        <Card title={t("ov.top_subjects")} description={t("ov.top_subjects_desc")}>
          {m.subjects.length === 0 ? (
            <p className="text-sm text-subtext">{t("ov.empty")}</p>
          ) : (
            <div className="space-y-3.5">
              {m.subjects.map((s) => (
                <div key={s.subject} className="flex items-center gap-3.5">
                  <DashIcon name="chat" className="w-4 h-4 text-subtext shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span dir="auto" className="text-[13px] font-semibold text-text truncate">{s.subject}</span>
                      <span className="text-[12px] text-subtext tabular-nums ms-2 whitespace-nowrap">{t("ov.conv_count", { n: s.count })}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / maxSubject) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
