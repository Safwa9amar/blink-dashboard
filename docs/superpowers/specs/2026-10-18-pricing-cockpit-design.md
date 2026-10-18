# Pricing & Fees cockpit (UI/UX redesign)

Status: approved 2026-10-18 · Repos: blink-dashboard (`feat/pricing`, ERP shell), blink-server (`feat/openapi`)
Builds on: [pricing config Phase 1](../../../../blink/docs/superpowers/specs/2026-10-18-pricing-config-design.md) (blink repo).
Mockups: `.superpowers/brainstorm/98065-1792355716/content/pricing-directions.html` (direction A chosen over B rate-card matrix and C polish only).

## Goal

Turn `/pricing` from four plain tabs into a cockpit: see every price and deal at a glance, act in guided steps,
and answer "what does this order cost and who earns what?" — without the dashboard ever computing a price itself.

## Information architecture

Tabs (routed sub-pages, `layout.tsx` = `PageHeader` + `SubNav`): **Overview** `/pricing` · **Overrides** `/pricing/overrides`
· **Simulator** `/pricing/simulator` · **History** `/pricing/history`. `/pricing/preview` redirects to `/pricing/simulator`
(keep its query string). Header actions: **Simulate an order** (→ simulator) and **+ New override** (opens the wizard; hidden
for view-only roles). Overrides tab label carries the active count (`Overrides 6`). Roles unchanged: edit = `super_admin`,
`finance_admin`; view = `ops_admin`, `commerce_admin`.

## Overview (replaces Defaults)

1. **Tiles** (`StatCard` ×4): Active overrides (+ "across N wilayas"), Partner deals (active overrides with `merchant_id`
   or `agent_id`; "X merchants · Y agents"), Ending in 7 days (warning variant), Last change (fee name + actor + relative time,
   from `GET /pricing/admin/history?limit=1`).
2. **Ending-soon banner**: one line per active override whose `ends_at` is within 7 days (Africa/Algiers), e.g.
   "Ride ×1.2 in Alger ends in 3 days (21 Oct). After that it goes back to ×1." + **Extend** menu (+7 days, +30 days,
   pick a date) → `PATCH /pricing/admin/overrides/{id}` with `ends_at` only. Hidden when empty or for view-only roles (they
   still see the text).
3. **Fee cards** in the three groups (Customer prices · Partner earnings · Taxes & processing). Each card: name, big value
   (rates as %, DA amounts, `×1.00`), the server `example` sentence (below), an overrides chip ("2 overrides", or the single
   override's short form "Alger ×1.2 until 21 Oct") linking to `/pricing/overrides?key=<key>&status=active`. `courier_fare`
   shows a 4-row mini tariff (moto first 3 km · per km · bicycle first 2 km · extra drop-off). Taxes are one compact row.
   Grid: 4 cols customer, 5 cols partner on desktop; stacks on narrow screens.
4. **Edit** (editors only) opens a `Modal` with the fee's fields (`fee.fields`), a live before → after example from
   `POST /pricing/admin/preview` (`candidate`), and the existing `expected_updated_at` stale check.

## Overrides

- **Status pills with counts**: Active · Scheduled · Ending soon (derived: active and ends within 7 days) · Ended · Archived
  (`FilterPills`), plus the existing fee / wilaya / partner filters, all in the URL.
- **View toggle** `Table | Calendar` (`Segmented`, `?view=calendar`).
  - Table: today's columns + row actions Edit · Extend · Archive.
  - Calendar: one lane per override (fee short name + scope), months on top over a range = from the earliest visible start
    (or today − 1 month) to the latest end (or today + 3 months), a dashed "Today" line, bars by status (active = primary,
    scheduled = info, ended = muted). No start → bar starts at the range start; no end → bar runs to the range end with a
    fade. Click a bar → edit. Pure layout in `src/features/pricing/cockpit.ts` (`calendarLayout`).

## New override wizard (replaces the single long modal)

`Modal` with a 3-segment progress bar.
1. **What**: fee cards grouped as on Overview (name + current default); keys with no allowed scope (taxes) are not offered.
2. **Who / where**: only the scopes the fee allows (`scopes`): service segmented control (values from `scopes.service`),
   wilaya select (`algeria-locations`, "16 · Alger"), merchant or agent search (existing `searchPartners`). At least one
   scope is required. Pre-filled when opened from a partner's deals card.
3. **Value & dates**: fields pre-filled with the value currently effective for that scope (`preview`), `Always | From–to`
   segmented (Africa/Algiers datetime inputs), note; **before → after** from `preview.candidate_example`; a **plain-language
   summary** built from parts (`summaryParts` in `cockpit.ts`, sentence assembled with i18n), e.g. "Merchant X will pay 3%
   instead of 5% from 1 Nov to 31 Dec, then go back to 5%. They get a notification now." (notification clause only for
   merchant/agent scopes).
Edit opens at step 3 (scope is immutable, shown read-only). 409 `overlap` → error on step 3 with a link to the conflict;
400 scope errors → back to step 2 with the message. Archive keeps its confirm dialog.

## Simulator (replaces Preview)

Scenario segmented control: **Store order · Courier · Ride · Blink Cash deposit · Blink Cash withdrawal**. Inputs per
scenario (react-hook-form): wilaya (all), merchant search / store (store order), subtotal + delivery fee (store order),
vehicle + km + drop-offs (courier), km (ride), amount (cash), agent search (cash), date (all, default now). Debounced call
to `POST /pricing/admin/simulate`. Output: big "Customer pays" (or "Rider pays" / "Rider receives" for cash), a split bar by
party with amounts and a legend, and a collapsible "Values used" table (fee, value, source = Default or a link to the
override). Unavailable (e.g. route too long) → a clear message instead of numbers.

## History

Timeline grouped by day (Africa/Algiers), each entry: actor, action, fee, before → after (same formatter), link to the
override. Filters: fee, actor (from the loaded entries). Paging: "Load more" with `limit` (50 → 100 → 200).

## blink-server additions (staff only, tag `admin-pricing`; app client untouched)

Shared example builder `src/lib/pricing/examples.ts` (pure, tested), using the same pricing functions as the flows:

```ts
type FeeExample =
  | { kind: "per_checkout"; output: number }                                   // service_fee
  | { kind: "trip_km"; vehicle: "motorcycle" | "bicycle"; km: number; output: number } // courier_fare / ride_fare (5 km moto)
  | { kind: "multiplier"; input: number; output: number }                      // fare_multiplier on a 5 km ride (280 DA at seeds)
  | { kind: "rate_on_amount"; input: number; output: number }                  // rider 400 DA fare → Blink share; merchant / stamp 10,000 DA; cash fee 1,000 DA; dues fee 10,000 DA
  | { kind: "agent_split"; input: number; output: number }                     // 100 DA fee → agent keeps (uses agent_tax_rate)
  | { kind: "amount"; output: number };                                         // rider_cancel_penalty
```
`agent_tax_rate` → `rate_on_amount` on 80 DA. Rounding identical to the flows (fares ceil to 10 DA after the multiplier,
rider share = fare − `tripPayout` net, cash fee `Math.round`, merchant/stamp `round2`).

1. `GET /pricing/admin/catalog` → each `Fee` gains `example: FeeExample | null` (from its default value).
2. `POST /pricing/admin/preview` with `candidate` → response gains
   `candidate_example: { key, before: FeeExample | null, after: FeeExample | null }` (before = effective value for the
   context, after = the candidate). Existing fields unchanged.
3. `POST /pricing/admin/simulate` (read roles):
   ```
   body: { scenario: "store" | "courier" | "ride" | "deposit" | "withdrawal",
           context?: { wilaya_code?, merchant_id?, agent_id?, store_id?, at? },
           inputs?: { subtotal?, delivery_fee?, km?, stops?, vehicle?: "bicycle" | "motorcycle", amount? } }
   200:  { scenario, payer_total: number,           // store: subtotal + delivery + service fee; courier/ride: fare;
                                                     // deposit: amount + fee (rider pays); withdrawal: amount − fee (rider receives)
           lines: [{ party: "merchant" | "rider" | "agent" | "blink" | "tax",
                     label: "merchant_keeps" | "rider_keeps" | "agent_keeps" | "service_fee" | "merchant_commission"
                          | "rider_commission" | "platform_share" | "stamp_duty" | "agent_tax",
                     amount: number }],
           values: [{ key, value, override_id, scope }],  // every key used
           unavailable: null | "too_far" }
   ```
   Defaults: subtotal 2,000, delivery fee = the store's `delivery_fee` when `store_id` is given else 200, km 5, stops 1,
   vehicle motorcycle, amount 1,000. Store order context: `store_id` → wilaya + owner (as `orderPricingContext`); else the
   given `wilaya_code` / `merchant_id`. Service fee assumes the first order of a checkout. Lines sum to `payer_total`
   (store/courier/ride) or to the fee (cash). Example at seeds, store order 2,000 + 200 in Alger: payer 2,201.50 →
   merchant_keeps 1,880 · rider_keeps 170 · service_fee 1.50 · merchant_commission 100 · rider_commission 30 · stamp_duty 20.
4. Tests (`npm test`): examples at seed values (330, 280, 60, 500, 20, 79.2 …), simulate sums and the worked example above,
   `too_far` past `max_km`. `npm run typecheck`, `npm run openapi`.

## Dashboard implementation notes

- Feature-first: `src/features/pricing/` (types updated to the contract, `cockpit.ts` pure helpers + vitest tests,
  components), routes in `src/app/d/pricing/` (triad), locales en/fr/ar, RTL logical classes, kit tokens only, dark theme.
- Reuse the kit: `StatCard`, `StatGrid`, `Card`, `Badge`, `FilterPills`, `Segmented`, `DataTable`, `Modal`, `EmptyState`,
  `Skeleton`, `Toolbar`, `SearchBox`.
- Keep `PricingDealsCard` working (merchant/agent detail windows) and point its "New deal" at the wizard (step 3 if the
  fee is chosen, else step 1 with the partner pre-filled).
- Pure helpers + tests: `endingSoon(overrides, now, days)`, `overviewKpis(overrides)`, `calendarLayout(overrides, now)`,
  `summaryParts(fee, scope, before, after, window)`, `statusCounts(overrides, now)`.
- Checks: `npx tsc --noEmit`, `npx vitest run`, eslint on the module (0 errors), `npm run build`.

## Out of scope

Rules engine features (daily hours, conditions, approvals), map views, bulk edit, CSV export.
