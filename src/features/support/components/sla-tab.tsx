"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ChartHead, FilterPills, fInput } from "@/components/ui";
import type { DeskData } from "@/app/d/support/desk-data";
import { saveSlaPolicies } from "@/app/d/support/desk-action";
import {
  PRIORITIES,
  complianceByPriority,
  formatMinutes,
  policyFor,
  slaState,
  type Priority,
  type SlaPolicy,
} from "../metrics";
import { MigrationNotice, PRIORITY_COLOR, PriorityLabel, SlaBadge, unitsOf, useNow } from "./desk-shared";
import type { TFn } from "../types";

type Unit = "m" | "h" | "d";
const FACTOR: Record<Unit, number> = { m: 1, h: 60, d: 1440 };

function split(minutes: number): { value: string; unit: Unit } {
  if (minutes % 1440 === 0) return { value: String(minutes / 1440), unit: "d" };
  if (minutes % 60 === 0) return { value: String(minutes / 60), unit: "h" };
  return { value: String(minutes), unit: "m" };
}

function Duration({
  value,
  unit,
  onChange,
  label,
  t,
}: {
  value: string;
  unit: Unit;
  onChange: (v: string, u: Unit) => void;
  label: string;
  t: TFn;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value, unit)}
        className={`${fInput} !w-20 tabular-nums`}
      />
      <select
        aria-label={label}
        value={unit}
        onChange={(e) => onChange(value, e.target.value as Unit)}
        className="h-9 rounded-lg border border-border bg-card px-2 text-[13px] text-text"
      >
        <option value="m">{t("sla.u_min")}</option>
        <option value="h">{t("sla.u_h")}</option>
        <option value="d">{t("sla.u_d")}</option>
      </select>
    </div>
  );
}

type Draft = Record<Priority, { fr: { value: string; unit: Unit }; res: { value: string; unit: Unit } }>;

const toDraft = (policies: SlaPolicy[]): Draft =>
  Object.fromEntries(
    PRIORITIES.map((p) => {
      const pol = policyFor(policies, p);
      return [p, { fr: split(pol.first_response_minutes), res: split(pol.resolution_minutes) }];
    })
  ) as Draft;

export function SlaTab({ t, data }: { t: TFn; data: DeskData }) {
  const router = useRouter();
  const now = useNow();
  const units = unitsOf(t);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft>(() => toDraft(data.policies));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [window, setWindow] = useState<"7" | "30">("7");
  const nowMs = now ?? new Date(data.generatedAt).getTime();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(data.policies)), [draft, data.policies]);

  const setField = (p: Priority, k: "fr" | "res", value: string, unit: Unit) =>
    setDraft((d) => ({ ...d, [p]: { ...d[p], [k]: { value, unit } } }));

  const save = () => {
    const policies: SlaPolicy[] = PRIORITIES.map((p) => ({
      priority: p,
      first_response_minutes: Math.round(Number(draft[p].fr.value) * FACTOR[draft[p].fr.unit]),
      resolution_minutes: Math.round(Number(draft[p].res.value) * FACTOR[draft[p].res.unit]),
    }));
    setMsg(null);
    start(async () => {
      const res = await saveSlaPolicies(policies);
      if (res.error) {
        const known = ["not_authorized", "invalid", "migration_pending"].includes(res.error);
        setMsg({ ok: false, text: known ? t(`tk.err_${res.error}`) : res.error });
      } else {
        setMsg({ ok: true, text: t("sla.saved") });
        router.refresh();
      }
    });
  };

  const compliance = useMemo(() => {
    const cutoff = nowMs - Number(window) * 86400000;
    const cases = data.cases.filter((c) => new Date(c.escalatedAt).getTime() >= cutoff);
    return complianceByPriority(cases, data.policies, nowMs);
  }, [data, window, nowMs]);

  const convById = useMemo(() => new Map(data.conversations.map((c) => [c.id, c])), [data.conversations]);
  const live = useMemo(
    () =>
      data.cases
        .filter((c) => !c.resolvedAt)
        .map((c) => ({ c, sla: slaState(c, policyFor(data.policies, c.priority), nowMs) }))
        .filter((x) => x.sla.state !== "ok")
        .sort((a, b) => a.sla.minutes - b.sla.minutes),
    [data, nowMs]
  );

  const pct = (met: number, total: number) => (total ? `${Math.round((met / total) * 100)}%` : "—");
  const tone = (met: number, total: number) =>
    !total ? "default" : met / total >= 0.95 ? "success" : met / total >= 0.85 ? "warning" : "danger";

  return (
    <>
      {data.migrationPending && <MigrationNotice t={t} />}

      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-text">{t("sla.policies")}</h3>
          <p className="text-[12.5px] text-subtext">{t("sla.policies_desc")}</p>
        </div>
        <Button size="sm" icon="check" onClick={save} disabled={pending || !dirty || data.migrationPending}>
          {t("sla.save")}
        </Button>
      </div>
      {msg && (
        <div className={`mb-3 rounded-xl border px-4 py-2.5 text-sm ${msg.ok ? "border-success/30 bg-success-light text-success" : "border-danger/30 bg-danger-light text-danger"}`}>
          {msg.text}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {PRIORITIES.map((p) => (
          <Card key={p}>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLOR[p] }} />
              <b className="text-sm font-bold text-text">{t(`tk.prio_${p}`)}</b>
              <span className="ms-auto text-[11px] text-subtext">
                {formatMinutes(policyFor(data.policies, p).first_response_minutes, units)} / {formatMinutes(policyFor(data.policies, p).resolution_minutes, units)}
              </span>
            </div>
            <p className="text-[12px] text-subtext mb-1">{t("sla.first_response")}</p>
            <div className="mb-3">
              <Duration t={t} label={t("sla.first_response")} {...draft[p].fr} onChange={(v, u) => setField(p, "fr", v, u)} />
            </div>
            <p className="text-[12px] text-subtext mb-1">{t("sla.resolution")}</p>
            <Duration t={t} label={t("sla.resolution")} {...draft[p].res} onChange={(v, u) => setField(p, "res", v, u)} />
          </Card>
        ))}
      </div>

      <Card className="mb-7">
        <ChartHead
          title={t("sla.compliance")}
          description={t("sla.compliance_desc")}
          right={
            <FilterPills
              options={[["7", t("sla.window_7")], ["30", t("sla.window_30")]]}
              value={window}
              onChange={setWindow}
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-start text-[11px] uppercase tracking-wide text-subtext">
                <th className="py-2 pe-4 text-start font-semibold">{t("tk.col_priority")}</th>
                <th className="py-2 pe-4 text-start font-semibold">{t("sla.cases")}</th>
                <th className="py-2 pe-4 text-start font-semibold">{t("sla.first_met")}</th>
                <th className="py-2 text-start font-semibold">{t("sla.res_met")}</th>
              </tr>
            </thead>
            <tbody>
              {compliance.map((r) => (
                <tr key={r.priority} className="border-t border-border">
                  <td className="py-2.5 pe-4"><PriorityLabel priority={r.priority} t={t} /></td>
                  <td className="py-2.5 pe-4 tabular-nums">{r.total}</td>
                  <td className="py-2.5 pe-4"><Badge variant={tone(r.firstMet, r.firstTotal)}>{pct(r.firstMet, r.firstTotal)}</Badge></td>
                  <td className="py-2.5"><Badge variant={tone(r.resMet, r.resTotal)}>{pct(r.resMet, r.resTotal)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mb-3.5">
        <h3 className="text-base font-bold text-text">{t("sla.live")}</h3>
        <p className="text-[12.5px] text-subtext">{t("sla.live_desc")}</p>
      </div>
      <Card padding={false} className="overflow-hidden">
        {live.length === 0 ? (
          <p className="p-5 text-sm text-subtext">{t("sla.live_empty")}</p>
        ) : (
          live.map(({ c, sla }) => {
            const conv = convById.get(c.conversationId);
            return (
              <div key={`${c.conversationId}-${c.escalatedAt}`} className="flex flex-wrap items-center gap-3 px-[18px] py-3.5 border-b border-border last:border-b-0">
                <div className="flex-1 min-w-[180px]">
                  <span dir="auto" className="block text-[13px] font-semibold text-text truncate">{conv?.subject || t("tk.no_subject")}</span>
                  <span dir="auto" className="block text-[11.5px] text-subtext truncate">{conv?.ownerName ?? "—"}</span>
                </div>
                <PriorityLabel priority={c.priority} t={t} />
                <span className="text-[12px] text-subtext">{sla.kind ? t(`sla.kind_${sla.kind}`) : ""}</span>
                <SlaBadge sla={sla} t={t} />
                <Link href={`/support/inbox?c=${c.conversationId}`} className="inline-flex">
                  <Button size="xs" variant="secondary" icon="chevron-right" type="button">{t("tk.act_open")}</Button>
                </Link>
              </div>
            );
          })
        )}
      </Card>
    </>
  );
}
