import type { Fee, Override, PricingKey } from "./types";

// Pure helpers for the pricing cockpit. All calendar-day logic is in Africa/Algiers
// (a fixed UTC+1, no DST) and `now` is always passed in — nothing here reads the clock.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const ALGIERS_OFFSET_MS = HOUR;

const ms = (iso: string) => new Date(iso).getTime();
/** Algiers calendar-day index (days since epoch, local). */
const dayIndex = (t: number) => Math.floor((t + ALGIERS_OFFSET_MS) / DAY);

/** ISO -> `datetime-local` value in Algiers time. */
export const toInputDate = (iso: string | null | undefined) =>
  iso ? new Date(new Date(iso).getTime() + ALGIERS_OFFSET_MS).toISOString().slice(0, 16) : "";
/** `datetime-local` value (Algiers) -> ISO. */
export const fromInputDate = (local: string) => (local ? new Date(`${local}:00+01:00`).toISOString() : null);
/** `date` input value (Algiers) -> ISO of the end of that day (23:59). */
export const endOfDayIso = (date: string) => new Date(`${date}T23:59:00+01:00`).toISOString();
/** ISO + n days (24h steps; Algiers has no DST). */
export const addDays = (iso: string, days: number) => new Date(ms(iso) + days * DAY).toISOString();

// ---- ending soon ------------------------------------------------------------------

export type EndingSoon = { override: Override; daysLeft: number };

/** Active overrides whose end falls within `days` of `now`, soonest first. */
export function endingSoon(overrides: Override[], now: Date, days = 7): EndingSoon[] {
  const t = now.getTime();
  return overrides
    .filter((o) => o.status === "active" && o.ends_at && ms(o.ends_at) > t && ms(o.ends_at) <= t + days * DAY)
    .map((o) => ({ override: o, daysLeft: dayIndex(ms(o.ends_at!)) - dayIndex(t) }))
    .sort((a, b) => ms(a.override.ends_at!) - ms(b.override.ends_at!));
}

// ---- KPIs / counts -----------------------------------------------------------------

export type OverviewKpis = {
  active: number;
  wilayas: number;
  partnerDeals: number;
  merchants: number;
  agents: number;
  endingSoon: number;
};

export function overviewKpis(overrides: Override[], now: Date): OverviewKpis {
  const active = overrides.filter((o) => o.status === "active");
  const merchants = new Set(active.filter((o) => o.merchant_id).map((o) => o.merchant_id));
  const agents = new Set(active.filter((o) => o.agent_id).map((o) => o.agent_id));
  return {
    active: active.length,
    wilayas: new Set(active.filter((o) => o.wilaya_code).map((o) => o.wilaya_code)).size,
    partnerDeals: active.filter((o) => o.merchant_id || o.agent_id).length,
    merchants: merchants.size,
    agents: agents.size,
    endingSoon: endingSoon(overrides, now).length,
  };
}

export type StatusFilter = "all" | "active" | "scheduled" | "ending_soon" | "ended" | "archived";
export const STATUS_FILTERS: StatusFilter[] = ["all", "active", "scheduled", "ending_soon", "ended", "archived"];

export function statusCounts(overrides: Override[], now: Date): Record<StatusFilter, number> {
  const c: Record<StatusFilter, number> = { all: overrides.length, active: 0, scheduled: 0, ending_soon: 0, ended: 0, archived: 0 };
  for (const o of overrides) c[o.status] += 1;
  c.ending_soon = endingSoon(overrides, now).length;
  return c;
}

export function filterByStatus(overrides: Override[], status: StatusFilter, now: Date): Override[] {
  if (status === "all") return overrides;
  if (status === "ending_soon") return endingSoon(overrides, now).map((e) => e.override);
  return overrides.filter((o) => o.status === status);
}

// ---- calendar ----------------------------------------------------------------------

export type CalendarTone = "active" | "scheduled" | "ended";
export type CalendarBar = {
  override: Override;
  /** Percent from the inline start of the track. */
  leftPct: number;
  widthPct: number;
  openStart: boolean;
  openEnd: boolean;
  tone: CalendarTone;
};
export type CalendarMonth = { key: string; year: number; month: number; leftPct: number; widthPct: number };
export type CalendarLayout = { start: number; end: number; months: CalendarMonth[]; todayPct: number; bars: CalendarBar[] };

/** First instant of the Algiers month containing `t`, shifted by `add` months. */
function monthStart(t: number, add = 0): number {
  const d = new Date(t + ALGIERS_OFFSET_MS);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + add, 1) - ALGIERS_OFFSET_MS;
}

export function calendarLayout(overrides: Override[], now: Date): CalendarLayout {
  const t = now.getTime();
  const starts = overrides.filter((o) => o.starts_at).map((o) => ms(o.starts_at!));
  const ends = overrides.filter((o) => o.ends_at).map((o) => ms(o.ends_at!));
  let from = starts.length ? Math.min(...starts) : monthStart(t, -1);
  let to = ends.length ? Math.max(...ends) : t + 92 * DAY;
  from = Math.min(from, t);
  to = Math.max(to, t + 30 * DAY);
  const start = monthStart(from);
  const end = monthStart(to, 1);
  const span = end - start;
  const pct = (x: number) => ((x - start) / span) * 100;

  const months: CalendarMonth[] = [];
  for (let m = start, i = 0; m < end && i < 120; i += 1) {
    const next = monthStart(m + 15 * DAY, 1);
    const d = new Date(m + ALGIERS_OFFSET_MS);
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      leftPct: pct(m),
      widthPct: pct(next) - pct(m),
    });
    m = next;
  }

  const bars: CalendarBar[] = overrides.map((o) => {
    const a = o.starts_at ? ms(o.starts_at) : start;
    const b = o.ends_at ? ms(o.ends_at) : end;
    const left = pct(Math.max(a, start));
    const width = Math.max(pct(Math.min(b, end)) - left, 1.5);
    const tone: CalendarTone = o.status === "scheduled" ? "scheduled" : o.status === "active" ? "active" : "ended";
    return { override: o, leftPct: left, widthPct: width, openStart: !o.starts_at, openEnd: !o.ends_at, tone };
  });

  return { start, end, months, todayPct: pct(t), bars };
}

// ---- plain-language summary --------------------------------------------------------

export type SummaryScope = {
  service?: string | null;
  wilaya_code?: string | null;
  partnerKind?: "merchant" | "agent" | null;
  partnerName?: string | null;
};

export type SummaryParts = {
  who: { partner: { kind: "merchant" | "agent"; name: string } | null; service: string | null; wilaya: string | null };
  key: PricingKey;
  before: string;
  after: string;
  /** Window variant to pick the sentence from. */
  window: "none" | "from" | "until" | "both";
  from: string | null;
  until: string | null;
  /** After the end the previous value applies again. */
  reverts: boolean;
  /** Merchant / agent scopes notify the partner when the override is created. */
  notify: boolean;
};

/**
 * Structured pieces of "Merchant X will pay 3% instead of 5% from 1 Nov to 31 Dec, then
 * go back to 5%." `before` / `after` are already-formatted values; the component turns the
 * parts into a sentence with i18n (no price math here). A start in the past counts as none.
 */
export function summaryParts(input: {
  fee: Pick<Fee, "key">;
  scope: SummaryScope;
  before: string;
  after: string;
  window: { starts_at: string | null; ends_at: string | null };
  now: Date;
}): SummaryParts {
  const { fee, scope, before, after, now } = input;
  const t = now.getTime();
  const from = input.window.starts_at && ms(input.window.starts_at) > t ? input.window.starts_at : null;
  const until = input.window.ends_at;
  const win = from && until ? "both" : from ? "from" : until ? "until" : "none";
  const partner = scope.partnerKind && scope.partnerName ? { kind: scope.partnerKind, name: scope.partnerName } : null;
  return {
    who: { partner, service: scope.service || null, wilaya: scope.wilaya_code || null },
    key: fee.key,
    before,
    after,
    window: win,
    from,
    until,
    reverts: !!until,
    notify: !!partner,
  };
}
