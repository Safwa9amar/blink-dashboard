# Support desk on real data (ERP mock module 5 of 5)

Date: 2026-10-15. In `/support`, Inbox (live chat), Knowledge base and AI are already real. **Overview, Tickets, SLA, CSAT, Agents and Macros** still render mock data from `src/features/support/data.ts` (TICKETS, VOLUME_SERIES, CHANNELS, SLA_DONUT, TOP_ISSUES, CSAT_*, AGENTS, SLA_POLICIES, RULES, MACROS, THREADS, CHATS…). Replace them with real data.

## Real data

- `support_conversations`: `id, user_id, user_role (customer|rider|merchant|agent), status (bot|waiting|assigned|resolved), assigned_agent_id, subject, locale, last_message_at, last_message_preview, unread_for_staff, created_at, updated_at`.
- `support_messages`: `conversation_id, sender (user|bot|agent|system), sender_id, body, meta jsonb, created_at`. System lines carry `meta.type`: `escalated` (bot → human queue, `meta.reason`), `assigned` (`meta.agentName`, `sender_id` = staff), `resolved` (`sender_id` = staff).
- A resolved conversation reopens in `bot` when the user writes again, so one conversation can hold several **cases**. A case = from an `escalated` event to the next `resolved` event (or still open).
- Staff = `users.staff_role` in (super_admin, support_admin) (see `/access`).

## Metrics (pure, `src/features/support/metrics.ts`, vitest)

From a conversation's messages, ordered by time, build its cases:
- `escalatedAt`, `firstResponseAt` (first `agent` message after escalation), `resolvedAt` (next `resolved` event), `assignedTo` (sender_id of the last `assigned` event in the case), `resolvedBy`.
- First response time = firstResponseAt − escalatedAt. Resolution time = resolvedAt − escalatedAt. Open cases measure against now.
- Bot containment = conversations that never escalated / all conversations.
- SLA: a case breaches when its first response or resolution time exceeds the policy for the conversation's priority (open cases breach once now passes the target).

## New DB (blink-server migration `20261015120000_support_desk.sql` + Drizzle schema)

- `support_conversations`:
  - `priority text not null default 'normal'`, check in (low, normal, high, urgent).
  - `csat_rating smallint`, check 1–5, null when not rated.
  - `csat_comment text`.
  - `csat_at timestamptz`.
- `support_macros`: `id uuid pk, title text not null, body text not null, locale text null (en|fr|ar, null = any), target_role user_role null, uses integer not null default 0, created_by uuid → users on delete set null, created_at, updated_at`. RLS on, no policies (service role only).
- `support_sla_policies`: `priority text pk (low|normal|high|urgent), first_response_minutes int not null, resolution_minutes int not null, updated_at, updated_by uuid`. RLS on, no policies. Seed: urgent 5 / 120, high 15 / 480, normal 60 / 1440, low 240 / 4320.

## blink-server

- `POST /support-chat/conversations/{id}/rate` (the conversation's owner, tag `support-chat`, in orval):
  - Body `{ rating: 1–5, comment?: string ≤ 500 }`.
  - Only when `status = resolved`; otherwise 409 `not_resolved`. Rating again overwrites the earlier one.
  - Adds a `system` message `meta.type = 'rated'`.
- `GET` conversation responses (user side) include `csat_rating` and `priority`, so the app knows whether to ask.
- `npm run openapi` regenerates the spec.

## Mobile app (blink)

- In the support chat screen(s), when the conversation is `resolved` and `csat_rating` is null, show a small card under the last message: "How did we do?" with 5 stars, an optional comment, then Send → `POST …/rate`, then "Thanks!".
  - Use the generated orval hook after `npm run api:sync`.
  - i18n in en/fr/ar/ch.
  - Follow the repo's CLAUDE.md (RTL, theming, i18n:check).
- Ships with the next OTA.

## Dashboard (`/support/*`)

All reads use the service-role `createAdminClient()` behind `requirePathAccess("/support")`. Writes go through server actions guarded by `getStaffActor("/support")`.

- **Overview:**
  - KPIs: open now (waiting + assigned) with unassigned count, new today, median first response (7 d), median resolution (7 d), SLA met % (7 d), CSAT average (30 d; "—" when there are no ratings yet).
  - Charts:
    - conversations per day (14 d, stacked: bot-only / escalated)
    - by role (donut)
    - top subjects (subject text, grouped case-insensitively)
    - bot containment rate
- **Tickets** (conversations as tickets):
  - Columns: subject, user (name, role badge), status, priority, assigned agent, unread, SLA badge (ok / due soon / breached, with time left or overdue), last activity.
  - Filters: status, role, priority, assignee (me / unassigned / anyone), search. URL-synced.
  - Row actions:
    - open in Inbox (existing route)
    - assign to me (existing server action `callServer …/assign`)
    - resolve (existing)
    - set priority (direct update)
  - Clicking a row opens the existing ticket detail / inbox thread when one exists. Otherwise link to `/support/inbox?c=<id>`.
- **SLA:**
  - Editable policy table (4 priorities, minutes shown as "1 h", "24 h"), saved to `support_sla_policies`.
  - Compliance per priority (7 / 30 d): first response met %, resolution met %.
  - Live list of open cases due soon (< 25% of target left) or breached.
  - Remove the mock "rules" (automation) section, or show it as "Coming later" if it has no data source. Prefer removal.
- **CSAT:** average, distribution 1–5, trend per week, response rate (rated / resolved), latest responses (rating, comment, user, agent who resolved, date). Empty state explains that ratings arrive from the app update.
- **Agents** (support staff): name, role, status (online when they sent a message in the last 15 min, else last active), open assigned, resolved (7 d / 30 d), median first response, CSAT average for cases they resolved.
- **Macros:**
  - CRUD for `support_macros` (title, body, locale, role).
  - Inbox composer: a "Macros" picker that inserts the body, filtered by the conversation's locale and role. It also increments `uses` (server action).
- Remove every mock export from `src/features/support/data.ts` that is no longer used. Keep the maps that decorate real enums (status/role variants).
- i18n en/fr/ar, RTL logical properties, `dir="auto"` on user text, `formatDay` for dates, relative times only after mount, KPI grids 2-col on phones.
- If the migration hasn't been applied yet (Postgres `42703` / `42P01` on the new columns or tables), degrade:
  - priority shows "normal"
  - CSAT shows its empty state
  - Macros/SLA show "Run the support desk migration" — never crash.
