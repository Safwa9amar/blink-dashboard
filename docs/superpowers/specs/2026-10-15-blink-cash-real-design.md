# Blink Cash: real headline stats, chart and Agent float (ERP mock module 4 of 5)

Date: 2026-10-15. Still mock today in the dashboard (`src/features/blink-cash/data.ts`): 4 of 5 Overview stats (circulation 8.4M, deposits 1.9M, withdrawals 1.2M, agent float 640K), the deposits-vs-withdrawals chart (`BC_WEEK`), and the whole **Agents** tab (`AGENT_FLOAT`). The Ledger (`transactions`) and merchant Dues (blink-server `GET /merchant/admin/dues`) are already real.

Money rules are blink-server's (`src/lib/agent-finance.ts`, `riderWallet` in `src/lib/dispatch.ts`). The dashboard must not re-implement them: blink-server gets two staff endpoints, the dashboard calls them through `blinkApi` exactly like merchant dues (`src/app/d/blink-cash/data.ts` `getMerchantDues`). No DB migration.

## blink-server (new, tag `admin-blink-cash` / `admin-agents`, excluded from orval like `admin-merchant`)

Gate: `requireStaffRole("finance_admin")` (super_admin always allowed), same as merchant admin dues.

### `GET /blink-cash/admin/summary?days=7|30|90` (default 30) → `AdminBlinkCashSummary`

New router `src/routes/blink-cash/admin.ts` mounted at `/blink-cash` in `src/app.ts`.

```ts
{
  window_days: number,
  generated_at: string,
  circulation: { total: number, available: number, pending_withdrawals: number, wallets: number }, // Σ riderWallet() over every rider (rider_profiles.user_id); wallets = riders with total != 0
  deposits:    { count: number, amount: number },   // completed, created in window
  withdrawals: { count: number, amount: number },   // completed, created in window
  fees:        { total: number, platform: number, tax: number, agents_net: number }, // splitFee over completed agent ops in window
  pending:     { count: number, amount: number },   // status = pending now (any age)
  agent_cash:  { owed_to_blink: number, credit: number, agents_owing: number, agents: number }, // Σ agent dues (all time)
  daily: { date: string /* YYYY-MM-DD, Africa/Algiers */, deposits: number, withdrawals: number, deposits_count: number, withdrawals_count: number }[] // every day in the window, zeros included
}
```

### `GET /agents/admin/dues` → `AdminAgentDuesResponse`

In `src/routes/agents/` (new `admin-dues.ts`, mounted under the existing agents router).

```ts
{
  agents: {
    agent_id: string, name: string | null, phone: string | null,
    shops_total: number, shops_open: number,
    primary_shop: { id: string, name: string, address: string | null, lat: number | null, lng: number | null } | null,
    deposits: { count: number, amount: number },      // completed, all time
    withdrawals: { count: number, amount: number },   // completed, all time
    operations_30d: number,
    fee_income_net: number,                           // agent's net fees, all time (splitFee().net)
    total_dues: number, credit: number,               // exactly computeAgentDues()
    last_operation_at: string | null, last_payment_at: string | null,
    rating_avg: number | null, ratings_count: number  // transactions.rating on completed ops
  }[],                                                // every user with an agent_profiles row (or agent shop), sorted by total_dues desc
  payments: { id, agent_id, agent_name, amount, fees, method, status, created_at }[] // agent_dues_payments, newest 100
}
```

Batch the reads (one query per table, then group by agent) instead of calling `computeAgentDues` per agent; put the batched math in `agent-finance.ts` next to `computeAgentDues` and unit-test that both give the same result for the same rows.

### `POST /agents/admin/dues/{agent_id}/remind` → `{ ok: true }`

Sends the agent an in-app notification + push ("You owe X DA in Blink Cash dues", en/fr/ar like merchant reminders) linking to the agent app's dues screen. 409 `nothing_outstanding` when dues are 0; 429 `reminded_recently` within 24 h (same cooldown helper/approach as merchant dues); 404 unknown agent.

Validators (Zod) + OpenAPI entries; `npm run openapi` must still pass. Tests for the batched dues and the summary's daily bucketing.

## Dashboard

- `src/app/d/blink-cash/data.ts`: `getBlinkCashSummary(days)` and `getAgentDues()` via `blinkApi(..., { roles: DUES_ROLES })`, cached per request, never throwing (inline error like merchant dues). `action.ts`: `remindAgentDues(agentId)` like `remindMerchantDues`.
- **Overview** (`/blink-cash`):
  - 5 stats, all real: Money in wallets (circulation.total, sub: N wallets, pending withdrawals), Deposits (window amount + count), Withdrawals (window amount + count), Merchant dues (existing), Agent cash owed to Blink (agent_cash.owed_to_blink, sub: N agents owing). Streamed with Suspense like the dues stat so a slow report never blocks the page.
  - Chart: deposits vs withdrawals per day from `daily`, with a 7/30/90-day Segmented (`?days=`), legend, empty state. Fee split line under the chart: platform revenue, tax, agents' net.
  - Delete `BC_WEEK`.
- **Agents** tab (`/blink-cash/agents`), replaces `AGENT_FLOAT`:
  - KPIs: agents, agents owing, total owed to Blink, total credit, operations (30 d).
  - Table: agent (name + phone), primary shop + address, shops open/total, deposits (count/amount), withdrawals, net fees, **owed to Blink** (or "credit X"), exposure badge (owed ≥ 50,000 DA = high, ≥ 20,000 = medium), last operation (relative), rating ★. Search, sort, filter (owing / credit / high exposure).
  - Row action: **Remind** (finance roles; disabled with reason after 409/429, like the merchant RemindButton).
  - Map (`OpsMap` from `@/components/map/ops-map`): each agent's primary shop, circle radius by owed amount, color by exposure; popup with name, owed, last op.
  - Recent dues payments table (payments list).
- i18n en/fr/ar (blink-cash locales), RTL logical properties, `dir="auto"` on names, `dir="ltr"` on phones, `formatDA` for money, `formatDay` (from `@/features/promotions`) for dates.
- If blink-server isn't deployed yet (404 from the new endpoints), the stats/tab show a clear "report unavailable" state, not a crash.
