// Issue-coupon form model + validation (shared by the client form and the server action).
import type { CouponDiscountType } from "./types";

export interface IssueValues {
  userId: string;
  mode: "promotion" | "custom";
  promotionId: string;
  code: string;
  note: string;
  title: string;
  art: string;
  discount_type: CouponDiscountType;
  discount_value: string;
  min_order: string;
  max_discount: string;
  /** ISO string (client converts the date input). */
  expires_at: string;
}

export const EMPTY_ISSUE: IssueValues = {
  userId: "",
  mode: "promotion",
  promotionId: "",
  code: "",
  note: "",
  title: "",
  art: "others",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_discount: "",
  expires_at: "",
};

export type IssueErrors = Partial<Record<keyof IssueValues, string>>;

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export function validateIssue(v: IssueValues, now: Date = new Date()): IssueErrors {
  const e: IssueErrors = {};
  if (!v.userId) e.userId = "customer_required";
  if (!/^[A-Z0-9]{4,16}$/.test(v.code.trim().toUpperCase())) e.code = "code_format";
  if (v.mode === "promotion") {
    if (!v.promotionId) e.promotionId = "promotion_required";
    return e;
  }
  if (!v.title.trim()) e.title = "title_required";
  if (v.discount_type !== "free_delivery") {
    const d = num(v.discount_value);
    if (!Number.isFinite(d) || d <= 0) e.discount_value = "value_positive";
    else if (v.discount_type === "percent" && d > 100) e.discount_value = "percent_max";
  }
  if (v.min_order.trim() !== "" && !(num(v.min_order) >= 0)) e.min_order = "min_order_negative";
  if (v.max_discount.trim() !== "" && !(num(v.max_discount) > 0)) e.max_discount = "cap_positive";
  const exp = v.expires_at ? new Date(v.expires_at).getTime() : NaN;
  if (Number.isNaN(exp)) e.expires_at = "expiry_required";
  else if (exp <= now.getTime()) e.expires_at = "expiry_future";
  return e;
}
