// Pure support-desk metrics. A conversation can hold several "cases": a case runs from
// an `escalated` system event (bot -> human queue) to the next `resolved` event, or is
// still open. All timestamps are ISO strings so results serialise across the RSC boundary.

export type Priority = "low" | "normal" | "high" | "urgent";
export const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low"];

export interface SlaPolicy {
  priority: Priority;
  first_response_minutes: number;
  resolution_minutes: number;
}

/** Seed policies (mirror the `support_sla_policies` migration). */
export const DEFAULT_SLA_POLICIES: SlaPolicy[] = [
  { priority: "urgent", first_response_minutes: 5, resolution_minutes: 120 },
  { priority: "high", first_response_minutes: 15, resolution_minutes: 480 },
  { priority: "normal", first_response_minutes: 60, resolution_minutes: 1440 },
  { priority: "low", first_response_minutes: 240, resolution_minutes: 4320 },
];

export interface MetricMessage {
  sender: "user" | "bot" | "agent" | "system";
  sender_id: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface MetricConversation {
  id: string;
  priority?: Priority | null;
}

export interface SupportCase {
  conversationId: string;
  priority: Priority;
  escalatedAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  assignedTo: string | null;
  resolvedBy: string | null;
  reason: string | null;
}

const ts = (iso: string) => new Date(iso).getTime();
const minutesBetween = (a: string, b: string) => Math.max(0, (ts(b) - ts(a)) / 60000);

export function asPriority(p: unknown): Priority {
  return p === "low" || p === "high" || p === "urgent" ? p : "normal";
}

/** Build a conversation's cases from its messages (any order). */
export function buildCases(messages: MetricMessage[], conversation: MetricConversation): SupportCase[] {
  const sorted = [...messages].sort((a, b) => ts(a.created_at) - ts(b.created_at));
  const priority = asPriority(conversation.priority);
  const out: SupportCase[] = [];
  let cur: SupportCase | null = null;
  for (const m of sorted) {
    const type = m.sender === "system" ? (m.meta?.type as string | undefined) : undefined;
    if (type === "escalated") {
      if (cur) continue; // already escalated and still open
      cur = {
        conversationId: conversation.id,
        priority,
        escalatedAt: m.created_at,
        firstResponseAt: null,
        resolvedAt: null,
        assignedTo: null,
        resolvedBy: null,
        reason: typeof m.meta?.reason === "string" ? m.meta.reason : null,
      };
    } else if (!cur) {
      continue;
    } else if (type === "assigned") {
      cur.assignedTo = m.sender_id ?? cur.assignedTo;
    } else if (type === "resolved") {
      cur.resolvedAt = m.created_at;
      cur.resolvedBy = m.sender_id;
      out.push(cur);
      cur = null;
    } else if (m.sender === "agent" && !cur.firstResponseAt) {
      cur.firstResponseAt = m.created_at;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Minutes from escalation to the first agent reply; null while unanswered. */
export function firstResponseMinutes(c: SupportCase): number | null {
  return c.firstResponseAt ? minutesBetween(c.escalatedAt, c.firstResponseAt) : null;
}

/** Minutes from escalation to resolution; null while open. */
export function resolutionMinutes(c: SupportCase): number | null {
  return c.resolvedAt ? minutesBetween(c.escalatedAt, c.resolvedAt) : null;
}

export type SlaStateName = "ok" | "due_soon" | "breached";
export interface SlaState {
  state: SlaStateName;
  /** Which target the state refers to (null for resolved-within-target cases). */
  kind: "first_response" | "resolution" | null;
  /** Signed minutes to the target: positive = left, negative = overdue. 0 for closed cases. */
  minutes: number;
}

const DUE_SOON_RATIO = 0.25;

export function policyFor(policies: SlaPolicy[], priority: Priority): SlaPolicy {
  return (
    policies.find((p) => p.priority === priority) ??
    DEFAULT_SLA_POLICIES.find((p) => p.priority === priority)!
  );
}

/** SLA state of a case against a policy. Open cases measure against `now`. */
export function slaState(c: SupportCase, policy: SlaPolicy, now: Date | number): SlaState {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const nowIso = new Date(nowMs).toISOString();
  const frTarget = policy.first_response_minutes;
  const resTarget = policy.resolution_minutes;

  if (c.resolvedAt) {
    const fr = firstResponseMinutes(c);
    if (fr != null && fr > frTarget) return { state: "breached", kind: "first_response", minutes: frTarget - fr };
    const res = resolutionMinutes(c)!;
    if (res > resTarget) return { state: "breached", kind: "resolution", minutes: resTarget - res };
    return { state: "ok", kind: null, minutes: 0 };
  }

  const elapsed = minutesBetween(c.escalatedAt, nowIso);
  // Candidate open targets: first response (until answered) and resolution.
  const cands: { kind: "first_response" | "resolution"; total: number; left: number }[] = [];
  if (!c.firstResponseAt) cands.push({ kind: "first_response", total: frTarget, left: frTarget - elapsed });
  else {
    const fr = firstResponseMinutes(c)!;
    if (fr > frTarget) return { state: "breached", kind: "first_response", minutes: frTarget - fr };
  }
  cands.push({ kind: "resolution", total: resTarget, left: resTarget - elapsed });

  const breached = cands.filter((x) => x.left < 0).sort((a, b) => a.left - b.left)[0];
  if (breached) return { state: "breached", kind: breached.kind, minutes: breached.left };
  const soon = cands
    .filter((x) => x.left < x.total * DUE_SOON_RATIO)
    .sort((a, b) => a.left - b.left)[0];
  if (soon) return { state: "due_soon", kind: soon.kind, minutes: soon.left };
  const next = cands.sort((a, b) => a.left - b.left)[0];
  return { state: "ok", kind: next.kind, minutes: next.left };
}

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Share (0..1) of conversations that never escalated; null with no conversations. */
export function containmentRate(caseCounts: number[]): number | null {
  if (!caseCounts.length) return null;
  return caseCounts.filter((n) => n === 0).length / caseCounts.length;
}

/** Calendar day (YYYY-MM-DD) in Africa/Algiers. */
export function dayKey(iso: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Last `days` Algiers day keys ending at `now`, oldest first. */
export function lastDays(days: number, now: Date | number = new Date()): string[] {
  const base = typeof now === "number" ? now : now.getTime();
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(dayKey(base - i * 86400000));
  return out;
}

export interface DayBucket {
  day: string;
  bot: number;
  escalated: number;
}

/** Conversations created per day, split bot-only / escalated. */
export function conversationsPerDay(
  items: { created_at: string; escalated: boolean }[],
  days: number,
  now: Date | number = new Date()
): DayBucket[] {
  const buckets = new Map(lastDays(days, now).map((d) => [d, { day: d, bot: 0, escalated: 0 }]));
  for (const it of items) {
    const b = buckets.get(dayKey(it.created_at));
    if (!b) continue;
    if (it.escalated) b.escalated++;
    else b.bot++;
  }
  return [...buckets.values()];
}

export function countByRole(roles: string[]): { role: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of roles) m.set(r, (m.get(r) ?? 0) + 1);
  return [...m.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count);
}

/** Top subjects, grouped case-insensitively (first spelling wins). */
export function topSubjects(
  subjects: (string | null | undefined)[],
  limit = 5
): { subject: string; count: number }[] {
  const m = new Map<string, { subject: string; count: number }>();
  for (const raw of subjects) {
    const s = raw?.trim();
    if (!s) continue;
    const k = s.toLowerCase();
    const e = m.get(k);
    if (e) e.count++;
    else m.set(k, { subject: s, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject)).slice(0, limit);
}

export interface Compliance {
  priority: Priority;
  total: number;
  firstTotal: number;
  firstMet: number;
  resTotal: number;
  resMet: number;
}

/** First-response / resolution compliance per priority. Open cases count only once breached. */
export function complianceByPriority(
  cases: SupportCase[],
  policies: SlaPolicy[],
  now: Date | number = new Date()
): Compliance[] {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return PRIORITIES.map((priority) => {
    const policy = policyFor(policies, priority);
    const row: Compliance = { priority, total: 0, firstTotal: 0, firstMet: 0, resTotal: 0, resMet: 0 };
    for (const c of cases) {
      if (c.priority !== priority) continue;
      row.total++;
      const fr = firstResponseMinutes(c);
      const frOpenLeft = c.firstResponseAt ? null : policy.first_response_minutes - minutesBetween(c.escalatedAt, new Date(nowMs).toISOString());
      if (fr != null) {
        row.firstTotal++;
        if (fr <= policy.first_response_minutes) row.firstMet++;
      } else if (frOpenLeft != null && frOpenLeft < 0) row.firstTotal++;
      const res = resolutionMinutes(c);
      if (res != null) {
        row.resTotal++;
        if (res <= policy.resolution_minutes) row.resMet++;
      } else if (policy.resolution_minutes - minutesBetween(c.escalatedAt, new Date(nowMs).toISOString()) < 0) row.resTotal++;
    }
    return row;
  });
}

/** Overall SLA met share (0..1) over cases that are closed or already breached; null if none. */
export function slaMetRate(cases: SupportCase[], policies: SlaPolicy[], now: Date | number = new Date()): number | null {
  let total = 0;
  let met = 0;
  for (const c of cases) {
    const s = slaState(c, policyFor(policies, c.priority), now);
    if (c.resolvedAt || s.state === "breached") {
      total++;
      if (s.state !== "breached") met++;
    }
  }
  return total ? met / total : null;
}

/** "1 h", "90 min", "2 d" style label for a minute count (units passed in for i18n). */
export function formatMinutes(min: number, units: { m: string; h: string; d: string }): string {
  const a = Math.abs(Math.round(min));
  if (a < 60) return `${a} ${units.m}`;
  if (a < 60 * 48) {
    const h = a / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} ${units.h}`;
  }
  const d = a / 1440;
  return `${Number.isInteger(d) ? d : d.toFixed(1)} ${units.d}`;
}
