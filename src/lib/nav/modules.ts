// Single source of truth for dashboard navigation: modules (rail), their pages
// (module menu), breadcrumbs, ⌘K page index and role visibility. URLs are the
// existing /d routes; page labels reuse `sidebar.<key>`, module labels live in
// `shell.modules.<key>.{name,description}`.
import { canAccessPath, type StaffRole } from "@/lib/auth/access";

export type ModuleKey =
  | "home" | "operations" | "customers" | "partners" | "catalog"
  | "marketing" | "finance" | "people" | "analytics" | "system";

export type AttentionKey =
  | "storesPending" | "productsPending" | "packsPending" | "duesOutstanding"
  | "deletionPending" | "supportUnread" | "alertsOpen";

export type AttentionCounts = Partial<Record<AttentionKey, number>>;

export interface NavPage { key: string; href: string; icon: string; attention?: AttentionKey[] }
export interface NavModule { key: ModuleKey; icon: string; pages: NavPage[] }
export interface CreateAction { key: string; href: string; icon: string }

export const MODULES: readonly NavModule[] = [
  { key: "home", icon: "grid", pages: [{ key: "overview", href: "/", icon: "grid" }] },
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
      { key: "support", href: "/support", icon: "chat", attention: ["supportUnread"] },
      { key: "deletion_requests", href: "/deletion-requests", icon: "trash", attention: ["deletionPending"] },
    ],
  },
  {
    key: "partners", icon: "store", pages: [
      { key: "merchants", href: "/merchants", icon: "store" },
      { key: "riders", href: "/riders", icon: "bike" },
      { key: "agents", href: "/agents", icon: "users" },
      { key: "agent_shops", href: "/agent-shops", icon: "pin" },
      { key: "vehicles", href: "/vehicles", icon: "truck" },
      { key: "verification", href: "/verification", icon: "shield", attention: ["storesPending"] },
    ],
  },
  {
    key: "catalog", icon: "package", pages: [
      { key: "marketplace", href: "/marketplace", icon: "store" },
      { key: "library", href: "/library", icon: "package" },
      { key: "pricing", href: "/merchant-pricing", icon: "tag", attention: ["productsPending"] },
      { key: "packs", href: "/packs-management", icon: "gift", attention: ["packsPending"] },
    ],
  },
  {
    key: "marketing", icon: "megaphone", pages: [
      { key: "promotions", href: "/promotions", icon: "gift" },
      { key: "coupons", href: "/coupons", icon: "ticket" },
      { key: "news", href: "/news", icon: "newspaper" },
      { key: "notifications", href: "/notifications", icon: "bell" },
      { key: "email", href: "/email", icon: "mail" },
      { key: "deep_links", href: "/deep-links", icon: "link" },
    ],
  },
  { key: "finance", icon: "wallet", pages: [{ key: "blink_cash", href: "/blink-cash", icon: "wallet", attention: ["duesOutstanding"] }] },
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
