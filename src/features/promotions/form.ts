// Promotion form model: string-valued form state, validation (shared by the client
// form and the server action) and the mapping to / from a `promotions` row.
import type { DiscountType, PromotionAction, PromotionKind, PromotionRow } from "./types";

export const CATEGORIES = ["RIDES", "FOOD", "SUPERMARKET", "MARKET", "COSMETICS", "PARCELS"] as const;
/** Fallback Top Deals chips when no deal exists yet. */
export const DEFAULT_DEAL_CATEGORIES = ["Food & Drinks", "Grocery", "Fashion", "Beauty"];

/**
 * Category to use after switching `kind`: keep the current value when it is valid for the
 * new kind (promo: one of CATEGORIES; deal: non-empty free text that is not a promo code),
 * otherwise a default (promo: MARKET; deal: first suggestion).
 */
export function categoryForKind(kind: PromotionKind, current: string, suggestions: string[] = []): string {
  const isCode = (CATEGORIES as readonly string[]).includes(current);
  if (kind === "promo") return isCode ? current : "MARKET";
  if (current.trim() !== "" && (!isCode || suggestions.includes(current))) return current;
  return (suggestions.length ? suggestions : DEFAULT_DEAL_CATEGORIES)[0];
}

export const KINDS: PromotionKind[] = ["promo", "deal"];
export const ACTIONS: PromotionAction[] = ["activate", "copy", "claim", "view"];
export const DISCOUNT_TYPES: DiscountType[] = ["percent", "fixed", "free_delivery"];
export const INFO_ICONS = ["time", "bike", "gift", "star", "flame", "tag"] as const;

export interface PromotionFormValues {
  kind: PromotionKind;
  category: string;
  title: string;
  subtitle: string;
  image_url: string;
  code: string;
  action: PromotionAction;
  badge_text: string;
  badge_color: string;
  value_text: string;
  info_text: string;
  info_icon: string;
  store_id: string;
  discount_type: DiscountType;
  discount_value: string;
  min_order: string;
  max_discount: string;
  valid_days: string;
  /** ISO string or datetime-local text; empty = none. */
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  sort_order: string;
  max_coupons: string;
  discount_budget: string;
}

export const DEFAULT_FORM: PromotionFormValues = {
  kind: "promo",
  category: "MARKET",
  title: "",
  subtitle: "",
  image_url: "",
  code: "",
  action: "activate",
  badge_text: "",
  badge_color: "#EE335F",
  value_text: "",
  info_text: "",
  info_icon: "",
  store_id: "",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_discount: "",
  valid_days: "30",
  starts_at: "",
  ends_at: "",
  is_active: true,
  sort_order: "0",
  max_coupons: "",
  discount_budget: "",
};

/** Error messages are i18n keys under `promotions.form.errors.*`. */
export type FormErrors = Partial<Record<keyof PromotionFormValues, string>>;

const num = (s: string): number => (s.trim() === "" ? NaN : Number(s));
const blank = (s: string) => s.trim() === "";
const time = (s: string) => new Date(s).getTime();

export function validatePromotionForm(v: PromotionFormValues): FormErrors {
  const e: FormErrors = {};
  if (blank(v.title)) e.title = "title_required";
  if (blank(v.category)) e.category = "category_required";

  if (v.discount_type !== "free_delivery") {
    const d = num(v.discount_value);
    if (!Number.isFinite(d) || d <= 0) e.discount_value = "value_positive";
    else if (v.discount_type === "percent" && d > 100) e.discount_value = "percent_max";
  }

  if (!blank(v.min_order)) {
    const m = num(v.min_order);
    if (!Number.isFinite(m) || m < 0) e.min_order = "min_order_negative";
  }
  if (!blank(v.max_discount)) {
    const m = num(v.max_discount);
    if (!Number.isFinite(m) || m <= 0) e.max_discount = "cap_positive";
  }

  const days = num(v.valid_days);
  if (!Number.isInteger(days) || days < 1) e.valid_days = "valid_days_min";

  if (!blank(v.sort_order) && !Number.isInteger(num(v.sort_order))) e.sort_order = "integer";

  if (!blank(v.max_coupons)) {
    const m = num(v.max_coupons);
    if (!Number.isInteger(m) || m <= 0) e.max_coupons = "cap_positive";
  }
  if (!blank(v.discount_budget)) {
    const m = num(v.discount_budget);
    if (!Number.isFinite(m) || m <= 0) e.discount_budget = "cap_positive";
  }

  if (!blank(v.starts_at) && Number.isNaN(time(v.starts_at))) e.starts_at = "date_invalid";
  if (!blank(v.ends_at) && Number.isNaN(time(v.ends_at))) e.ends_at = "date_invalid";
  if (!e.starts_at && !e.ends_at && !blank(v.starts_at) && !blank(v.ends_at) && time(v.ends_at) <= time(v.starts_at)) {
    e.ends_at = "ends_after_starts";
  }

  if (v.action === "copy" && blank(v.code)) e.code = "code_required_copy";
  if (!blank(v.code) && !/^[A-Z0-9_-]{3,24}$/.test(v.code.trim().toUpperCase())) e.code = "code_format";
  if (!blank(v.badge_color) && !/^#[0-9a-fA-F]{6}$/.test(v.badge_color.trim())) e.badge_color = "color_format";

  return e;
}

export type PromotionWrite = Omit<
  PromotionRow,
  "id" | "archived_at" | "created_by" | "created_at" | "updated_at"
>;

const orNull = (s: string): string | null => (blank(s) ? null : s.trim());

/** Form values → DB columns. Call only after `validatePromotionForm` returned no errors. */
export function formToWrite(v: PromotionFormValues): PromotionWrite {
  const free = v.discount_type === "free_delivery";
  return {
    kind: v.kind,
    category: v.category.trim(),
    title: v.title.trim(),
    subtitle: v.subtitle.trim(),
    image_url: v.image_url.trim(),
    code: orNull(v.code)?.toUpperCase() ?? null,
    action: v.action,
    badge_text: orNull(v.badge_text),
    badge_color: orNull(v.badge_color),
    value_text: orNull(v.value_text),
    info_text: orNull(v.info_text),
    info_icon: orNull(v.info_icon),
    store_id: orNull(v.store_id),
    discount_type: v.discount_type,
    discount_value: free ? 0 : num(v.discount_value),
    min_order: blank(v.min_order) ? 0 : num(v.min_order),
    max_discount: blank(v.max_discount) ? null : num(v.max_discount),
    valid_days: num(v.valid_days),
    starts_at: blank(v.starts_at) ? null : new Date(v.starts_at).toISOString(),
    ends_at: blank(v.ends_at) ? null : new Date(v.ends_at).toISOString(),
    is_active: v.is_active,
    sort_order: blank(v.sort_order) ? 0 : num(v.sort_order),
    max_coupons: blank(v.max_coupons) ? null : num(v.max_coupons),
    discount_budget: blank(v.discount_budget) ? null : num(v.discount_budget),
  };
}

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

/** `Date` → `YYYY-MM-DDTHH:mm` in the browser's local zone (for datetime-local inputs). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function rowToForm(r: PromotionRow): PromotionFormValues {
  return {
    kind: r.kind,
    category: r.category,
    title: r.title,
    subtitle: r.subtitle,
    image_url: r.image_url,
    code: r.code ?? "",
    action: r.action,
    badge_text: r.badge_text ?? "",
    badge_color: r.badge_color ?? "",
    value_text: r.value_text ?? "",
    info_text: r.info_text ?? "",
    info_icon: r.info_icon ?? "",
    store_id: r.store_id ?? "",
    discount_type: r.discount_type,
    discount_value: s(r.discount_value),
    min_order: s(r.min_order),
    max_discount: s(r.max_discount),
    valid_days: s(r.valid_days),
    starts_at: toLocalInput(r.starts_at),
    ends_at: toLocalInput(r.ends_at),
    is_active: r.is_active,
    sort_order: s(r.sort_order),
    max_coupons: s(r.max_coupons),
    discount_budget: s(r.discount_budget),
  };
}
