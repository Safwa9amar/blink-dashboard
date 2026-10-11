# ERP shell redesign: module workspace, Home, ⌘K search, UI-kit restyle

- **Date:** 2026-10-11
- **Repo:** blink-dashboard (branch `feat/erp-shell`, cut from `feat/live-chat` @ `6d048fa`)
- **Status:** approved design, awaiting spec review
- **Mockups:** `.superpowers/brainstorm/7855-1791726828/content/` in the main checkout. The chosen direction is `redesign-directions.html` tab A; the default theme is shown in `theme-default.html`.

## 1. Goal

Turn blink-dashboard into the frame of a full ERP while keeping the current stack (Supabase + blink-server + Next.js). This first sub-project replaces the navigation and visual layer only:

1. A **module workspace** layout: dark icon rail of business modules, a per-module menu, a top bar.
2. **Categories by business function** (10 modules) instead of by app role.
3. A real-data **Home** page with a "Needs attention" list.
4. **⌘K search** over pages, actions and records.
5. A **restyle of the shared UI kit**, so existing pages take on the new look without being edited.

The ERP modules themselves (ledger, invoices, payouts, expenses, HR, assets, reports) are later sub-projects, each with its own spec. The next one is Finance & Accounting (Phase 1 of the ERP roadmap).

## 2. Decisions taken

| Decision | Choice |
|---|---|
| Navigation pattern | A: module workspace (icon rail + module menu), as in Odoo / Supabase |
| Scope of this project | Shell + restyle of `src/components/ui/` (no per-page rebuilds) |
| Default theme | Light; dark still available from the top bar |
| ⌘K scope | Pages + actions + records |
| Implementation | One navigation config; **URLs unchanged**; no route folders move |
| Base branch | `feat/live-chat` (main is 37 commits behind and lacks most current pages) |

## 3. Out of scope

- New ERP pages: Finance ledger, invoices, payouts, expenses, staff, payroll, assets, reports, Dispatch & SLA, onboarding pipeline, My tasks.
- Rebuilding list pages onto a shared list template (saved views, bulk select). That happens module by module later.
- A staff audit log. The People module only links the existing Access pages.
- Changes to `ROLE_ACCESS` or the staff role model.
- Record detail pages. Search uses a quick-view panel instead (§7.3).

## 4. Information architecture

### 4.1 Modules and pages (existing routes only)

Order = rail order. Page labels reuse the existing `sidebar.*` translation keys. Module names and descriptions are new keys.

| # | Module | Pages → existing href |
|---|---|---|
| 1 | Home | Overview `/` |
| 2 | Operations | Live ops `/live-ops` · Orders `/orders` · Trips `/trips` · Demand `/demand` |
| 3 | Customers | Customers `/customers` · All accounts `/users` |
| 4 | Support | Overview `/support` · Tickets `/support/tickets` · Live chat `/support/inbox` · AI bot `/support/ai` · Knowledge base `/support/kb` · Macros `/support/macros` · CSAT `/support/csat` · Agents `/support/agents` · SLA & rules `/support/sla` · Deletion requests `/deletion-requests` |
| 5 | Partners | Merchants `/merchants` · Riders `/riders` · Agents `/agents` · Agent shops `/agent-shops` · Vehicles `/vehicles` · Verification `/verification` |
| 6 | Catalog | Marketplace `/marketplace` · Product library `/library` · Merchant pricing `/merchant-pricing` · Packs `/packs-management` |
| 7 | Marketing | Promotions `/promotions` · Coupons `/coupons` · News `/news` · Notifications `/notifications` · Email `/email` · Deep links `/deep-links` |
| 8 | Finance | Blink Cash `/blink-cash` |
| 9 | People | Access `/access` |
| 10 | Analytics | (no pages yet, so the module is hidden) |
| 11 | System | Server `/blink-server` · Settings `/settings` |

That is 37 pages (the old sidebar's 29 plus the 8 support sections promoted from `/support`'s in-page tabs). `/test` and `/transactions` (a redirect) are not in the nav.

Sub-routes (`/blink-cash/dues`, `/access/roles`, `/support/articles/new`, `/news/compose`, …) are **not** menu entries. They keep their existing in-page `SubNav` / `SubTabs`, and they resolve to their parent page for highlighting and breadcrumbs.

### 4.2 Rules

- **Module of a URL** = the page whose href is the longest prefix of the pathname (same matching as `routeMatches` in `access.ts`: `/` matches only itself).
- **Visibility:** a page is shown when `canAccessPath(role, href)` is true. A module is shown when at least one of its pages is visible. Home is always visible (every role has `/`).
- A module with zero configured pages (Analytics) is never shown.

## 5. Navigation config

New file `src/lib/nav/modules.ts`. It is pure, with no React and no server imports, so the rail, menu, breadcrumbs, ⌘K and tests all read it.

```ts
export type ModuleKey =
  | "home" | "operations" | "customers" | "support" | "partners" | "catalog"
  | "marketing" | "finance" | "people" | "analytics" | "system";

export type AttentionKey =
  | "storesPending" | "productsPending" | "packsPending" | "duesOutstanding"
  | "deletionPending" | "supportUnread" | "alertsOpen";

export interface NavPage {
  key: string;            // translation key under `sidebar.*` (existing)
  href: string;           // existing route, e.g. "/blink-cash"
  icon: string;           // DashIcon name
  attention?: AttentionKey[]; // counts summed into this page's badge
}

export interface NavModule {
  key: ModuleKey;         // `shell.modules.<key>.name` / `.description`
  icon: string;
  pages: NavPage[];
}

export const MODULES: readonly NavModule[];

export function resolvePath(pathname: string): { module: NavModule; page: NavPage } | null;
export function visibleModules(role: StaffRole): NavModule[]; // pages filtered by canAccessPath, empty modules dropped
```

Badge wiring:

| Page | Attention keys |
|---|---|
| `/verification` | `storesPending` |
| `/merchant-pricing` | `productsPending` |
| `/packs-management` | `packsPending` |
| `/blink-cash` | `duesOutstanding` |
| `/deletion-requests` | `deletionPending` |
| `/support/inbox` | `supportUnread` |
| `/blink-server` | `alertsOpen` |

A module's rail dot appears when any of its visible pages has a count above 0.

`sidebar.tsx` and its `NAV_GROUPS` are deleted. The `access.ts` header comment ("route keys are the nav hrefs from sidebar.tsx") is updated to point to `modules.ts`.

## 6. Shell components

All in `src/components/shell/`. `dashboard-shell.tsx` is rewritten to compose them, and its existing client-side access redirect is kept as is.

| File | Responsibility |
|---|---|
| `top-bar.tsx` | 56px bar: logo + "Admin", search trigger (opens ⌘K), `CreateMenu`, `LanguageSwitcher`, `ThemeSwitcher`, existing `NotificationBell`, `StaffMenu`. Below 1024px it also shows the ☰ drawer button. |
| `module-rail.tsx` | 76px icon rail, dark in both themes. One button per visible module (icon + short label), active = `resolvePath(pathname).module`, attention dot. |
| `module-nav.tsx` | 232px menu: module name, one-line description, page links with count badges. Collapsible to 0 width. Collapse state lives in the shell for the session (as today). |
| `breadcrumbs.tsx` | `Module / Page` (+ `/ Sub-page` when the pathname is deeper than the page href; the label comes from the in-page SubNav item when available, otherwise it's omitted). Rendered above `children`. |
| `create-menu.tsx` | "+ Create" dropdown over existing creation routes: `/promotions/new`, `/coupons/new`, `/news/compose`, `/notifications/compose`, `/library/products/new`, `/support/articles/new`. Each item is shown only if `canAccessPath(role, href)`. |
| `staff-menu.tsx` | Avatar menu: name, translated staff role, sign out (moves the existing sign-out logic from `sidebar.tsx`). |
| `mobile-drawer.tsx` | Below 1024px: slide-out panel containing rail + module menu. |
| `command-palette.tsx` | ⌘K modal (§7). |
| `record-peek.tsx` | Quick-view side panel for a search result (§7.3). |
| `attention-provider.tsx` | Client context holding attention counts. It is seeded by the server layout and refreshed every 60s through the `refreshAttention` server action. Pauses while the tab is hidden. |

`src/app/d/layout.tsx` additionally loads `getAttentionCounts(staffRole)` and the staff display name, and passes both to the shell.

## 7. Home page and search

### 7.1 Home (`/`)

`src/app/d/page.tsx` is rewritten. Data comes from the service-role client (`createAdminClient`), and "today" means `Africa/Algiers` midnight.

| Block | Source |
|---|---|
| KPI: Orders today | `orders` count, `created_at >= today` |
| KPI: Order value today | sum `orders.total`, today, `status not in ('canceled','merchant_rejected')` |
| KPI: Riders available | `rider_profiles` count `is_available = true` / total |
| KPI: Blink Cash today | sum `transactions.total`, today, `status = 'completed'` (+ count) |
| KPI: Waiting on staff | sum of the visible attention counts |
| Orders, last 14 days | per-day counts of `delivered` vs `canceled` + `merchant_rejected` |
| Live operations | counts of orders in `searching`, `heading_to_store`, `preparation`, `pickup`, `on_the_way` (+ delivered today) |
| Needs attention | attention counts (§7.2), each row linking to its page, hidden when 0 or not accessible |
| Latest activity | newest 8 of `orders` ∪ `transactions`, merged by `created_at` |

Each block that the role can't access (for example Blink Cash for `ops_admin`) is omitted rather than shown empty. Each block renders its own error state, so one failing query doesn't break the page. The "Revenue this month" card arrives with the Finance project.

### 7.2 Attention counts

`src/lib/shell/attention.ts` (server-only): `getAttentionCounts(role): Promise<Partial<Record<AttentionKey, number>>>`. It only computes keys whose page the role can access, and runs everything in parallel.

| Key | Query |
|---|---|
| `storesPending` | `stores` where `status = 'under_review'` |
| `productsPending` | `store_products` where `review_status = 'pending'` |
| `packsPending` | `store_packs` where `status = 'under_review'` |
| `duesOutstanding` | blink-server `GET /merchant/admin/dues` via `blinkApi` (same loader as `src/app/d/blink-cash/data.ts`): count of stores with `outstanding > 0`. The API has no due date, so this is "unpaid", not "overdue". |
| `deletionPending` | `account_deletion_requests` where `status = 'pending'` |
| `supportUnread` | `support_conversations` where `unread_for_staff > 0` |
| `alertsOpen` | `alert_events` where `resolved_at is null` |

A failing source returns `undefined` for its key (no badge) and logs on the server. It never throws to the layout.

### 7.3 ⌘K command palette

- **Open:** ⌘K / Ctrl+K anywhere in `/d`, or click the top-bar search. Esc closes. Arrow keys and Enter navigate. Full-screen below 1024px.
- **Instant groups** (client-side, no request):
  - **Pages:** every visible page and module, matched against the label in the current locale **and** the en label.
  - **Actions:** the Create menu items.
- **Record groups** (from 2 characters, 250ms debounce): server action `searchRecords(q)` in `src/lib/shell/actions.ts`. The action re-resolves the staff role and returns at most 5 per group, only for groups whose list page the role can access:

  | Group | Match | Needs |
  |---|---|---|
  | Orders | 8+ hex chars → uuid range on `orders.id` | `/orders` |
  | Transactions | same, on `transactions.id` | `/blink-cash` |
  | People | `users.first_name` / `last_name` / `phone_number` / `email` ilike | `/users` (role shown as a tag) |
  | Stores | `stores.name` ilike | `/merchants` |

- **Reference lookup:** the apps show references as `id.slice(0, 8).toUpperCase()`. `src/lib/nav/ref-range.ts` turns `3F2A9C1B` into `gte 3f2a9c1b-0000-0000-0000-000000000000` / `lte 3f2a9c1b-ffff-ffff-ffff-ffffffffffff`. This works with the primary-key index and needs no migration. A full uuid is matched exactly.
- **Selecting a page or action** navigates to it.
- **Selecting a record** opens `RecordPeek`, a right-side panel (left in Arabic) with the record's key fields:
  - Order: status, type, store, customer, total, timestamps.
  - Transaction: type, status, amount/fees, agent, date.
  - Person: role, phone, active, joined.
  - Store: status, owner, product count.

  It has a "Open in <list page>" link. The data comes from the same action (`getRecord(kind, id)`).
- **Empty state:** "No results for "…"". Recent pages (last 5, `localStorage`, wrapped in try/catch) are shown before typing.

## 8. UI-kit restyle

### 8.1 Tokens (`src/app/globals.css`)

| Token | Light | Dark |
|---|---|---|
| `--background` | `#F6F7F9` | `#0B0F17` |
| `--card` | `#FFFFFF` | `#131821` |
| `--card-hover` / `--muted` | `#F9FAFB` / `#F1F5F9` | `#0F141C` / `#1A212C` |
| `--border` | `#E6E8EC` | `#232B37` |
| `--text` / `--subtext` | `#0F172A` / `#64748B` | `#E6E8EB` / `#8B95A3` |
| `--primary` | `#EE335F` (unchanged) | `#EE335F` |
| **new** `--rail`, `--rail-text`, `--rail-active` | `#0F172A`, `#94A3B8`, `#FFFFFF` | `#070A10`, `#8B95A3`, `#FFFFFF` |

The status tokens (`success`, `danger`, `info`, `warning` and their `-light` variants) are kept and retuned to the mockup values. They are exposed through `@theme inline` like the existing tokens.

- **Default theme:** `light`. Update the pre-paint script in `src/app/layout.tsx` and `ThemeSwitcher`'s fallback. A saved preference still wins.
- **Type:** Inter for `/d` (already loaded in the root layout), with `font-variant-numeric: tabular-nums` on stat values, table number cells and money.

### 8.2 Components (props and exports unchanged)

`page-header`, `stat-card`, `stat-grid`, `card`, `data-table`, `button`, `badge`, `sub-tabs`, `sub-nav`, `filter-pills`, `search-box`, `segmented`, `toolbar`, `modal`, `empty-state`, `skeleton`, `toggle`, `form-row`, `lang-tabs`, `legend`, `chart-head`, `chart-theme`:

- One radius scale: 8px for controls, 12px for cards and panels, full for pills.
- One spacing scale based on 4px.
- **Stat cards:** neutral surface. The variant colour applies only to the icon chip and the trend line, not the whole card.
- **Data table:** sticky header on `--card-hover`, 11px uppercase headers, 40px rows, row hover, pagination footer ("1–8 of N").
- **Buttons:** primary (pink), secondary (bordered), ghost. 34px height.
- **Charts:** `chart-theme` palette updated to the new tokens.

**Rule:** no prop, export or behavior changes. A page that renders wrong after the restyle gets a targeted fix in that page, not a kit API change.

## 9. Arabic (RTL), sizes, i18n

- **RTL:** layout uses logical properties only (`ms-/me-/start-/end-`, `border-e`). The rail and module menu sit on the right, breadcrumbs use a direction-aware separator, chevrons flip, `RecordPeek` opens from the left, and ⌘K results align to the start edge.
- **Sizes:**
  - ≥ 1280px: full layout.
  - 1024–1279px: module menu starts collapsed.
  - < 1024px: rail + menu in `mobile-drawer`, ⌘K full-screen.
- **i18n:** new `shell` namespace in `src/i18n/messages/{en,fr,ar}.json`: `modules.<key>.name|description`, `home.*`, `search.*`, `create.*`, `staff_menu.*`, `breadcrumbs.*`. Existing `sidebar.*` page labels are reused. Three existing labels are renamed in all three locales to fit their module: `sidebar.users` → "All accounts", `sidebar.library` → "Product library", `sidebar.pricing` → "Merchant pricing". Group-only keys that the new shell no longer uses (`platform`, `commerce`, `money`, `operations`, `people`, `system`, `transactions`, `no_menu_match`, `search_menu`, `collapse_sidebar`, `expand_sidebar`) are deleted after a usage search. Keys that double as page labels (`customers`, `riders`, `merchants`, `agents`) stay.

## 10. Errors and edge cases

- **Role with no access to a URL:** unchanged (the shell redirects to `defaultPathFor(role)`).
- **Unknown `/d` path** (no module match): the rail shows Home inactive, the breadcrumb is omitted, and the page renders normally.
- **Attention or search source down:** that key or group is missing, and nothing else is affected.
- **Search injection:** queries go through supabase-js filters (`ilike` with escaped `%`/`_`, `gte`/`lte` on validated hex), never string-built SQL.

## 11. Testing

- **Add Vitest** (dev dependency + `npm test`) for pure logic:
  - `modules.ts`: every `href` has a matching `src/app/d/**/page.tsx`; every page key exists in `sidebar.*` for en/fr/ar; `resolvePath` maps `/blink-cash/dues` → Finance/Blink Cash, `/` → Home, `/news/compose` → Marketing/News, an unknown path → null.
  - `visibleModules`: snapshot of module keys per each of the 6 staff roles; `finance_admin` → Home, Finance.
  - `ref-range.ts`: 8-char ref → correct bounds; lowercase input; full uuid → exact; non-hex → null.
- `npm run lint` and `npm run build` pass.
- **Manual QA:** the 6 staff roles × en/fr/ar × light/dark. Open every one of the 29 pages and their sub-tabs inside the new shell, check ⌘K record search with real refs, and check the drawer at 800px width.

## 12. Rollout

- Work in the worktree `../blink-dashboard-erp-shell` on `feat/erp-shell`. Merge after `feat/live-chat` lands (rebase onto it if it moves).
- No feature flag. It's an internal tool, and the new shell fully replaces the old sidebar.
- Update `CLAUDE.md` "Dashboard routes" to describe modules and `src/lib/nav/modules.ts` as the place to add a page.

## 13. What comes next

1. **Finance & Accounting** (ERP Phase 1): ledger, chart of accounts (SCF), auto-posting from orders, trips and Blink Cash, invoices, P&L and TVA. Adds pages to the Finance module, the "Revenue this month" KPI, and the Analytics module's first page.
2. Treasury & Settlements → Expenses → Reporting → HR → Assets, each as its own spec.
