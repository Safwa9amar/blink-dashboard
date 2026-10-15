// Pure CSAT + agent roster metrics built from the desk data (conversations + cases).
import { median, firstResponseMinutes, dayKey, type SupportCase } from "./metrics";

const DAY = 86400000;
const ts = (iso: string) => new Date(iso).getTime();

export interface CsatConversation {
  id: string;
  user_role: string;
  csat_rating: number | null;
  csat_comment: string | null;
  csat_at: string | null;
  ownerName: string | null;
}

export interface ResolverCase extends SupportCase {
  resolvedByName: string | null;
}

/** conversation id -> the staff id/name that resolved its most recent resolved case. */
function resolverByConversation(cases: ResolverCase[]): Map<string, { id: string | null; name: string | null; at: string }> {
  const m = new Map<string, { id: string | null; name: string | null; at: string }>();
  for (const c of cases) {
    if (!c.resolvedAt) continue;
    const prev = m.get(c.conversationId);
    if (!prev || prev.at < c.resolvedAt) m.set(c.conversationId, { id: c.resolvedBy, name: c.resolvedByName, at: c.resolvedAt });
  }
  return m;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface CsatWeek {
  /** Algiers calendar day (YYYY-MM-DD) the 7-day bucket starts on. */
  start: string;
  avg: number | null;
  count: number;
}

export interface CsatResponseItem {
  conversationId: string;
  rating: number;
  comment: string | null;
  who: string | null;
  role: string;
  agent: string | null;
  at: string;
}

export interface CsatStats {
  rated: number;
  avg: number | null;
  /** counts for ratings 1..5 (index 0 = 1 star) */
  dist: number[];
  weeks: CsatWeek[];
  resolvedConversations: number;
  /** rated / resolved conversations, 0..1; null when nothing was resolved */
  responseRate: number | null;
  latest: CsatResponseItem[];
}

export function csatStats(
  conversations: CsatConversation[],
  cases: ResolverCase[],
  now: Date | number,
  opts: { weeks?: number; latest?: number } = {}
): CsatStats {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const nWeeks = opts.weeks ?? 6;
  const resolver = resolverByConversation(cases);
  const rated = conversations.filter((c) => c.csat_rating != null && c.csat_at);
  const dist = [0, 0, 0, 0, 0];
  for (const c of rated) {
    const r = Math.min(5, Math.max(1, Math.round(c.csat_rating as number)));
    dist[r - 1]++;
  }

  const buckets: { ratings: number[] }[] = Array.from({ length: nWeeks }, () => ({ ratings: [] }));
  for (const c of rated) {
    const age = Math.floor((nowMs - ts(c.csat_at as string)) / (7 * DAY));
    if (age < 0 || age >= nWeeks) continue;
    buckets[nWeeks - 1 - age].ratings.push(c.csat_rating as number);
  }
  const weeks: CsatWeek[] = buckets.map((b, i) => ({
    start: dayKey(nowMs - (nWeeks - i) * 7 * DAY + DAY),
    avg: avg(b.ratings),
    count: b.ratings.length,
  }));

  const resolvedConversations = new Set(cases.filter((c) => c.resolvedAt).map((c) => c.conversationId)).size;
  const ratedResolved = rated.filter((c) => resolver.has(c.id)).length;
  const responseRate = resolvedConversations ? Math.min(1, Math.max(ratedResolved, 0) / resolvedConversations) : null;

  const latest: CsatResponseItem[] = [...rated]
    .sort((a, b) => ts(b.csat_at as string) - ts(a.csat_at as string))
    .slice(0, opts.latest ?? 10)
    .map((c) => ({
      conversationId: c.id,
      rating: c.csat_rating as number,
      comment: c.csat_comment?.trim() || null,
      who: c.ownerName,
      role: c.user_role,
      agent: resolver.get(c.id)?.name ?? null,
      at: c.csat_at as string,
    }));

  return {
    rated: rated.length,
    avg: avg(rated.map((c) => c.csat_rating as number)),
    dist,
    weeks,
    resolvedConversations,
    responseRate,
    latest,
  };
}

export interface AgentConversation {
  id: string;
  status: string;
  assigned_agent_id: string | null;
  csat_rating: number | null;
}

export interface AgentRow {
  id: string;
  name: string;
  staffRole: string;
  lastActiveAt: string | null;
  openAssigned: number;
  resolved7: number;
  resolved30: number;
  /** median minutes to first response on cases assigned to them; null when none */
  medianFirstResponse: number | null;
  csatAvg: number | null;
  csatCount: number;
}

export const ONLINE_WINDOW_MS = 15 * 60000;

/** Online = sent an agent message within the last 15 minutes of `now`. */
export function isOnline(lastActiveAt: string | null, now: Date | number): boolean {
  if (!lastActiveAt) return false;
  const nowMs = typeof now === "number" ? now : now.getTime();
  return nowMs - ts(lastActiveAt) <= ONLINE_WINDOW_MS;
}

export function agentRows(
  staff: { id: string; name: string; staff_role: string }[],
  conversations: AgentConversation[],
  cases: ResolverCase[],
  lastAgentMessageAt: Record<string, string>,
  now: Date | number
): AgentRow[] {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const resolver = resolverByConversation(cases);
  return staff
    .map((s) => {
      const resolved = cases.filter((c) => c.resolvedAt && c.resolvedBy === s.id);
      const within = (days: number) => resolved.filter((c) => nowMs - ts(c.resolvedAt as string) <= days * DAY).length;
      const frt = cases
        .filter((c) => c.assignedTo === s.id)
        .map(firstResponseMinutes)
        .filter((x): x is number => x != null);
      const ratings = conversations
        .filter((c) => c.csat_rating != null && resolver.get(c.id)?.id === s.id)
        .map((c) => c.csat_rating as number);
      return {
        id: s.id,
        name: s.name,
        staffRole: s.staff_role,
        lastActiveAt: lastAgentMessageAt[s.id] ?? null,
        openAssigned: conversations.filter((c) => c.status === "assigned" && c.assigned_agent_id === s.id).length,
        resolved7: within(7),
        resolved30: within(30),
        medianFirstResponse: median(frt),
        csatAvg: avg(ratings),
        csatCount: ratings.length,
      };
    })
    .sort((a, b) => b.resolved30 - a.resolved30 || a.name.localeCompare(b.name));
}
