// The staff inbox's kind registry — the dashboard half of the blink-server
// `staff_notifications` feed (migration 20261019120000_staff_notifications.sql).
// The DB records a `kind` + params; this map says where each kind belongs: its page
// (which decides the staff roles that see it, through `canAccessPath`), its icon and
// its link. Copy lives in `inbox.kinds.<kind>` (src/features/inbox/locales).
//
// Pure (client- and server-safe). Adding an event = a trigger in blink-server + an
// entry here + its copy in en/fr/ar. Until then a new kind shows to super_admin
// only, with the DB's English summary.
import { canAccessPath, ROLE_ACCESS, type StaffRole } from "@/lib/auth/access";

export const INBOX_CATEGORIES = [
  "customers", "partners", "catalog", "operations", "support", "finance", "marketing", "system",
] as const;
export type InboxCategory = (typeof INBOX_CATEGORIES)[number];

export interface InboxKind {
  category: InboxCategory;
  /** DashIcon name. */
  icon: string;
  /** The page the kind belongs to: who may see it, and the link for a folded row. */
  page: string;
  /** Link for one event about `entityId`; falls back to `page`. */
  detail?: (entityId: string) => string;
  /** Folded rows read as a count ("12 new sign-ups") and link to `page`. */
  counted?: boolean;
  /** Param shown as the row's second line (a subject, a review, an error). */
  sub?: string;
}

export const INBOX_KINDS: Record<string, InboxKind> = {
  "user.signup": { category: "customers", icon: "users", page: "/users", counted: true },
  "rider.joined": { category: "partners", icon: "bike", page: "/riders", detail: (id) => `/riders/${id}`, counted: true, sub: "rider_id" },
  "rider.documents": { category: "partners", icon: "doc", page: "/riders/verification", detail: (id) => `/riders/${id}`, sub: "rider_id" },
  "merchant.joined": { category: "partners", icon: "store", page: "/merchants", counted: true, sub: "merchant_id" },
  "merchant.review": { category: "partners", icon: "store", page: "/merchants/verification", sub: "name" },
  "agent.joined": { category: "partners", icon: "users", page: "/agents", counted: true, sub: "agent_id" },
  "agent.documents": { category: "partners", icon: "doc", page: "/agents/verification", sub: "agent_id" },
  "agent.shop_review": { category: "partners", icon: "store", page: "/agents/verification", sub: "name" },
  "product.review": { category: "catalog", icon: "package", page: "/merchant-pricing/products", counted: true },
  "price.suggestion": { category: "catalog", icon: "tag", page: "/merchant-pricing", counted: true },
  "pack.review": { category: "catalog", icon: "gift", page: "/packs-management", counted: true },
  "order.canceled": { category: "operations", icon: "package", page: "/orders", counted: true },
  "order.rejected": { category: "operations", icon: "x", page: "/orders", counted: true, sub: "reason" },
  "order.low_rating": { category: "operations", icon: "star", page: "/orders", sub: "review" },
  "trip.review": { category: "operations", icon: "map", page: "/trips", sub: "name" },
  "support.waiting": { category: "support", icon: "chat", page: "/support/inbox", sub: "subject" },
  "email.inbound": { category: "support", icon: "mail", page: "/email", counted: true, sub: "subject" },
  "deletion.requested": { category: "support", icon: "trash", page: "/deletion-requests" },
  "dues.paid": { category: "finance", icon: "wallet", page: "/blink-cash/dues" },
  "payment.amount_mismatch": { category: "finance", icon: "warn", page: "/blink-cash/review" },
  "payment.unfulfilled": { category: "finance", icon: "warn", page: "/blink-cash/review" },
  "alert.fired": { category: "system", icon: "warn", page: "/blink-server/alerts", counted: true, sub: "message" },
  "campaign.sent": { category: "marketing", icon: "send", page: "/notifications" },
  "campaign.failed": { category: "marketing", icon: "warn", page: "/notifications", sub: "error" },
};

export function inboxKind(kind: string): InboxKind | undefined {
  return Object.hasOwn(INBOX_KINDS, kind) ? INBOX_KINDS[kind] : undefined;
}

/**
 * Kinds the role may see, or null for "every kind" (a role with full access, which
 * also sees kinds the dashboard doesn't know yet). An optional category narrows it.
 */
export function inboxKindsFor(role: StaffRole, category?: InboxCategory): string[] | null {
  if (ROLE_ACCESS[role] === "*" && !category) return null;
  return Object.entries(INBOX_KINDS)
    .filter(([, k]) => canAccessPath(role, k.page) && (!category || k.category === category))
    .map(([kind]) => kind);
}

/** Categories with at least one kind the role may see, in display order. */
export function inboxCategoriesFor(role: StaffRole): InboxCategory[] {
  const seen = new Set(Object.values(INBOX_KINDS).filter((k) => canAccessPath(role, k.page)).map((k) => k.category));
  return INBOX_CATEGORIES.filter((c) => seen.has(c));
}

/** Where a notification opens: the record when there's one, else the kind's page. */
export function inboxHref(item: { kind: string; entityId: string | null; count: number }): string {
  const k = inboxKind(item.kind);
  if (!k) return "/inbox";
  if (k.detail && item.entityId && !(k.counted && item.count > 1)) return k.detail(item.entityId);
  return k.page;
}
