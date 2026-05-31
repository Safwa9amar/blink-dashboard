"use client";

import { useState } from "react";
import { Card, Badge, Button, Toggle, DashIcon } from "@/components/ui";
import { SLA_POLICIES, RULES, PRIO } from "../data";
import type { TFn } from "../types";

export function SlaTab({ t }: { t: TFn }) {
  const [rules, setRules] = useState(RULES.map((r) => r.on));
  const toggle = (i: number) => setRules((rs) => rs.map((v, j) => (j === i ? !v : v)));

  return (
    <>
      {/* SLA policies */}
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-text">{t("sla.policies")}</h3>
          <p className="text-[12.5px] text-subtext">{t("sla.policies_desc")}</p>
        </div>
        <Button variant="secondary" size="sm" icon="clock">{t("sla.business_hours")}</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {SLA_POLICIES.map((p) => (
          <Card key={p.name}>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIO[p.prio] }} />
              <b className="text-sm font-bold text-text">{p.name}</b>
              <Badge variant={p.met >= 95 ? "success" : p.met >= 90 ? "warning" : "danger"} className="ms-auto">{p.met}%</Badge>
            </div>
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-subtext">{t("sla.first_response")}</span>
              <b className="text-text">{p.frt}</b>
            </div>
            <div className="flex items-center justify-between text-[12px] mb-3">
              <span className="text-subtext">{t("sla.resolution")}</span>
              <b className="text-text">{p.resolution}</b>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-success" style={{ width: `${p.met}%` }} />
            </div>
            <p className="text-[11px] text-subtext mt-2">{t("sla.breached", { n: p.breached })}</p>
          </Card>
        ))}
      </div>

      {/* Automation rules */}
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-text">{t("rul.title")}</h3>
          <p className="text-[12.5px] text-subtext">{t("rul.desc")}</p>
        </div>
        <Button size="sm" icon="plus">{t("rul.new")}</Button>
      </div>
      <Card padding={false} className="overflow-hidden">
        {RULES.map((r, i) => (
          <div key={r.name} className="flex gap-4 items-start p-[18px] border-b border-border last:border-b-0">
            <Toggle on={rules[i]} onClick={() => toggle(i)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <b className="text-sm font-bold text-text">{r.name}</b>
                {!rules[i] && <Badge variant="default">{t("rul.paused")}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                <span className="inline-flex items-center gap-1 rounded-md bg-info-light text-info px-2 py-1 font-semibold">
                  <DashIcon name="activity" className="w-3 h-3" />
                  {t("rul.when")}: {r.when}
                </span>
                {r.conditions.map((c) => (
                  <span key={c} className="rounded-md bg-muted text-subtext px-2 py-1 font-medium">{t("rul.if")}: {c}</span>
                ))}
                {r.actions.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-md bg-soft-pink text-primary px-2 py-1 font-semibold">
                    <DashIcon name="chevron-right" className="w-3 h-3" />
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-end shrink-0">
              <b className="block text-sm font-bold text-text tabular-nums">{r.runs.toLocaleString()}</b>
              <span className="text-[10.5px] text-subtext uppercase tracking-wide">{t("rul.runs")}</span>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
