# ERP Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace blink-dashboard's role-grouped sidebar with the module-workspace shell (icon rail + module menu + top bar), a real-data Home, ⌘K search, and a restyled UI kit, as specified in `docs/superpowers/specs/2026-10-11-erp-shell-redesign-design.md`.

**Architecture:** One pure navigation config (`src/lib/nav/modules.ts`) drives the rail, menu, breadcrumbs, ⌘K and role visibility. URLs and routes do not move. Server-only loaders in `src/lib/shell/` feed attention counts and search. The UI kit is restyled behind unchanged props.

**Tech Stack:** Next.js 16.2 App Router (read `node_modules/next/dist/docs/` before using any Next API), React 19, Tailwind v4 (`@theme inline` in `globals.css`), next-intl 4, Supabase (`createAdminClient` from `@/lib/supabase/admin`), Vitest (added here).

**Execution model (budget-constrained, user request):** Sonnet subagents in parallel, **no per-task review loops**, one batched review at the end. Full code is given for logic-bearing units (config, helpers, tests). UI tasks give exact files, contracts and acceptance checks, and the spec + mockup define the look.

---

## Rules for every agent

- **Working dir:** `/Users/hamzasafwan/blink-dashboard-erp-shell` (branch `feat/erp-shell`). Never touch `/Users/hamzasafwan/blink-dashboard` (that checkout has someone's uncommitted work).
- **Do NOT commit.** The orchestrator commits each workstream. Do not run `git add`, `git commit`, `git stash` or `git checkout`.
- **Edit only files your workstream owns** (listed per task). If you need a change elsewhere, say so in your final report instead of making it.
- Follow `CLAUDE.md` in the repo (feature-first layout, page triad, co-located locales, `@/` imports).
- Colors come only from tokens (`bg-card`, `text-subtext`, `border-border`, `bg-primary`, new `bg-rail` …). No hex in components.
- RTL: logical utilities only (`ms-/me-/ps-/pe-/start-/end-/border-e/border-s`, `rtl:rotate-180` for chevrons).
- Every user-visible string goes through next-intl in **en, fr and ar**.
- Mockup reference (look and feel): `/Users/hamzasafwan/blink-dashboard/.superpowers/brainstorm/7855-1791726828/content/redesign-directions.html` (direction A) and `theme-default.html`.
- Before finishing, run `npx tsc --noEmit -p .` and `npm run lint`, and report results. Run `npm test` if your workstream touches tested code.

## File ownership

| Workstream | Phase | Owns |
|---|---|---|
| **W1 Foundation** | A | `package.json`, `package-lock.json`, `vitest.config.ts`, `src/lib/nav/**`, `src/i18n/messages/{en,fr,ar}.json` |
| **W2 Restyle** | A | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/theme-switcher.tsx`, `src/lib/theme.ts`, `src/components/ui/**` |
| **W3 Shell** | B | `src/components/shell/**`, `src/components/dashboard-shell.tsx`, `src/components/sidebar.tsx` (delete), `src/app/d/layout.tsx`, `src/lib/auth/access.ts` (comment only), `src/i18n/messages/{en,fr,ar}.json` (add-only under `shell`), `CLAUDE.md` |
| **W4 Data & Search** | B | `src/lib/shell/**`, `src/features/search/**`, `src/features/overview/**`, `src/app/d/page.tsx`, `src/app/d/client.tsx`, `src/i18n/messages.ts` (register `search` locales only) |

Phase B starts only after Phase A is committed.

## Shared contracts (W1 creates; W3/W4 consume, do not change)

```ts
// src/lib/nav/modules.ts
import type { StaffRole } from "@/lib/auth/access";

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

export const MODULES: readonly NavModule[];
export const CREATE_ACTIONS: readonly CreateAction[];
export function resolvePath(pathname: string): { module: NavModule; page: NavPage } | null;
export function visibleModules(role: StaffRole): NavModule[];
export function pageCount(page: NavPage, counts: AttentionCounts): number;
export function moduleHasAttention(module: NavModule, counts: AttentionCounts): boolean;
```

```ts
// src/lib/nav/ref-range.ts
export type RefMatch = { exact: string } | { gte: string; lte: string };
export function refToRange(input: string): RefMatch | null;
```

```ts
// src/lib/shell/attention.ts  (W4, server-only)
export async function getAttentionCounts(role: StaffRole): Promise<AttentionCounts>;

// src/lib/shell/actions.ts  (W4, "use server")
export async function refreshAttention(): Promise<AttentionCounts>;
export async function searchRecords(q: string): Promise<SearchGroup[]>;
export async function getRecord(kind: RecordKind, id: string): Promise<RecordDetail | null>;
// SearchGroup / RecordKind / RecordDetail are exported from src/lib/shell/search-types.ts (W4)

// src/features/search/index.ts  (W4, client)
export function CommandPalette(props: { open: boolean; onOpenChange: (open: boolean) => void; staffRole: StaffRole }): JSX.Element;
// CommandPalette registers its own ⌘K / Ctrl+K listener and calls onOpenChange(true).
```

W3 builds against these signatures before W4 finishes. If W4's file doesn't exist yet when W3 type-checks, W3 reports it and moves on; the final review verifies the whole thing.

---

## Phase A

### Task 1 (W1): Vitest

**Files:** Modify `package.json`; Create `vitest.config.ts`

- [ ] **Step 1:** `npm i -D vitest@^3` (Node 20 is in use).
- [ ] **Step 2:** Add the script `"test": "vitest run"`.
- [ ] **Step 3:** Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4:** `npm test` → "No test files found" (exit 1 is OK at this point).

### Task 2 (W1): Navigation config

**Files:** Create `src/lib/nav/modules.ts`, `src/lib/nav/modules.test.ts`

- [ ] **Step 1: Write the failing tests** (`src/lib/nav/modules.test.ts`):

```ts
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MODULES, CREATE_ACTIONS, resolvePath, visibleModules, pageCount, moduleHasAttention } from "./modules";
import { STAFF_ROLES } from "@/lib/auth/access";

const routeFile = (href: string) => join(process.cwd(), "src/app/d", href === "/" ? "" : href, "page.tsx");
const locale = (l: string) => JSON.parse(readFileSync(join(process.cwd(), `src/i18n/messages/${l}.json`), "utf8"));

describe("MODULES", () => {
  it("every page href has a route", () => {
    for (const m of MODULES) for (const p of m.pages) expect(existsSync(routeFile(p.href)), p.href).toBe(true);
  });
  it("every create action has a route", () => {
    for (const a of CREATE_ACTIONS) expect(existsSync(routeFile(a.href)), a.href).toBe(true);
  });
  it("has the 29 pages of the old sidebar, no duplicates", () => {
    const hrefs = MODULES.flatMap((m) => m.pages.map((p) => p.href));
    expect(hrefs).toHaveLength(29);
    expect(new Set(hrefs).size).toBe(29);
  });
  it.each(["en", "fr", "ar"])("labels exist in %s", (l) => {
    const msg = locale(l);
    for (const m of MODULES) {
      expect(msg.shell.modules[m.key].name, `${l} module ${m.key}`).toBeTruthy();
      expect(msg.shell.modules[m.key].description, `${l} module ${m.key} desc`).toBeTruthy();
      for (const p of m.pages) expect(msg.sidebar[p.key], `${l} sidebar.${p.key}`).toBeTruthy();
    }
    for (const a of CREATE_ACTIONS) expect(msg.shell.create[a.key], `${l} shell.create.${a.key}`).toBeTruthy();
  });
});

describe("resolvePath", () => {
  it.each([
    ["/", "home", "/"],
    ["/blink-cash", "finance", "/blink-cash"],
    ["/blink-cash/dues", "finance", "/blink-cash"],
    ["/news/compose", "marketing", "/news"],
    ["/access/roles", "people", "/access"],
    ["/library/products/abc", "catalog", "/library"],
  ])("%s → %s", (path, mod, href) => {
    const r = resolvePath(path);
    expect(r?.module.key).toBe(mod);
    expect(r?.page.href).toBe(href);
  });
  it("unknown path → null", () => {
    expect(resolvePath("/test")).toBeNull();
    expect(resolvePath("/ordersx")).toBeNull();
  });
});

describe("visibleModules", () => {
  const keys = (r: (typeof STAFF_ROLES)[number]) => visibleModules(r).map((m) => m.key);
  it("super_admin sees all modules with pages", () => {
    expect(keys("super_admin")).toEqual(["home", "operations", "customers", "partners", "catalog", "marketing", "finance", "people", "system"]);
  });
  it("finance_admin sees Home and Finance", () => expect(keys("finance_admin")).toEqual(["home", "finance"]));
  it("support_admin", () => expect(keys("support_admin")).toEqual(["home", "customers", "marketing"]));
  it("never shows analytics while it has no pages", () => {
    for (const r of STAFF_ROLES) expect(keys(r)).not.toContain("analytics");
  });
  it("filters pages inside a module", () => {
    const customers = visibleModules("support_admin").find((m) => m.key === "customers")!;
    expect(customers.pages.map((p) => p.href)).toEqual(["/support", "/deletion-requests"]);
  });
});

describe("attention", () => {
  const verification = MODULES.flatMap((m) => m.pages).find((p) => p.href === "/verification")!;
  it("pageCount sums the page's keys", () => {
    expect(pageCount(verification, { storesPending: 3, supportUnread: 9 })).toBe(3);
    expect(pageCount(verification, {})).toBe(0);
  });
  it("moduleHasAttention", () => {
    const partners = MODULES.find((m) => m.key === "partners")!;
    expect(moduleHasAttention(partners, { storesPending: 1 })).toBe(true);
    expect(moduleHasAttention(partners, { supportUnread: 4 })).toBe(false);
  });
});
```

- [ ] **Step 2:** `npm test` → FAIL (module not found).
- [ ] **Step 3: Implement** `src/lib/nav/modules.ts` (pure: no React, no server imports):

```ts
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
  for (const module of MODULES) {
    for (const page of module.pages) {
      if (matches(pathname, page.href) && (!best || page.href.length > best.page.href.length)) best = { module, page };
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
```

- [ ] **Step 4:** `npm test` → the label tests still fail until Task 4. Everything else passes.

### Task 3 (W1): Reference → uuid range

**Files:** Create `src/lib/nav/ref-range.ts`, `src/lib/nav/ref-range.test.ts`

- [ ] **Step 1: Tests:**

```ts
import { describe, it, expect } from "vitest";
import { refToRange } from "./ref-range";

describe("refToRange", () => {
  it("8-char app reference → id range", () => {
    expect(refToRange("3F2A9C1B")).toEqual({
      gte: "3f2a9c1b-0000-0000-0000-000000000000",
      lte: "3f2a9c1b-ffff-ffff-ffff-ffffffffffff",
    });
  });
  it("accepts a leading # and whitespace", () => expect(refToRange("  #3f2a9c1b ")).toEqual(refToRange("3F2A9C1B")));
  it("full uuid → exact", () => {
    const id = "3f2a9c1b-1234-4abc-8def-0123456789ab";
    expect(refToRange(id.toUpperCase())).toEqual({ exact: id });
  });
  it("rejects short, non-hex or other shapes", () => {
    for (const q of ["3f2a9c1", "zzzzzzzz", "3f2a9c1b-12", "", "pizza"]) expect(refToRange(q), q).toBeNull();
  });
});
```

- [ ] **Step 2: Implement:**

```ts
// The apps show references as `id.slice(0, 8).toUpperCase()`. Turn that (or a full
// uuid) into a filter usable on a uuid primary key without casts or migrations.
export type RefMatch = { exact: string } | { gte: string; lte: string };

const FULL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHORT = /^[0-9a-f]{8}$/;

export function refToRange(input: string): RefMatch | null {
  const q = input.trim().replace(/^#/, "").toLowerCase();
  if (FULL.test(q)) return { exact: q };
  if (SHORT.test(q)) return { gte: `${q}-0000-0000-0000-000000000000`, lte: `${q}-ffff-ffff-ffff-ffffffffffff` };
  return null;
}
```

- [ ] **Step 3:** `npx vitest run src/lib/nav/ref-range.test.ts` → PASS.

### Task 4 (W1): i18n keys

**Files:** Modify `src/i18n/messages/{en,fr,ar}.json`

- [ ] **Step 1:** Rename values (all 3 locales): `sidebar.users` → "All accounts" / "Tous les comptes" / "كل الحسابات"; `sidebar.library` → "Product library" / "Catalogue produits" / "مكتبة المنتجات"; `sidebar.pricing` → "Merchant pricing" / "Tarifs marchands" / "تسعير التجار".
- [ ] **Step 2:** Add a top-level `shell` namespace. The English values are below; write natural fr and ar equivalents with the same keys:

```json
"shell": {
  "admin": "Admin",
  "modules": {
    "home": { "name": "Home", "description": "Start of the day: key numbers and everything waiting on you." },
    "operations": { "name": "Operations", "description": "What is happening on the ground right now." },
    "customers": { "name": "Customers", "description": "The people who order and ride, and the help they get." },
    "partners": { "name": "Partners", "description": "Merchants, riders and agents who work with Blink." },
    "catalog": { "name": "Catalog", "description": "What is sold on Blink and at what price." },
    "marketing": { "name": "Marketing", "description": "Bring customers in and keep them coming back." },
    "finance": { "name": "Finance", "description": "Money moving through Blink." },
    "people": { "name": "People", "description": "Blink staff and their permissions." },
    "analytics": { "name": "Analytics", "description": "Reports and trends across the business." },
    "system": { "name": "System", "description": "Platform health and global settings." }
  },
  "create": {
    "button": "Create",
    "promotion": "Promotion", "coupon": "Coupon", "news": "News post",
    "notification": "Push notification", "library_product": "Library product", "help_article": "Help article"
  },
  "topbar": { "search_placeholder": "Search orders, people, stores…", "open_menu": "Open menu", "close_menu": "Close menu" },
  "nav": { "collapse": "Collapse menu", "expand": "Expand menu", "modules": "Modules", "waiting": "{count} waiting" },
  "staff_menu": {
    "signed_in_as": "Signed in as", "sign_out": "Sign out",
    "roles": { "super_admin": "Super admin", "ops_admin": "Operations admin", "finance_admin": "Finance admin", "support_admin": "Support admin", "commerce_admin": "Commerce admin", "hr_admin": "HR admin" }
  },
  "breadcrumbs": { "label": "Breadcrumb" }
}
```

- [ ] **Step 3:** Delete the now-unused `sidebar` keys `platform`, `commerce`, `money`, `operations`, `people`, `system`, `transactions`, `no_menu_match`, `search_menu`, `collapse_sidebar`, `expand_sidebar`, **only after** `grep -rn "\"<key>\"\|'<key>'\|t(\"<key>\")" src` shows no use outside `sidebar.tsx` (which W3 deletes). If a key is still used, keep it and report it.
- [ ] **Step 4:** `npm test` → all W1 tests PASS. Validate the JSON with `node -e "for (const l of ['en','fr','ar']) JSON.parse(require('fs').readFileSync('src/i18n/messages/'+l+'.json','utf8'))"`.

### Task 5 (W2): Tokens and default theme

**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/theme-switcher.tsx`, `src/lib/theme.ts`

- [ ] **Step 1:** In `globals.css`, set the token values from spec §8.1 for `[data-theme="light"]` and the dark block, and add `--rail`, `--rail-text`, `--rail-active` (both themes) plus `--color-rail`, `--color-rail-text`, `--color-rail-active` in `@theme inline`. Retune the status tokens to the mockup values (light: success `#059669`/`#ECFDF5`, warning `#B45309`/`#FFFBEB`, danger `#DC2626`/`#FEF2F2`, info `#2563EB`/`#EFF6FF`; dark: `#34D399`, `#FBBF24`, `#F87171`, `#60A5FA` with ~12% alpha `-light`).
- [ ] **Step 2:** Make **light** the default. The selector that applies with no `data-theme` must be the light block, and the pre-paint script in `src/app/layout.tsx` and the `ThemeSwitcher` fallback must treat "no saved value" as `light`. A saved value still wins. Keep `src/lib/theme.ts` in sync if it mirrors these tokens.
- [ ] **Step 3:** Under `/d` only, use Inter (already loaded in the root layout; reuse its CSS variable) and add a `.tabular` utility (`font-variant-numeric: tabular-nums`). The landing site's fonts and `landing.css` must not change.
- [ ] **Step 4:** `npm run lint`, `npx tsc --noEmit -p .`.

### Task 6 (W2): UI-kit restyle

**Files:** `src/components/ui/{page-header,stat-card,stat-grid,card,data-table,button,badge,sub-tabs,sub-nav,filter-pills,search-box,segmented,toolbar,modal,empty-state,skeleton,toggle,form-row,lang-tabs,legend,chart-head,chart-theme}.tsx|ts`

- [ ] **Step 1:** Record the public surface first: `grep -n "^export" src/components/ui/*.ts*` > `/tmp/ui-exports-before.txt`, plus every `interface …Props` block.
- [ ] **Step 2:** Restyle per spec §8.2: 8px controls / 12px cards / full pills; 4px spacing scale; StatCard neutral surface with variant color only on the icon chip, value-trend and label tint; DataTable sticky header (`bg-card-hover`, 11px uppercase `text-subtext`), 40px rows, row hover, pagination footer "1–8 of N" via existing translations or a new key in `common` (ask: `common` lives in W1's JSON, so reuse existing strings or report the need); buttons primary/secondary/ghost at 34px; tabs as an underline strip; `tabular` on numeric cells and stat values; `chart-theme` colors from tokens.
- [ ] **Step 3:** **No prop, export or behavior changes.** Diff the exports against Step 1 and fix any change.
- [ ] **Step 4:** `npm run lint`, `npx tsc --noEmit -p .`. Report any page that needed (but didn't get) a page-level fix.

**Orchestrator after Phase A:** commit W1 (`feat(nav): module config, ref lookup, shell i18n, vitest`) and W2 (`style(ui): ERP restyle tokens and kit, light default`).

---

## Phase B

### Task 7 (W4): Attention counts

**Files:** Create `src/lib/shell/attention.ts`, `src/lib/shell/search-types.ts`

- [ ] Implement `getAttentionCounts(role)` per spec §7.2, `import "server-only"` if the repo uses it (check), with `createAdminClient()` and `head: true, count: "exact"` count queries:
  - `stores.status = 'under_review'`
  - `store_products.review_status = 'pending'`
  - `store_packs.status = 'under_review'`
  - `account_deletion_requests.status = 'pending'`
  - `support_conversations.unread_for_staff > 0`
  - `alert_events.resolved_at is null`
  - dues: reuse the loader in `src/app/d/blink-cash/data.ts` (count `outstanding > 0`)
- [ ] Only compute keys whose page passes `canAccessPath(role, page.href)` (find the page via `MODULES`). Use `Promise.allSettled`; a rejected source leaves its key `undefined` and `console.error`s.

### Task 8 (W4): Search actions

**Files:** Create `src/lib/shell/search.ts`, `src/lib/shell/actions.ts`; extend `search-types.ts`

- [ ] `search-types.ts`:

```ts
export type RecordKind = "order" | "transaction" | "person" | "store";
export interface SearchHit { kind: RecordKind; id: string; title: string; subtitle: string; ref?: string }
export interface SearchGroup { kind: RecordKind; hits: SearchHit[] }
export interface RecordDetail { kind: RecordKind; id: string; title: string; fields: { label: string; value: string }[]; listHref: string }
```

- [ ] `actions.ts` (`"use server"`): every action calls `getCurrentStaffRole()` first and returns empty/null when there is no role.
  - `refreshAttention()` → `getAttentionCounts(role)`.
  - `searchRecords(q)` → if `q.trim().length < 2` return `[]`; for each group whose list page the role can access (orders → `/orders`, transactions → `/blink-cash`, person → `/users`, store → `/merchants`) run at most 5 rows. Orders and transactions use `refToRange(q)` (`.eq("id", exact)` or `.gte/.lte`). People use `.or()` over `first_name`, `last_name`, `phone_number`, `email` with `ilike` (escape `%` and `_` in q). Stores use `name ilike`. Return the non-empty groups in that order.
  - `getRecord(kind, id)` → the fields from spec §7.3, `listHref` = the group's page. Labels are translation keys resolved client-side (`search.fields.*`).

### Task 9 (W4): Home page

**Files:** `src/app/d/page.tsx`, `src/app/d/client.tsx`, `src/features/overview/**` (components + locales; add an `index.ts` barrel if missing)

- [ ] Server `page.tsx` per spec §7.1. "Today" is midnight in `Africa/Algiers` (compute the ISO bound server-side). Each block is gated by `canAccessPath(role, href)`. Use `Promise.allSettled`, and each block receives `{ data } | { error }`.
- [ ] `client.tsx` renders the mockup layout using **only** `@/components/ui` primitives plus small components under `src/features/overview/components/`:
  - KPI row (5);
  - "Orders, last 14 days" chart (reuse `column-chart` or an inline SVG with tokens);
  - live-operations pipeline;
  - Needs attention (each row a `Link` to its page);
  - Latest activity.
- [ ] Strings go in `src/features/overview/locales/*.json` (`overview` namespace, en/fr/ar). Delete strings that are no longer used.

### Task 10 (W4): ⌘K palette + record peek

**Files:** Create `src/features/search/{index.ts,components/command-palette.tsx,components/record-peek.tsx,locales/{en,fr,ar}.json}`; Modify `src/i18n/messages.ts` (register `search` locales)

- [ ] `CommandPalette` per spec §7.3 and the contract above. It owns the global ⌘K / Ctrl+K listener.
  - Groups: Pages (from `visibleModules(staffRole)`, matching the current-locale label **and** the en label, so import the en `sidebar` and `shell.modules` labels statically), Actions (`CREATE_ACTIONS` filtered by `canAccessPath`), then records (debounced 250ms `searchRecords`).
  - Keyboard: ↑/↓/Enter/Esc. Recent pages: last 5 in `localStorage` under `blink.cmdk.recent`, each access wrapped in try/catch.
  - Full-screen below 1024px. Uses the existing `modal` primitive if it fits, otherwise a portal with focus trap.
- [ ] `RecordPeek`: a side panel (`end-0`, so it mirrors in RTL), loads `getRecord`, shows the fields and an "Open in …" link to `listHref`.
- [ ] Locales: `search` namespace (group titles, placeholders, empty state, field labels, "Open in {page}").

### Task 11 (W3): Shell

**Files:** Create `src/components/shell/{top-bar,module-rail,module-nav,breadcrumbs,create-menu,staff-menu,mobile-drawer,attention-provider}.tsx`; Rewrite `src/components/dashboard-shell.tsx`; Modify `src/app/d/layout.tsx`; Delete `src/components/sidebar.tsx`

- [ ] `layout.tsx`: also load `getAttentionCounts(staffRole)` and the staff display name (from the signed-in `users` row: first + last name, fallback email), and pass them to `DashboardShell`. Keep the existing staff gate.
- [ ] `attention-provider.tsx`: context seeded with the server counts. Refreshes via `refreshAttention()` every 60s while `document.visibilityState === "visible"`. Exposes `useAttention()`.
- [ ] `dashboard-shell.tsx`: CSS grid of top bar + rail + module menu + content (breadcrumbs then `children`). Keep the existing `canAccessPath` redirect effect. Mount `<CommandPalette>` from `@/features/search` with `open` state shared with the top bar.
- [ ] `module-rail.tsx`:
  - 76px, `bg-rail`, `text-rail-text`;
  - one button per module from `visibleModules(staffRole)`, linking to the module's first page;
  - active = `resolvePath(pathname)?.module.key`, styled as in the mockup (pink tint, white label);
  - attention dot from `moduleHasAttention`.
- [ ] `module-nav.tsx`:
  - 232px `bg-card border-e`;
  - module name + description, then page links (active: `bg-soft-pink text-primary`), count pill from `pageCount`;
  - collapsible to width 0 with a toggle;
  - starts collapsed at 1024–1279px.
- [ ] `breadcrumbs.tsx`: `Module / Page` from `resolvePath`. The separator is a chevron with `rtl:rotate-180`. Omitted when `resolvePath` is null.
- [ ] `top-bar.tsx`: logo (`/images/logo-b.png`) + "Blink" + `shell.admin`, search trigger showing ⌘K (Ctrl K on non-Mac), `CreateMenu`, existing `LanguageSwitcher`, `ThemeSwitcher`, `NotificationBell`, `StaffMenu`. ☰ button below 1024px.
- [ ] `create-menu.tsx`: `CREATE_ACTIONS` filtered by `canAccessPath`. Hidden when empty.
- [ ] `staff-menu.tsx`: avatar initials, name, translated role, sign out (move the logic from `sidebar.tsx`: `supabase.auth.signOut()` → `/login` → `router.refresh()`).
- [ ] `mobile-drawer.tsx`: below 1024px, an overlay panel from the start edge containing rail + module menu. Closes on navigation and Esc.
- [ ] Delete `sidebar.tsx`. `grep -rn "components/sidebar" src` must be empty.

### Task 12 (W3): Docs and comments

**Files:** `CLAUDE.md`, `src/lib/auth/access.ts` (header comment only)

- [ ] `access.ts`: "route keys are the nav hrefs from `src/lib/nav/modules.ts`".
- [ ] `CLAUDE.md` "Dashboard routes": replace the sidebar group list with the module table (spec §4.1) and the rule "add a page = route triad + one entry in `src/lib/nav/modules.ts`". Mention `npm test`.

**Orchestrator after Phase B:** commit W4 (`feat(home,search): real-data Home, attention counts, ⌘K search`) and W3 (`feat(shell): module workspace layout`).

---

## Phase C

### Task 13: Batched review + fix (one agent)

- [ ] `npm test`, `npx tsc --noEmit -p .`, `npm run lint`, `npm run build` all pass. Fix what fails.
- [ ] Check against the spec, section by section (§4–§11). List every gap and fix the small ones directly. Report the larger ones.
- [ ] Contract check: signatures in "Shared contracts" match the code.
- [ ] RTL scan: `grep -rnE "\b(ml|mr|pl|pr|left|right)-" src/components/shell src/features/search src/features/overview` must be empty (except deliberate cases, commented).
- [ ] Hex scan: `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/components/shell src/features/search src/features/overview` must be empty.
- [ ] Report: commands + results, fixes made, remaining issues, and a manual QA checklist for the user (6 roles × 3 locales × 2 themes, drawer at 800px, ⌘K with a real 8-char ref).
