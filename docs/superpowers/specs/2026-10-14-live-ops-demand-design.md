# Live ops & Demand on real data (ERP mock module 3 of 5)

Date: 2026-10-14. Both pages are 100% mock today (`src/features/live-ops/data.ts` EVENTS + a fake ticking counter; `src/features/demand/data.ts` HOURS/ZONES/HEAT/MAP_ZONES/RIDERS). Replace them with real data from the hosted DB. No migrations: everything is read from existing tables with the service-role client (`createAdminClient()`), gated by `requirePathAccess("/live-ops")` / `requirePathAccess("/demand")` (pages) and `getStaffActor(path)` (server actions).

## Real data available

- `orders`: `type` (merchant | shopper | courier | ride), `status` (processing, searching, heading_to_store, preparation, pickup, on_the_way, delivered, canceled, merchant_rejected), `merchant_status`, `created_at`, `accepted_at`, `prepared_at`, `rider_assigned_at`, `picked_up_at`, `delivered_at`, `canceled_at`, `canceled_by`, `cancel_reason`, `store_id`, `store_name`, `rider_id`, `customer_id`, `total`, `pickup_lat/lng`, `destination_lat/lng`, `pickup_address`, `destination_address`, `scheduled_at`.
- `rider_profiles`: `user_id`, `is_available`, `latitude/longitude`, `location_updated_at`, `vehicle_type`, `verification_status`, `created_at`.
- `stores`: `name`, `city`, `wilaya`, `latitude/longitude`, `status`, `is_open`, `created_at`.
- `agent_shops`: `shop_name`, `status`, `latitude/longitude`, `created_at`.
- `transactions` (Blink Cash): `type` deposit|withdrawal, `status` completed|cancelled|pending, `total`, `created_at`, `agent_id`, `user_id`.
- `support_conversations`: `status` bot|waiting|assigned|resolved, `assigned_agent_id`, `unread_for_staff`, `subject`, `created_at`, `last_message_at`.
- `users`: `first_name`, `last_name` for names.
- Server health: `fetchServerMetrics(instance)` in `src/app/d/blink-server/metrics-action.ts` (used by the Server page).

Volumes are small (tens of orders). Aggregate in TypeScript from rows fetched for the window (cap 5,000 rows; note in code where to move to SQL when volume grows). All time bucketing uses **Africa/Algiers**. "Active" order statuses = processing, searching, heading_to_store, preparation, pickup, on_the_way.

## Shared map

`src/components/map` (already built): `<OpsMap markers lines circles height fitKey />` from `@/components/map/ops-map`. Marker kinds: rider (online, idle), rider_busy, pickup, dropoff, agent, store, alert. Circles for aggregated cells.

## Live ops (`/live-ops`)

Server: `src/app/d/live-ops/data.ts` → `loadLiveOps(): Promise<LiveOpsSnapshot>`; `action.ts` → `refreshLiveOps()` (same, guarded). The page renders the first snapshot server-side; the client polls `refreshLiveOps()` every **15 s** (paused while `document.hidden`), and the LivePill shows "Updated Xs ago".

Snapshot:
- **KPIs**: active orders; waiting for a rider (status `searching`, + the oldest wait in minutes); riders online (is_available and location ≤ 15 min old) / busy (online riders that are `rider_id` on an active order); open support chats (`waiting` + `assigned`, and the unread total); Blink Cash today (completed deposits/withdrawals count and amount since Algiers midnight).
- **Needs attention** (sorted by severity then age), each with what/why/age and a link (`/orders` for orders, `/support/inbox` for chats):
  - order `searching` for > 5 min (warning) / > 15 min (danger)
  - merchant order where the store hasn't accepted (`status = processing` or `merchant_status` pending) for > 10 min
  - rider assigned but not picked up for > 30 min
  - `on_the_way` for > 60 min
  - support chat `waiting` with no agent for > 10 min
  - scheduled order due within 15 min with no rider
- **Live map**: online riders (idle = rider, busy = rider_busy), active orders' pickup markers with a dashed line to the destination, open agent shops (toggle). Popups: order short id, store, status, age; rider name, vehicle, last seen. Legend + toggles (riders / orders / agents).
- **Event feed** (last 24 h, newest first, max 40), built from timestamps: order placed, rider assigned, picked up, delivered (with minutes from placement), canceled (by + reason), store rejected; Blink Cash deposit/withdrawal completed (amount); support chat opened; new store submitted; new rider signed up. Each item: icon, colored kind, short text with the key entity bold, meta line (area/amount), relative time (computed client-side after mount to avoid hydration mismatches).
- **System health**: primary and spare API (`fetchServerMetrics`: up/down, p95 latency, 5xx rate), database round-trip time (time a cheap query), last order received ("3 min ago").

## Demand (`/demand`)

Server: `src/app/d/demand/data.ts` → `loadDemand(range: "today" | "7d" | "30d")`; `action.ts` → `refreshDemand(range)`. Range control in the header (Segmented) with `?range=` in the URL. Analytics / Map views (keep the existing Segmented).

- **KPIs**: orders; completion rate (delivered / finished); unmet demand (canceled or rejected before a rider was assigned, as count and % of orders); median time to a rider (`rider_assigned_at - created_at`); median delivery time (`delivered_at - created_at`).
- **Orders by hour of day** (Algiers, 0–23): stacked bars delivered / canceled-or-rejected / still active, plus a line for the median wait for a rider in that hour. Honest labels; no fake "supply" line (there is no rider-online history).
- **Service mix** (donut): by `orders.type`, labels: merchant → "Store orders", shopper → "Shopper", courier → "Courier", ride → "Rides".
- **Heatmap**: weekday (Sat → Fri, Algerian week) × hour band (00–06, 06–10, 10–14, 14–18, 18–22, 22–24) of order counts, intensity-shaded.
- **Top areas**: group orders into ~1.5 km cells (round pickup lat/lng to 0.015°); label each cell by the nearest store's `city` (else "lat, lng"). Columns: area, orders, unmet %, median wait, riders online in the cell now. Also a small **Top stores** list (orders, completion %).
- **Map view**: demand cells as circles (radius ∝ √orders, intensity ∝ unmet share) + current online riders; click a cell → side panel with its stats and its top stores.
- Empty states everywhere ("No orders in this period").

## General

- Replace the mock files entirely; delete EVENTS/HOURS/ZONES/HEAT/MAP_ZONES/RIDERS. Keep components where they still fit, rewrite where not.
- i18n: en/fr/ar for all strings (feature locales); RTL with logical properties; `dir="auto"` on store/user names.
- Dates/numbers: `formatDay` from `@/features/promotions` for dates; `toLocaleString(locale)` for numbers; "DA" via the existing `common.da` key.
- Document title: live-ops shows the active-order count (`useDocumentTitle`), demand shows the orders count.
- Mobile: KPI grid 2 columns on phones; map height 320 on phones.
- Tests: pure aggregation helpers (`src/features/<feature>/aggregate.ts`) with vitest (attention rules, hour/heat bucketing in Algiers time, cell grouping, medians).
