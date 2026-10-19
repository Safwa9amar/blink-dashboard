import type { StaffRole } from "@/lib/auth/access";

/** i18n keys under `assistant.starters.*` — four per role. */
export const STARTER_KEYS: Record<StaffRole, readonly string[]> = {
  super_admin: ["attention", "orders_by_status", "cash_today", "waiting_conversations"],
  ops_admin: ["attention", "orders_by_status", "active_trips", "find_user"],
  finance_admin: ["cash_today", "cash_by_type", "pending_withdrawals", "merchant_dues"],
  support_admin: ["waiting_conversations", "open_tickets", "csat_week", "find_user"],
  commerce_admin: ["stores_review", "products_review", "packs_review", "top_stores"],
  hr_admin: ["find_user", "new_users_week", "riders_pending", "agents_pending"],
};

export function startersFor(role: StaffRole): readonly string[] {
  return STARTER_KEYS[role] ?? STARTER_KEYS.ops_admin;
}
