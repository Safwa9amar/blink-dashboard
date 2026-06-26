# Blink Server — Monitoring Roadmap

Plan to turn the **Blink Server** monitoring page (`/d/blink-server/*`) from a live
log tail into a full ops dashboard. Each phase is a self-contained task you can
ship in roughly a day. Phases are ordered by value/effort — do them top to bottom.

The four new tabs (**Health · Traffic · AI Insights · Alerts**) already exist as
**UI placeholders** rendering sample data behind a `PreviewBanner`. Each phase
below replaces one placeholder's sample data with a real, instance-aware feed.

## How a phase is built (the pattern every tab already follows)

Monitoring data lives in the **blink-server process**, so the flow mirrors the
existing Live Logs / AI Log tabs:

1. **blink-server** — add/extend a super-admin endpoint (e.g. `GET /metrics`) on the
   Hono app, guarded the same way `/logs` is. Keep it cheap (in-memory counters /
   `process` stats), no new DB tables unless a phase says so.
2. **dashboard server action** — add `src/app/d/blink-server/<name>-action.ts`
   (`"use server"`) that proxies to the endpoint with the operator's staff JWT and
   the selected `instance` — copy `logs-action.ts` verbatim and swap the path.
3. **dashboard component** — replace the sample constants in the placeholder with a
   poll (`useEffect` + `setInterval`, `POLL_MS`) or a one-shot fetch, keyed by
   `instance` so switching Online/Local resets cleanly (see `LiveLogs`).
4. **i18n** — strings already exist under `blink_server.<tab>` in `locales/{en,fr,ar}.json`.
   Add keys for anything new in **all three** locales.

Reference files: `components/live-logs.tsx`, `app/d/blink-server/logs-action.ts`,
`components/instance-switcher.tsx`, `instance-base.ts`.

---

## Phase 0 — Quick wins on the existing Live Logs tab  · ~½ day

Small, high-impact fixes to what already ships. No new tab.

- **Strip ANSI color codes.** Log lines currently render raw escape sequences
  (`[32m200[0m`, `[0m 297ms`). Either strip ANSI in the backend log ring buffer, or
  emit structured JSON log entries (preferred — unlocks Phase 3 search/filter).
- **Persisted scrollback.** `Clear` wipes the in-memory buffer; add a download/copy
  of the current buffer before clearing.
- **Auto-scroll lock.** Pause auto-scroll when the operator scrolls up; resume at bottom.

**Acceptance:** logs render clean, colored-by-level text; no raw escape codes.
**Files:** `blink-server` logger, `components/live-logs.tsx`.

---

## Phase 1 — Health: vitals strip (real `process` stats)  · ~1 day

The `StatGrid` + resource bars on the **Health** tab.

- **blink-server:** `GET /metrics` returns `{ uptimeMs, rss, heapUsed, heapTotal,
  cpuPct, eventLoopLagMs, reqPerMin, errorRatePct, avgLatencyMs }`. Uptime/memory
  from `process.uptime()` / `process.memoryUsage()`; event-loop lag via a
  `setInterval` drift probe; req/min, error-rate and avg-latency from a rolling
  in-memory counter updated in the request logger middleware.
- **dashboard:** `metrics-action.ts` + poll in `server-health.tsx`; replace the four
  `StatCard`s and the three `ResourceBar`s with live values.

**Acceptance:** vitals + resource bars reflect the live server; Online/Local switch works.

---

## Phase 2 — Health: latency & status charts  · ~1 day

The `ColumnChart` (latency) + `Donut` (status codes) on the **Health** tab.

- **blink-server:** extend the rolling counter to bucket per-minute **p50/p95** latency
  and **2xx/4xx/5xx** counts; expose under `GET /metrics` (or `/metrics/history`).
- **dashboard:** feed the real series into the existing `ColumnChart` / `Donut`.

**Acceptance:** latency percentiles and status mix update live; charts already themed.

---

## Phase 3 — Live Logs: search, filter & persistence  · ~1–2 days

Upgrade the existing Live Logs tab into a real log explorer.

- **blink-server:** structured log entries (`{ ts, level, method, route, status, ms,
  traceId, msg }` — depends on Phase 0); `GET /logs` accepts `q`, `level`, `route`,
  `status` query params.
- **dashboard:** add a `SearchBox` + route/status `FilterPills` above the tail;
  click a line to expand full request context; download current buffer.
- **(optional)** persist beyond the 500-line ring buffer (append to a file or a
  `server_logs` table) so history survives a restart.

**Acceptance:** operator can search/filter the tail and inspect a single request.

---

## Phase 4 — Traffic: endpoint analytics  · ~1–2 days

The leaderboard + status/volume charts on the **Traffic** tab, with a working
time-range selector.

- **blink-server:** `GET /metrics/traffic?range=15m|1h|24h` → top endpoints
  (method, route, hits, avg ms, err%), status breakdown, and per-bucket request
  volume. Aggregate from the structured request log.
- **dashboard:** wire the `Segmented` range control to refetch; fill the table,
  `Donut` and `ColumnChart`.

**Acceptance:** real top routes, status mix and volume for the selected window.

---

## Phase 5 — AI Insights: token/cost rollups  · ~1 day

The **AI Insights** tab, built on the data the **AI Log** tab already tails
(`/ai-logs` carries tokens, latency, status, provider/model).

- **blink-server:** `GET /ai-metrics?range=…` aggregating the existing AI call log:
  total calls, prompt/completion tokens, est. cost (token×price per model),
  avg latency, per-model status + limit-hit counts.
- **dashboard:** replace sample constants in `ai-insights.tsx`.

**Acceptance:** token usage, cost-by-model and per-model health reflect real bot activity.

---

## Phase 6 — Alerts: rules engine + delivery  · ~2–3 days

The **Alerts** tab — the only phase needing persistence.

- **DB (blink-server / Drizzle):** `alert_rules` (metric, comparator, threshold,
  window, severity, enabled, channels) and `alert_events` (rule, fired_at,
  resolved_at, value, status). Author in `src/db/schema/`, write the matching
  `supabase/migrations/NNNNN_alerts.sql`, add RLS (super-admin only). Keep the
  dashboard's local row types in sync.
- **blink-server:** an evaluator (interval job) that checks rules against the rolling
  metrics from Phases 1–2/5 and writes `alert_events`; a notifier that fans out to
  channels — start with the existing in-app **Notifications** + bell, then email /
  WhatsApp.
- **dashboard:** CRUD for rules (persist the toggles), live alert history, channel
  config — `alerts-action.ts` for the mutations.

**Acceptance:** crossing a threshold writes an event and delivers a notification;
rules persist and can be muted.

---

## Sequencing summary

| Phase | Tab | Backend | DB? | Est. |
| --- | --- | --- | --- | --- |
| 0 | Live Logs | log formatting | no | ½d |
| 1 | Health | `GET /metrics` (vitals) | no | 1d |
| 2 | Health | latency/status buckets | no | 1d |
| 3 | Live Logs | structured logs + query | optional | 1–2d |
| 4 | Traffic | `GET /metrics/traffic` | no | 1–2d |
| 5 | AI Insights | `GET /ai-metrics` | no | 1d |
| 6 | Alerts | rules engine + notifier | **yes** | 2–3d |

Phases 1→2→4→5 share one rolling-metrics counter in blink-server — build it in
Phase 1 and extend it. Phase 6 depends on that counter existing, so do it last.
