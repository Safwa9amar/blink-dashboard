# Promotions & Coupons on real data (ERP: finish the mock modules, step 1)

- **Date:** 2026-10-14
- **Repos:** blink-server (schema, rules, endpoint), blink-dashboard (pages), blink (event tracking + new statuses)
- **Status:** approved (owner: "full features with all needed options", no further questions)
- **Decisions:** two pages, one per table (A); real data plus spend caps plus view/tap tracking (C)

## 1. Goal

The dashboard's Promotions and Coupons pages are mock data from the design handoff. The customer app already uses the real `promotions` and `customer_coupons` tables. This project makes the dashboard manage and measure those tables, and adds the controls the mock implied: spend caps and Reach/CTR.

## 2. Data model (blink-server owns it)

Migration `supabase/migrations/20261014120000_promotion_controls_and_events.sql` (hand-written, see the schema-ownership note), with matching Drizzle changes in `src/db/schema/promotions.ts`:

### 2.1 `promotions` (new columns)

| Column | Type | Meaning |
|---|---|---|
| `max_coupons` | `integer` null | Stop issuing after this many coupons (all issued rows, revoked included). Null = unlimited. Check `> 0`. |
| `discount_budget` | `numeric(10,2)` null | Stop issuing once the discount given reaches this many DZD. Null = unlimited. Check `> 0`. |
| `archived_at` | `timestamptz` null | Archived: hidden from the app and from the default dashboard list. |
| `created_by` | `uuid` null → `users(id)` on delete set null | Staff who created it (dashboard). |

### 2.2 `customer_coupons` (new columns)

| Column | Type | Meaning |
|---|---|---|
| `revoked_at` | `timestamptz` null | Staff revoked it; checkout refuses it. |
| `source` | `text not null default 'promotion'`, check in `('promotion','referral','staff')` | Where it came from. |
| `issued_by` | `uuid` null → `users(id)` on delete set null | Staff who issued or revoked it last. |
| `note` | `text` null | Staff reason (issue / revoke / extend). |

Backfill: `source = 'referral'` for coupons referenced by `referrals.coupon_id`, only if `to_regclass('public.referrals')` is not null (that table's migration may not be applied yet).

### 2.3 `promotion_events` (new table)

`id uuid pk default gen_random_uuid()`, `promotion_id uuid not null → promotions(id) on delete cascade`, `user_id uuid null → users(id) on delete set null`, `event text not null check (event in ('view','tap'))`, `created_at timestamptz not null default now()`. Index `(promotion_id, event, created_at)`. RLS enabled with **no** client policies: only the server (service role) writes and the dashboard (service role) reads.

### 2.4 SQL functions (same migration)

"Counted orders" = `orders` with `coupon_id` in the promotion's coupons and `status not in ('canceled','merchant_rejected')`.

- `promotion_usage(p_id uuid) returns table(issued int, discount_given numeric)`: all-time, used by the server's issue check.
- `promotion_stats(p_from timestamptz default null, p_to timestamptz default null) returns table(promotion_id uuid, views int, reach int, taps int, tappers int, issued int, used int, discount_given numeric, orders int, revenue numeric)`: one row per promotion. Events are filtered by `created_at`, coupons by `created_at`, and orders by `orders.created_at`; null bounds = all time. `reach` and `tappers` are distinct `user_id`s.
- `promotion_daily(p_promotion uuid default null, p_days int default 30) returns table(day date, views int, taps int, issued int, used int, discount_given numeric)`: per Africa/Algiers day for the last `p_days` days, all promotions when `p_promotion` is null. Days with no activity still appear (generate_series).

All three are `stable`, `security invoker`, `set search_path = public`. Revoke execute from `anon` and `authenticated` (service role only).

## 3. Rules (blink-server)

Computed **availability** of a promotion, in this order: `archived` (archived_at set) → `paused` (!is_active) → `scheduled` (starts_at > now) → `ended` (ends_at < now) → `sold_out` (max_coupons set and issued ≥ max_coupons) → `budget_spent` (discount_budget set and discount_given ≥ discount_budget) → `live`. A pure function `promotionAvailability(p, usage, now)` in `src/lib/coupons.ts`, unit-tested in `src/lib/coupons.test.ts`. The dashboard uses the same order (§5.1).

- `issueCoupon` (activate, claim, redeem-by-code): if the promotion is not `live`, it refuses with a typed error. Routes answer **409** `{ error, code }` with `code` ∈ `not_live | sold_out | budget_spent`. Existing coupon for the same user + promotion is still returned as before (idempotent), even if the promotion has since sold out.
- `priceCoupon` / checkout: ignores coupons with `revoked_at` set (as if not found). `presentCoupon` status order: `revoked` → `used` → `expired` → `active`.
- `GET /promotions` (customer list): hides archived and non-live promotions.
- `GET /coupons` (customer list): includes revoked coupons with `status: "revoked"`.
- Referral-reward coupons are inserted with `source: 'referral'`.
- New **`POST /promotions/events`** (operationId `trackPromotionEvents`, tag `promotions`, bearer auth): body `{ events: { promotion_id: uuid, event: "view" | "tap" }[] }` (1–50 items). Unknown promotion ids are dropped. Inserts with the caller's `user_id`. Answers `200 { accepted: number }`.
- Regenerate `openapi.json` (`npm run openapi`).

## 4. App (blink)

- `npm run api:sync` to pick up the new endpoint and coupon status.
- `hooks/use-promotion-events.ts`: an in-memory queue that sends at most one `view` per promotion per app session and every `tap`. Flushes every 5 s or at 20 queued events through the generated `trackPromotionEvents` mutation. Fire-and-forget: errors are dropped silently.
- Customer Promos tab (`app/(customer)/promos/index.tsx`) and Top Deals (home): `view` when a card is rendered in the list, `tap` when it's pressed or its action (activate/copy/claim/view) is used.
- Coupon cards: show a `revoked` state (same styling as expired, label "Revoked").
- Activate/claim/redeem errors `sold_out`, `budget_spent` and `not_live` show translated messages.
- New keys in en/ar/fr/ch; `npm run i18n:check`.

## 5. Dashboard (blink-dashboard)

All reads and writes use `createAdminClient()` in server components and `action.ts` server actions (the triad), as the other real modules do. The mock `data.ts` files lose their mock arrays. URLs stay the same.

### 5.1 `/promotions`

- KPI row: live promotions; coupons issued (30 days); coupons used (30 days); discount given (30 days, DZD); average CTR (30 days).
- Tabs: **Promos** (`kind = promo`) · **Deals** (`kind = deal`) · **Archived**.
- Filters: availability (live, scheduled, paused, ended, sold out, budget spent), category, search on title/code.
- Table: cover thumbnail + title + code, category, discount label, availability badge, dates, views, CTR, issued (of max), used, conversion (used/issued), discount given (of budget, with a progress bar), revenue. Clicking a row opens the edit page.
- Row actions: edit, pause/resume (`is_active`), duplicate (copy as paused, title + " (copy)", code cleared), archive/unarchive, delete (only when no coupon was issued; otherwise the action says to archive instead).

### 5.2 `/promotions/new` and `/promotions/[id]`

One form, every column: kind, category (RIDES, FOOD, SUPERMARKET, MARKET, COSMETICS, PARCELS), title, subtitle, cover image (upload to the same storage bucket the News covers use, or a URL), code (optional; unique among non-archived promotions, checked in the action), action (activate/copy/claim/view), deal fields (badge text and colour, value text, info text and icon, store picker), discount type/value, min order, max discount, valid days, starts/ends, active, sort order, max coupons, discount budget. A live phone preview shows the promo card or deal card. Validation (server action and client): required title; value > 0 unless free delivery; percent ≤ 100; ends after starts; caps > 0. The edit page also shows this promotion's stats (the `promotion_stats` row), a 30-day chart (`promotion_daily`), and its latest issued coupons with a link to `/coupons?promotion=<id>`. Saving sets `created_by` on insert.

### 5.3 `/promotions/analytics`

Range picker (7 / 30 / 90 days). Charts from `promotion_daily(null, days)`: views and taps; issued and used; discount given per day. Top promotions table (by discount given, with CTR and conversion), and a breakdown by category. Use the existing chart components in `src/components/ui`.

### 5.4 `/coupons`

- KPI row: active coupons, used (30 days), expiring in 7 days, revoked.
- Filters: status (active, used, expired, revoked), source (promotion, referral, staff), promotion (also from `?promotion=` query), search on code or customer name/phone.
- Table: code, customer (name + phone, links to the customer page), promotion title (or "Staff" / "Referral"), discount label, min order, status, expires, used on (order number linking to `/orders`), source, issued by.
- Row actions: extend expiry (date + note), revoke (note required), restore (clears `revoked_at`).
- **Issue coupon** (`/coupons/new`): search a customer, then either "from a promotion" (copies its values; refuses if the customer already holds one from it, because of the unique key) or "custom" (title, type, value, min order, max discount, expiry). Optional note. Inserted with `source = 'staff'` and `issued_by` = staff id, plus a code (custom: generated 8 chars, editable).

### 5.5 Shared

- Availability is computed with the same order as §3, in `src/features/promotions/availability.ts`, with vitest tests.
- Every action checks `canAccessPath(staffRole, "/promotions" | "/coupons")`.
- i18n: all new strings in en, fr and ar (feature locale files).
- `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` pass.

## 6. Rollout

1. Apply the migration to the hosted DB (with the owner's go-ahead).
2. Deploy blink-server (it tolerates the old app, since the endpoint is new and the statuses are additive).
3. Merge the dashboard branch to `main` (Vercel). It needs the migration first.
4. App: the next OTA, or the next native build, carries the tracking. Reach/CTR fill in as customers update.

## 7. Out of scope

Loyalty points; role audiences (promos are customer-only); push campaigns for promos (Notifications already exists); merchant-funded promos.
