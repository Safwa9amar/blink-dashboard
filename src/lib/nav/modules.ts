// Single source of truth for dashboard navigation: modules (rail), their pages
// (module menu), breadcrumbs, ⌘K page index and role visibility. URLs are the
// existing /d routes; page labels reuse `sidebar.<key>`, module labels live in
// `shell.modules.<key>.{name,description}`.
import { canAccessPath, type StaffRole } from "@/lib/auth/access";

export type ModuleKey =
  | "home" | "operations" | "customers" | "support" | "partners" | "catalog"
  | "marketing" | "finance" | "people" | "analytics" | "system";

export type AttentionKey =
  | "storesPending" | "productsPending" | "packsPending" | "duesOutstanding"
  | "deletionPending" | "supportUnread" | "alertsOpen" | "ridersPending" | "agentsPending";

export type AttentionCounts = Partial<Record<AttentionKey, number>>;

export type SectionKey =
  | "conversations" | "tools" | "performance" | "requests" | "merchants" | "riders" | "agents";

export interface NavPage { key: string; href: string; icon: string; attention?: AttentionKey[]; section?: SectionKey }
export interface NavModule { key: ModuleKey; icon: string; pages: NavPage[] }
export interface CreateAction { key: string; href: string; icon: string }

export const MODULES: readonly NavModule[] = [
  {
    key: "home", icon: "grid", pages: [
      { key: "overview", href: "/", icon: "grid" },
      { key: "inbox", href: "/inbox", icon: "bell" },
    ],
  },
  {
    key: "operations", icon: "activity", pages: [
      { key: "live_ops", href: "/live-ops", icon: "activity" },
      { key: "orders", href: "/orders", icon: "package" },
      { key: "trips", href: "/trips", icon: "map" },
      { key: "demand", href: "/demand", icon: "trending" },
    ],
  },
  {
    key: "customers", icon: "users", pages: [
      { key: "customers", href: "/customers", icon: "users" },
      { key: "users", href: "/users", icon: "users" },
    ],
  },
  {
    key: "support", icon: "support", pages: [
      { key: "support_overview", href: "/support", icon: "grid" },
      { key: "support_inbox", href: "/support/inbox", icon: "chat", attention: ["supportUnread"], section: "conversations" },
      { key: "email", href: "/email", icon: "mail", section: "conversations" },
      { key: "support_tickets", href: "/support/tickets", icon: "support", section: "conversations" },
      { key: "support_kb", href: "/support/kb", icon: "doc", section: "tools" },
      { key: "support_macros", href: "/support/macros", icon: "activity", section: "tools" },
      { key: "support_ai", href: "/support/ai", icon: "sparkles", section: "tools" },
      { key: "support_csat", href: "/support/csat", icon: "star", section: "performance" },
      { key: "support_sla", href: "/support/sla", icon: "shield", section: "performance" },
      { key: "support_agents", href: "/support/agents", icon: "users", section: "performance" },
      { key: "deletion_requests", href: "/deletion-requests", icon: "trash", attention: ["deletionPending"], section: "requests" },
    ],
  },
  {
    key: "partners", icon: "store", pages: [
      { key: "merchants", href: "/merchants", icon: "store", section: "merchants" },
      { key: "merchant_verification", href: "/merchants/verification", icon: "shield", attention: ["storesPending"], section: "merchants" },
      { key: "riders", href: "/riders", icon: "bike", section: "riders" },
      { key: "rider_verification", href: "/riders/verification", icon: "shield", attention: ["ridersPending"], section: "riders" },
      { key: "agents", href: "/agents", icon: "users", section: "agents" },
      { key: "agent_verification", href: "/agents/verification", icon: "shield", attention: ["agentsPending"], section: "agents" },
    ],
  },
  {
    key: "catalog", icon: "package", pages: [
      { key: "marketplace", href: "/marketplace", icon: "store" },
      { key: "library", href: "/library", icon: "package" },
      { key: "packs", href: "/packs-management", icon: "gift", attention: ["packsPending"] },
      { key: "pricing", href: "/merchant-pricing", icon: "tag", attention: ["productsPending"] },
    ],
  },
  {
    key: "marketing", icon: "megaphone", pages: [
      { key: "promotions", href: "/promotions", icon: "gift" },
      { key: "coupons", href: "/coupons", icon: "ticket" },
      { key: "news", href: "/news", icon: "newspaper" },
      { key: "notifications", href: "/notifications", icon: "bell" },
      { key: "deep_links", href: "/deep-links", icon: "link" },
    ],
  },
  {
    key: "finance", icon: "wallet", pages: [
      { key: "blink_cash", href: "/blink-cash", icon: "wallet", attention: ["duesOutstanding"] },
      { key: "pricing_config", href: "/pricing", icon: "tag" },
    ],
  },
  { key: "people", icon: "shield", pages: [{ key: "access", href: "/access", icon: "lock" }] },
  { key: "analytics", icon: "trending", pages: [] },
  {
    key: "system", icon: "server", pages: [
      { key: "blink_server", href: "/blink-server", icon: "server", attention: ["alertsOpen"] },
      { key: "settings", href: "/settings", icon: "settings2" },
    ],
  },
];

export const CREATE_ACTIONS: readonly CreateAction[] = [
  { key: "promotion", href: "/promotions/new", icon: "gift" },
  { key: "coupon", href: "/coupons/new", icon: "ticket" },
  { key: "news", href: "/news/compose", icon: "newspaper" },
  { key: "notification", href: "/notifications/compose", icon: "bell" },
  { key: "library_product", href: "/library/products/new", icon: "package" },
  { key: "help_article", href: "/support/articles/new", icon: "doc" },
];

function matches(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function resolvePath(pathname: string): { module: NavModule; page: NavPage } | null {
  let best: { module: NavModule; page: NavPage } | null = null;
  for (const mod of MODULES) {
    for (const page of mod.pages) {
      if (matches(pathname, page.href) && (!best || page.href.length > best.page.href.length)) best = { module: mod, page };
    }
  }
  return best;
}

export function visibleModules(role: StaffRole): NavModule[] {
  return MODULES.map((m) => ({ ...m, pages: m.pages.filter((p) => canAccessPath(role, p.href)) })).filter(
    (m) => m.pages.length > 0
  );
}

export function pageCount(page: NavPage, counts: AttentionCounts): number {
  return (page.attention ?? []).reduce((sum, k) => sum + (counts[k] ?? 0), 0);
}

export function moduleHasAttention(module: NavModule, counts: AttentionCounts): boolean {
  return module.pages.some((p) => pageCount(p, counts) > 0);
}
