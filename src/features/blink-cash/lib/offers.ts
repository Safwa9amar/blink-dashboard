// blink_cash_offers (spec §4): row normaliser, drawer form and validation. Pure.

export type BonusType = "fixed" | "percent";
export interface Tri {
  en: string;
  fr: string;
  ar: string;
}
export interface Offer {
  id: string;
  title: Tri;
  description: Tri;
  min_deposit: number;
  bonus_type: BonusType;
  bonus_value: number;
  max_bonus: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  per_user_limit: number;
  budget: number | null;
  used_count: number;
  used_amount: number;
}

const tri = (v: unknown): Tri => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { en: String(o.en ?? ""), fr: String(o.fr ?? ""), ar: String(o.ar ?? "") };
};
const n = (v: unknown, d = 0) => {
  const x = Number(v);
  return v !== null && v !== undefined && v !== "" && Number.isFinite(x) ? x : d;
};
const nOrNull = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const s = (v: unknown) => (typeof v === "string" && v ? v : null);

export function normalizeOffer(r: Record<string, unknown>): Offer {
  return {
    id: String(r.id),
    title: tri(r.title),
    description: tri(r.description),
    min_deposit: n(r.min_deposit),
    bonus_type: r.bonus_type === "percent" ? "percent" : "fixed",
    bonus_value: n(r.bonus_value),
    max_bonus: nOrNull(r.max_bonus),
    starts_at: s(r.starts_at),
    ends_at: s(r.ends_at),
    active: r.active === true,
    per_user_limit: n(r.per_user_limit, 1),
    budget: nOrNull(r.budget),
    used_count: n(r.used_count),
    used_amount: n(r.used_amount),
  };
}

export type OfferState = "inactive" | "scheduled" | "live" | "ended" | "exhausted";

/** Where an offer is in its life, as of `nowMs`. */
export function offerState(o: Offer, nowMs: number): OfferState {
  if (!o.active) return "inactive";
  if (o.budget !== null && o.used_amount >= o.budget) return "exhausted";
  if (o.starts_at && Date.parse(o.starts_at) > nowMs) return "scheduled";
  if (o.ends_at && Date.parse(o.ends_at) <= nowMs) return "ended";
  return "live";
}

export interface OfferForm {
  title: Tri;
  description: Tri;
  min_deposit: string;
  bonus_type: BonusType;
  bonus_value: string;
  max_bonus: string;
  /** `YYYY-MM-DDTHH:mm` (datetime-local), Algiers wall time. */
  starts_at: string;
  ends_at: string;
  per_user_limit: string;
  budget: string;
  active: boolean;
}

const ALGIERS = "+01:00";
/** Algiers wall-clock `YYYY-MM-DDTHH:mm` for an ISO instant. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + 3_600_000).toISOString().slice(0, 16);
}
const localToIso = (v: string) => {
  const t = Date.parse(`${v}:00${ALGIERS}`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

export const emptyOfferForm = (): OfferForm => ({
  title: { en: "", fr: "", ar: "" },
  description: { en: "", fr: "", ar: "" },
  min_deposit: "",
  bonus_type: "fixed",
  bonus_value: "",
  max_bonus: "",
  starts_at: "",
  ends_at: "",
  per_user_limit: "1",
  budget: "",
  active: true,
});

export const offerToForm = (o: Offer): OfferForm => ({
  title: { ...o.title },
  description: { ...o.description },
  min_deposit: String(o.min_deposit),
  bonus_type: o.bonus_type,
  bonus_value: String(o.bonus_value),
  max_bonus: o.max_bonus === null ? "" : String(o.max_bonus),
  starts_at: isoToLocalInput(o.starts_at),
  ends_at: isoToLocalInput(o.ends_at),
  per_user_limit: String(o.per_user_limit),
  budget: o.budget === null ? "" : String(o.budget),
  active: o.active,
});

export interface OfferPayload {
  title: Tri;
  description: Tri;
  min_deposit: number;
  bonus_type: BonusType;
  bonus_value: number;
  max_bonus: number | null;
  starts_at: string;
  ends_at: string;
  per_user_limit: number;
  budget: number | null;
  active: boolean;
}
export type OfferErrors = Partial<Record<"title" | "min_deposit" | "bonus_value" | "max_bonus" | "window" | "per_user_limit" | "budget", string>>;

const parse = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(/\s/g, "").replace(",", ".")));

export function validateOffer(f: OfferForm): { ok: true; payload: OfferPayload } | { ok: false; errors: OfferErrors } {
  const errors: OfferErrors = {};
  if (!f.title.en.trim() || !f.title.fr.trim() || !f.title.ar.trim()) errors.title = "err_title";
  const min_deposit = parse(f.min_deposit);
  if (!(min_deposit >= 0)) errors.min_deposit = "err_amount";
  const bonus_value = parse(f.bonus_value);
  if (!(bonus_value > 0) || (f.bonus_type === "percent" && bonus_value > 100)) errors.bonus_value = "err_bonus";
  let max_bonus: number | null = null;
  if (f.max_bonus.trim() !== "") {
    max_bonus = parse(f.max_bonus);
    if (!(max_bonus > 0)) errors.max_bonus = "err_amount";
  }
  const starts = f.starts_at ? localToIso(f.starts_at) : null;
  const ends = f.ends_at ? localToIso(f.ends_at) : null;
  if (!starts || !ends || Date.parse(ends) <= Date.parse(starts)) errors.window = "err_window";
  const per_user_limit = parse(f.per_user_limit);
  if (!Number.isInteger(per_user_limit) || per_user_limit < 1) errors.per_user_limit = "err_limit";
  let budget: number | null = null;
  if (f.budget.trim() !== "") {
    budget = parse(f.budget);
    if (!(budget > 0)) errors.budget = "err_amount";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    payload: {
      title: { en: f.title.en.trim(), fr: f.title.fr.trim(), ar: f.title.ar.trim() },
      description: { en: f.description.en.trim(), fr: f.description.fr.trim(), ar: f.description.ar.trim() },
      min_deposit,
      bonus_type: f.bonus_type,
      bonus_value,
      max_bonus: f.bonus_type === "percent" ? max_bonus : null,
      starts_at: starts as string,
      ends_at: ends as string,
      per_user_limit,
      budget,
      active: f.active,
    },
  };
}
