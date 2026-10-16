# Full Blink Cash (wallet ledger, safety, staff operations, app gaps)

Date: 2026-10-16. Owner request: "build a full blink cash". Repos: blink-server (`~/blink-server-staff`, branch `feat/blink-cash-full` from main `d34af2e`), blink-dashboard (`~/blink-dashboard-cash`, branch `feat/blink-cash-full`), blink app (`~/blink` working tree, shared with other uncommitted work).

## 0. Where we start (surveyed 2026-10-16)

- **Rider balance is derived.** `riderWallet()` in `src/lib/dispatch.ts` sums the inputs below on every call. There is no wallet table, no hold and no lock.
  - Inputs: completed deposits and withdrawals (`amount`), `tripWalletDelta` over trips, and won challenge rewards.
  - Withdrawal create is check-then-insert, so it is racy.
  - The admin summary calls it once per rider (N+1).
- **Pending agent operations never expire.** There is no rider cancel route (the app has `TODO(server)`), and a pending withdrawal stays reserved forever.
- **No limits, no idempotency, no settings.** The 2% fee is inline in two routes. The dashboard fee card is hard-coded, and Settings → Fees is a fake form.
- **PIN** is unsalted SHA-256 with no lockout and no change route. Riders verify the PIN on the device only.
- **Deposit offers** in the app are mock (`hooks/use-rider-deposit-offers.ts`). `transactions.offer_title/offer_detail` are unused.
- **Agents** have dues (cash they hold for Blink, derived in `lib/agent-finance.ts`) but no cash limit and no cash-position view. They get no push when a rider picks their shop.
- **Electronic deposits/withdrawals and app dues payments had no payment provider.** They are hotfixed (`e20457e`, `d34af2e`): electronic is refused, and app dues payments are stored `pending`.
- **Dashboard Blink Cash is read-only.** Its only write is "Remind". It has no per-user wallet, no reversal or cancel, no review queue, no settlement recording, no export (both Export buttons are inert), and no audit.
- **Server cron routes are dead.** They were driven by a crontab on the retired greenpedal host, and Render's `CRON_SECRET` value is unknown locally. Blink Cash expiry therefore runs in the database via `pg_cron` (available, not yet enabled).
- **Live data:** 9 transactions (7 pending deposits from 7–15 Oct, 1 pending withdrawal from 10 Oct, 1 completed deposit), 0 agent dues payments, 3 merchant dues payments.

## 1. Ledger (server, migration `20261016120000_blink_cash_full.sql`)

### Tables

All have RLS on. The service role writes. Users may only select their own wallet and entries.

- `blink_wallets`:
  - columns: `id uuid pk`, `user_id → users`, `role user_role`, `balance numeric(14,2) default 0`, `held numeric(14,2) default 0 check (held >= 0)`, `status text check in ('active','frozen') default 'active'`, `frozen_reason`, `frozen_by`, `frozen_at`, `backfilled_at timestamptz`, `created_at`, `updated_at`
  - `unique (user_id, role)`
  - Only role `rider` is used now. The table is generic for a later customer wallet.
- `blink_wallet_entries`:
  - columns: `id uuid pk`, `wallet_id → blink_wallets`, `amount numeric(14,2) check (amount <> 0)`, `balance_after numeric(14,2)`, `idempotency_key text unique not null`, `transaction_id → transactions null`, `ref_type text`, `ref_id text`, `memo text`, `actor_id uuid null` (staff), `created_at`
  - `kind text check in` ('opening_balance','deposit','withdrawal','trip','challenge_reward','offer_bonus','adjustment','reversal')
  - It is **append-only**: a trigger raises on UPDATE and DELETE.
  - Index on `(wallet_id, created_at desc)`.
- `blink_wallet_holds`:
  - columns: `transaction_id uuid pk → transactions`, `wallet_id`, `amount numeric(14,2) check > 0`, `status text check in ('active','released','captured')`, `created_at`, `resolved_at`
  - A pending (or in-review) withdrawal reserves funds here.

### Functions

All are `security definer` with `search_path = public`. EXECUTE is revoked from public/anon/authenticated and granted to `service_role`. Each one locks the wallet row (`for update`) before reading balance or held. Errors are raised with `P0001`, and the message is one of these codes: `insufficient_funds`, `wallet_frozen`, `not_pending`, `expired`, `wrong_agent`, `not_found`, `not_completed`, `not_in_review`.

- `blink_wallet_post(p_user, p_role, p_amount, p_kind, p_idem, p_txn default null, p_ref_type default null, p_ref_id default null, p_memo default null, p_actor default null, p_allow_negative default false) returns blink_wallet_entries`
  - Creates the wallet if it is missing.
  - If an entry with `p_idem` already exists, returns it (replay).
  - A debit fails with `insufficient_funds` if `balance + amount - held < 0`, unless `p_allow_negative`.
  - A frozen wallet refuses kind `withdrawal`; credits still land.
- `blink_cash_create_withdrawal(p_user, p_amount, p_fees, p_method, p_agent, p_shop, p_status, p_expires_at, p_client_ref, p_payout_account, p_pending_id) returns transactions`
  - Inserts the transaction **and** the hold in one statement.
  - Fails with `wallet_frozen` or `insufficient_funds` (available = balance − held).
- `blink_cash_complete(p_txn, p_agent, p_shop) returns transactions`, used by an agent confirming. It locks the transaction and requires all of:
  - `status = 'pending'`
  - `expires_at is null or expires_at > now()`, otherwise `expired`
  - `agent_id is null or agent_id = p_agent`
  - Then it sets `completed`, `completed_at`, `agent_id` and `shop_id`, and moves the money:
    - deposit: posts +amount, `deposit`, idem `txn:<id>`, plus the offer bonus (§4)
    - withdrawal: captures the hold, posting −amount, `withdrawal`, idem `txn:<id>`, and marks the hold `captured`
- `blink_cash_approve(p_txn, p_actor, p_reference)`: staff approval of an electronic request. It requires `status = 'review'` and moves the money the same way as complete, setting `reviewed_by/at` and `reference`.
- `blink_cash_cancel(p_txn, p_reason, p_actor)`:
  - Allowed from `pending` or `review` only.
  - Sets `cancelled`, `cancel_reason` (rider | agent | expired | staff | rejected), `cancelled_by` and `cancelled_at`.
  - Releases the hold.
- `blink_cash_reverse(p_txn, p_actor, p_reason)`:
  - Requires `status = 'completed'` and sets `reversed`, `reversed_by/at` and `reversal_reason`.
  - Posts the opposite entry (`reversal`, idem `reverse:<id>`, allow negative).
  - It also reverses an offer bonus (idem `reverse-bonus:<id>`).
  - Agent dues follow automatically, since they only count `completed` rows.
- `blink_cash_expire_pending() returns int`:
  - Cancels (`expired`) every `pending` row whose `expires_at < now()` and releases holds.
  - Scheduled with `pg_cron` every minute (`create extension if not exists pg_cron`). If the extension can't be created, the migration still succeeds and the server's lazy expiry covers it.

### Who posts what

Every post is idempotent by its key.

| Event | Where (server) | Entry |
|---|---|---|
| Agent confirms deposit / withdrawal | `routes/transactions/process.ts` → `blink_cash_complete` | ±amount, `txn:<id>` |
| Staff approves electronic | admin route → `blink_cash_approve` | ±amount, `txn:<id>` |
| Trip completed | `routes/riders/jobs.ts` (both places that set trips `completed`) | `tripWalletDelta(trip, fundedDiscount)`, `trip:<trip_id>`, kind `trip` (skip 0) |
| Rider challenge won | wherever `rider_challenge_participants.status` becomes `won` | +reward, `challenge:<challenge_id>:<rider_id>` |
| Staff adjustment | admin route | ±amount, `adjust:<uuid>`, kind `adjustment`, actor |
| Reversal | admin route → `blink_cash_reverse` | opposite, `reverse:<id>` |
| Offer bonus | inside complete/approve | +bonus, `bonus:<txn_id>` |
| Opening balance | backfill | derived − already posted, `opening:<user_id>` |

### Reading the balance

- `riderWallet(id)`:
  - If the wallet exists **and** `backfilled_at` is set, it returns `{ total: balance, available: balance − held, pending: held }`.
  - Otherwise it uses the old derived path, renamed `riderWalletDerived` and kept for reconciliation.
- `/riders/wallet` and the withdrawal check use it.

### Backfill (one-off, `POST /blink-cash/admin/ledger/backfill`, super_admin)

- For every rider (`rider_profiles`), it posts an opening entry of `derived.total − Σ posted entries` with idem `opening:<user>` (skipped when 0), and sets `backfilled_at`. It is safe to re-run.
- Legacy rows: the migration sets `expires_at = created_at + 15 min` on pending rows with no `expires_at`, so the old test rows expire on the first run. Holds are created only for withdrawals made after the deploy.

### Reconciliation (`GET /blink-cash/admin/reconciliation`)

- Per backfilled wallet: `ledger.balance` vs `riderWalletDerived().total + Σ(adjustment, offer_bonus entries)`.
- It returns the mismatches (|diff| > 0.01) and the totals: Σ balance (circulation), Σ held, wallet count and drift count.

## 2. Transaction lifecycle

- **Enum:** `transaction_status` gains `review` and `reversed`. Expired and rejected stay `cancelled`, with `cancel_reason`, to keep old app builds working.
- **New `transactions` columns:**
  - `expires_at`, `completed_at`, `cancelled_at`, `cancel_reason text`, `cancelled_by uuid`
  - `reviewed_by`, `reviewed_at`, `reference text`, `receipt_url text`, `payout_account jsonb`
  - `client_ref uuid` (unique per `user_id` when set), `reversed_by`, `reversed_at`, `reversal_reason`
  - `offer_id → blink_cash_offers`, `bonus_amount numeric(10,2)`, `staff_note`
- **Create (deposit / withdrawal):**
  - Fees come from settings.
  - Limits are checked (§3): per-transaction min/max, and daily and monthly (Algiers calendar) Σ of `pending + review + completed` per type and user. Errors are 400 with code `limit_min | limit_max | limit_daily | limit_monthly` and `{ limit, used }`.
  - `client_ref`: a replay returns the existing row (200).
  - Agent method: `pending`, `pending_id`, and `expires_at = now + pending_expiry_minutes`.
  - Withdrawals go through `blink_cash_create_withdrawal` (atomic hold).
  - Optional `pin`, required when `require_pin_for_withdrawal` is on.
- **Electronic, only when `electronic_enabled`:**
  - Deposit: needs a `reference`, `receipt_url` is optional, status `review`, no expiry.
  - Withdrawal: needs `payout_account {type: ccp|baridimob|rip|bank, number, holder}`, status `review`, and a hold.
  - Staff approve (money moves) or reject (`cancelled/rejected`, hold released).
  - When off, `400 electronic_unavailable`, as the hotfix does today.
- **Rider cancel:** `POST /transactions/{id}/cancel` (owner; `pending` or `review`) runs `blink_cash_cancel('rider')`.
- **Agent:**
  - `process` action `cancel` runs `blink_cash_cancel('agent')`.
  - `confirm` checks the agent cash limit (§5), then runs `blink_cash_complete`.
  - Database error codes map to 409/410/403 responses.
- **Lazy expiry:** `scan-qr`, `process`, `GET /transactions/{id}` and the list call `blink_cash_expire_pending()` for that row's owner/agent before reading, so an expired QR is never confirmed even without `pg_cron`.

## 3. Settings: table `blink_cash_settings`

There is one row, enforced with `id boolean primary key default true check (id)`.

| column | default |
|---|---|
| `deposit_fee_rate`, `withdrawal_fee_rate` | 0.02 |
| `min_amount` / `max_amount` | 1000 / 100000 |
| `daily_deposit_limit` / `daily_withdrawal_limit` | 200000 / 100000 |
| `monthly_deposit_limit` / `monthly_withdrawal_limit` | 1000000 / 500000 |
| `pending_expiry_minutes` | 15 |
| `agent_credit_limit` (default cash an agent may hold for Blink) | 200000 |
| `electronic_enabled` | false |
| `electronic_accounts jsonb` (Blink's receiving accounts `{label, type, number, holder}`) | `[]` |
| `require_pin_for_withdrawal` | false (turn on after the app update) |
| `quick_amounts int[]` | {1000,2000,5000,10000} |
| `dues_payment_methods jsonb` (`{id, label}` shown in the app) | cash at Blink office, CCP, BaridiMob |
| `adjust_limit_finance_admin` | 50000 |
| `updated_by`, `updated_at` | |

- The server caches settings for 30 s.
- `GET /blink-cash/settings` (any signed-in role) returns the public subset: fees, min/max, quick amounts, expiry, electronic flag and accounts, PIN requirement, and dues methods.

## 4. Deposit offers: table `blink_cash_offers`

- Columns: `id`, `title jsonb {en,fr,ar}`, `description jsonb`, `min_deposit`, `bonus_type ('fixed'|'percent')`, `bonus_value`, `max_bonus`, `starts_at`, `ends_at`, `active`, `per_user_limit int default 1`, `budget numeric null`, `used_count`, `used_amount`, `created_by`, `created_at`, `updated_at`.
- **Rider:** `GET /blink-cash/offers` lists live offers the rider can still use, in the shape the app's mock already has (see `hooks/use-rider-deposit-offers.ts`).
- **Deposit create:** accepts `offer_id`. Eligibility is checked at create and again at completion.
- **Bonus:** fixed, or percent capped by `max_bonus`. It is posted when the deposit completes, inside the same function, which locks the offer row and checks the budget and per-user limit. The amount is stored in `transactions.bonus_amount`.

## 5. Agents

- **Cash limit:** `agent_profiles.credit_limit numeric null` (null falls back to the settings default).
  - Confirming a deposit is refused with `409 agent_limit_reached` when `total_dues + amount > limit`. Withdrawals reduce dues, so they are always allowed.
  - `GET /agents/dues` adds `credit_limit` and `capacity`.
- **Pushes:**
  - When a rider's request is assigned to an agent's shop (create with shop, or `PATCH …/shop`), that agent gets "New deposit/withdrawal request · 5,000 DA".
  - At ≥ 80 % of the limit, the agent gets a push at most once a day.
- **Dues payments:**
  - New columns on `agent_dues_payments` and `merchant_dues_payments`: `reference`, `note`, `recorded_by`, `confirmed_by`, `confirmed_at`, `rejected_reason`. Merchant payments also gain `amount > 0`.
  - App payments stay `pending` until staff confirm them.
  - Staff can record a payment received (`completed` at once) or confirm/reject a pending one. Confirming or rejecting notifies the agent or merchant.

## 6. PIN

- **Hash:** `scrypt$<salt>$<hash>` (node `crypto.scrypt`). Legacy SHA-256 hashes still verify, and are rehashed on success.
- **Lockout:** `users.pin_failed_attempts`, `pin_locked_until`. After 5 failures the PIN is locked for 15 min, and verification returns 403 `pin_locked` with `retry_after`.
- **Shared helper:** `checkPin(user, pin)` is used by process, dues pay, withdrawal and `/auth/pin/verify`.
- **New route:** `POST /auth/pin/change {current_pin, new_pin}`. Setup keeps its overwrite behaviour, because the apps mirror the local PIN, and it clears the lockout.

## 7. Staff API

- Tag `admin-blink-cash` (so orval skips it), behind `requireStaffRole("finance_admin")`; super_admin always passes.
- Every write inserts a `finance_audit_events` row: `id`, `actor_id`, `action`, `target_type`, `target_id`, `amount`, `reason`, `details jsonb`, `created_at`.

| Route | Does |
|---|---|
| `GET/PUT /blink-cash/admin/settings` | read / update settings (validated) |
| `GET/POST /blink-cash/admin/offers`, `PATCH /…/offers/{id}` | offers CRUD (archive = `active false`) |
| `GET /blink-cash/admin/wallets?q&status&page` | wallets with name, phone, balance, held, status, last activity |
| `GET /blink-cash/admin/wallets/{user_id}` | wallet + paginated entries |
| `POST /blink-cash/admin/wallets/{user_id}/adjust {amount, reason}` | finance_admin within `adjust_limit_finance_admin` and never below 0. Super_admin is unlimited and may go negative. |
| `POST /blink-cash/admin/wallets/{user_id}/freeze {reason}`, `/unfreeze` | freeze / unfreeze, notifying the rider |
| `POST /blink-cash/admin/transactions/{id}/cancel {reason}` | stuck pending or review |
| `POST /blink-cash/admin/transactions/{id}/approve {reference}`, `/reject {reason}` | electronic review |
| `POST /blink-cash/admin/transactions/{id}/reverse {reason}` | completed → reversed |
| `POST /agents/admin/dues/{agent_id}/payments {amount, method, reference, note}` | record cash received |
| `POST /agents/admin/dues/payments/{id}/confirm`, `/reject {reason}` | pending app payment |
| `PATCH /agents/admin/{agent_id}/credit-limit {credit_limit \| null}` | per-agent limit |
| `POST /merchant/admin/dues/{store_id}/payments`, `POST /merchant/admin/dues/payments/{id}/confirm`, `/reject` | merchant equivalents |
| `POST /blink-cash/admin/ledger/backfill` | super_admin, §1 |
| `GET /blink-cash/admin/reconciliation` | §1 |

The admin summary's circulation now comes from Σ `blink_wallets.balance` once backfilled, with no per-rider calls.

## 8. Dashboard (`/blink-cash`, finance_admin + super_admin)

- **General rules:**
  - Reads use the service-role Supabase client behind `requirePathAccess("/blink-cash")`. Writes are server actions, guarded by `getStaffActor`, that call the staff API above through `blinkApi`.
  - i18n en/fr/ar, RTL logical properties, `formatDay`.
  - Empty, error and "migration not applied yet" states.
- **SubNav:** Overview · Ledger · Wallets · Review (badge) · Agents · Merchant dues · Offers · Settings · Audit.
- **Overview:**
  - Real KPIs: circulation, deposits/withdrawals, pending agent ops, review queue, frozen wallets, agent cash owed.
  - The chart.
  - "Needs attention": review queue, agents ≥ 80 % of limit, reconciliation drift, and dues payments awaiting confirmation.
  - The fee card reads from settings.
- **Ledger:**
  - Server-side filters in the URL (type, status, method, from/to, q = name/phone/txn id/pending id) and pagination.
  - User and agent names shown.
  - Detail page `/blink-cash/ledger/[id]`: timeline, linked wallet entries, and actions by status (pending → cancel; review → approve/reject; completed → reverse, with reason confirmation).
  - The CSV export route handler is wired to the Export buttons.
- **Wallets:**
  - List with search and status filter.
  - Detail `/blink-cash/wallets/[userId]`: balance / held / available, a statement with running balance, transactions, Adjust (credit/debit + reason), Freeze/Unfreeze, and a statement CSV.
- **Review:** electronic requests and pending dues payments (agents + merchants), with approve/reject.
- **Agents:**
  - The existing table plus a limit column (editable), a capacity bar and "Record payment".
  - Pending payments can be confirmed or rejected.
- **Merchant dues:** the existing Dues tab plus "Record payment" and confirm/reject.
- **Offers:** list plus a create/edit drawer.
- **Settings:** a form for every setting in §3.
- **Audit:** `finance_audit_events` with filters.
- **Reconciliation:** a card on Overview plus `/blink-cash/reconciliation` with "Run backfill" (super_admin).
- **Header "Export report":** a period CSV (summary + transactions).
- **Settings → Fees (delivery pricing):** stays as is. It is not Blink Cash, and it belongs to the Finance & Accounting project.

## 9. App (after `npm run api:sync` equivalent: merge only the new public routes into `openapi/openapi.json`, then `npm run api:gen`)

- **Rider:**
  - `use-rider-deposit-offers` reads `GET /blink-cash/offers`, keeping its return shape. add-money's recommended offers come from it, and a chosen offer is sent as `offer_id`.
  - Fees, min/max and quick amounts come from `GET /blink-cash/settings` (`hooks/use-blink-cash-settings.ts`). This replaces the hard-coded `FEE_RATE`, `MIN_AMOUNT`, `QUICK_AMOUNTS` and `RECOMMENDED_OFFERS`.
  - The `TODO(server)` cancels call `POST /transactions/{id}/cancel`.
  - The QR timer uses `expires_at`.
  - History and details show `review`, `reversed`, expired, rejected and staff-cancelled.
  - Withdrawal asks for the PIN and sends it when the setting requires it.
  - The electronic option is hidden unless `electronic_enabled`. When enabled, it shows Blink's accounts plus a reference (and optional receipt photo) → "Awaiting verification". Electronic withdrawals use a payout account form.
  - Error codes map to i18n messages.
- **Agent:**
  - A cash-position card on the Blink Cash home: owed / limit / capacity bar, with a warning at ≥ 80 %.
  - `agent_limit_reached` shows a message in the confirm flow.
  - The dues pay methods come from settings.
  - Pending payments show "Awaiting confirmation".
- **Merchant:** dues pay methods come from settings, and pending payments show "Awaiting confirmation".
- **Rules:** follow `~/blink/CLAUDE.md` (hooks wrap generated clients, i18n in 4 locales + `npm run i18n:check`, RTL rules, theme tokens, no new mock data).

## 10. Rollout

1. Migration (pg transaction plus a `schema_migrations` row).
2. Server to main (Render).
3. `POST …/ledger/backfill`, then reconciliation should show 0 drift.
4. Dashboard to main (Vercel).
5. App OTA (after checking the bundle and the API parity).
6. Turn on `require_pin_for_withdrawal` from Settings once the OTA is out.

## 11. Not in this project

- Customer wallet and paying for orders with Blink Cash.
- A card payment gateway (SATIM/CIB, Edahabia, Chargily).
- The general ledger / Finance & Accounting.
- Reviving the dead server cron jobs (search/bundle timeouts, scheduled notifications). This needs Render's `CRON_SECRET` and is reported separately.
