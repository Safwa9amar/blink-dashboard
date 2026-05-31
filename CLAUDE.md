<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Blink Dashboard

The admin console for **Blink** — a multi-service delivery super-app for the Algerian market (currency **DZD**, displayed as **"Da"**). One codebase serves two surfaces from the same Next.js app: a public **marketing landing site** and an authenticated **ops/admin dashboard**, split by subdomain at the middleware layer.

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2** — see the Next.js rules above; verify APIs against `node_modules/next/dist/docs/` before writing.
- **Tailwind CSS v4** (CSS-first config via `@theme inline` in `src/app/globals.css` — no `tailwind.config.js`).
- **next-intl 4** — trilingual: English, French, Arabic (RTL). Config in [src/i18n/config.ts](src/i18n/config.ts). Strings are **co-located, not in a single root `messages/` folder** — see [i18n](#i18n-trilingual--co-located) below.
- **Supabase** (`@supabase/ssr`) for auth/data — clients in [src/lib/supabase/](src/lib/supabase/).
- **Zustand** for the few client-side stores, **react-hook-form** for forms, **@tanstack/react-table** behind `DataTable`, **motion** for the custom scrollbar.
- TypeScript, ESLint (`eslint-config-next`). Deployed on Vercel.

## Architecture

- **Subdomain routing** ([src/middleware.ts](src/middleware.ts)): requests to a `dashboard.*` host are internally rewritten to `/d/*` and gated by Supabase auth (`updateSession` from [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts) — unauthenticated → `/login`, authenticated-on-`/login` → `/`). On the main domain, `/d` routes are blocked (rewritten to `not-found`). `/login` is shared by both surfaces. The matcher skips static assets.
- **Landing site** — [src/app/(landing)/](<src/app/(landing)/>): the home `page.tsx` + 16 footer pages (about, blink-pay, careers, courier, drive, driver-app, driver-hub, earnings-calculator, for-business, marketplace, press, privacy, rides, safety, support, terms). Shared shell in `(landing)/components/page-shell.tsx` (Nav + Footer) and `content.tsx` (Section/FeatureGrid/CTA/…); styling in [src/app/landing.css](src/app/landing.css) (its own `--brand`/`--ink` token set, separate from the dashboard tokens).
- **Dashboard** — [src/app/d/](src/app/d/): routing + server data only. Each route is a thin **triad** (below) that composes UI from `src/features/` and `src/components/ui`. Chrome (sidebar, theme/lang switchers, scrollbar) lives in `d/layout.tsx` → [src/components/dashboard-shell.tsx](src/components/dashboard-shell.tsx) + [src/components/sidebar.tsx](src/components/sidebar.tsx).
- **Root layout** ([src/app/layout.tsx](src/app/layout.tsx)) loads Google fonts (Poppins/Inter/Arimo) for the **landing**, wraps `NextIntlClientProvider`, sets `<html lang dir>` from the locale, and runs an inline pre-paint script that applies the saved `data-theme` to avoid a flash.

## Dashboard routes (`src/app/d/`)

Sidebar nav, grouped (labels & order from [src/components/sidebar.tsx](src/components/sidebar.tsx); keys are translated):

- **Operations** — Overview `/` · Demand · Live Ops · Orders · Trips
- **People** — Users · Riders · Verification
- **Commerce** — Marketplace · Agent Shops · Promotions · Coupons · News
- **Money** — Blink Cash (the single finance hub: deposits, withdrawals, dues & agent float; the old standalone Transactions page folded into its **Ledger** tab and `/transactions` now redirects here)
- **System** — Support · Notifications · Deep Links · Settings

**Data source per route** — most pages are **mock/seed-driven** (data lives in the feature's `data.ts` or a client store). Only these fetch real Supabase data in `page.tsx`:

| Route           | Supabase query                                               | Mutates?                                                                                       |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `/` (overview)  | counts of users, rider_profiles, orders, trips, transactions | —                                                                                              |
| `/users`        | `users` table                                                | **yes** — [src/app/d/users/action.ts](src/app/d/users/action.ts) (toggle active, edit, delete) |
| `/orders`       | `orders` (limit 50)                                          | —                                                                                              |
| `/riders`       | `rider_profiles` ⨝ `users` (limit 50)                        | —                                                                                              |
| `/trips`        | `trips` (limit 50)                                           | —                                                                                              |
| `/blink-cash`   | `transactions` (limit 50) — feeds the **Ledger** tab & Overview "latest activity" | —                                                                         |
| `/agent-shops`  | `agent_shops`                                                | —                                                                                              |

`/transactions` is now a **redirect → `/blink-cash`** (no UI of its own). Within Blink Cash, only the **Ledger** is real data; the **Dues** and **Agent Float** tabs (and the deposits-vs-withdrawals chart, fee config & headline stats) stay UI aggregates over mock data — the mobile app derives them client-side and there are no DB tables for them.

Everything else (`coupons`, `deep-links`, `demand`, `live-ops`, `marketplace`, `news`, `notifications` + `notifications/[id]`, `promotions`, `settings`, `support`, `verification`) is presentational over mock data — safe to iterate on without a database.

## Feature-first layout (`src/features/`)

The codebase follows a **feature-first** structure (see the Next.js "split by feature" strategy in `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`). `src/app/` is for routing/data; each domain owns its code under [src/features/](src/features/).

**The 13 feature folders:** `blink-cash`, `coupons`, `deep-links`, `demand`, `live-ops`, `marketplace`, `news`, `notifications`, `promotions`, `settings`, `support`, `users`, `verification`.

A feature folder holds:

- a **`components/` folder, one React component per file** (kebab-case). Each imports the UI kit from `@/components/ui` and data/types from `../data`. Mark a component `"use client"` **only when it uses hooks**.
- **`data.ts`** — mock/seed data + re-exported types (most features; `settings` and `users` have none — they're driven by Supabase rows or static config).
- **`types.ts`** — domain types (a `TFn` translator type recurs across features).
- a public **`index.ts` barrel** — the only allowed import surface: `@/features/<name>`, never deep paths.
- **`locales/{en,fr,ar}.json`** — the feature's own strings (all 13 have these).
- some features also keep a **`store.ts`** (Zustand) for client-side state: `deep-links`, `marketplace`, `notifications`.

> **Route vs. feature:** a route under `src/app/d/<name>/` may compose a matching feature (e.g. `/coupons` → `@/features/coupons`), or hold its view directly in `client.tsx` with co-located locales and no feature folder — this is the case for the Supabase-backed list routes `agent-shops`, `orders`, `riders`, `trips`, and `blink-cash` (the latter composes the `@/features/blink-cash` components but fetches the `transactions` ledger in its own `page.tsx`).

**`src/components/`** holds only cross-feature code: `ui/` (the shared UI kit, below) and standalone chrome — `dashboard-shell.tsx`, `sidebar.tsx`, `theme-switcher.tsx`, `language-switcher.tsx`, `motion-scrollbar.tsx`.

**`src/lib/`** is cross-cutting infra: `supabase/{server,client,middleware}.ts` (server client uses cookie sessions; `client.ts` is the browser factory; `middleware.ts` does the auth refresh/gate), `theme.ts` (color tokens mirroring the mobile app), `dash-metadata.ts` (`pageMeta()` builds per-page `<title>` from translations), `use-document-title.ts` (client hook for live badge titles).

### App page triad (`src/app/d/<name>/`)

Each dashboard route folder follows a strict triad so `app/` stays routing/data only:

- **`page.tsx`** — the server entry. Either fetches data (`createClient()` from `@/lib/supabase/server` + a query, passing only serializable props — rows, counts, `error?.message`) or just renders `<Client />` with `pageMeta()` for mock pages. No `"use client"`.
- **`client.tsx`** — `"use client"`; **holds the view**. Owns `useTranslations`, column/render definitions, local state, and the JSX. Composes the feature's components from `@/features/<name>` and primitives from `@/components/ui`. Default export `function <Name>Client()`.
- **`action.ts`** — `"use server"` mutations, **only when the page actually mutates data**. Currently only `users` has one; read-only pages omit it. Client components import server actions from `@/app/d/<name>/action`.

When adding a dashboard domain: create `src/features/<name>/` (`components/*` + `data.ts` + `types.ts` + `locales/*` + `index.ts`), then the `src/app/d/<name>/` triad (`page.tsx` → `client.tsx` → `action.ts` if it mutates), and add the nav entry in `sidebar.tsx`.

### The UI kit (`src/components/ui/`)

The single source of shared UI — **one component per file**, all re-exported from `@/components/ui` (the barrel). Never reintroduce a parallel `dash/` kit — extend `ui/` instead. Current surface:

- **Non-visual helpers** (`primitives.ts`): `Variant` (semantic color union), `Lang`/`LANGS`/`emptyLang`/`dirFor` (trilingual), `toggleInList` (multi-select with exclusive "All"), and class fragments `btnBase`/`btnPrimary`/`btnSecondary`/`fInput`.
- **Icons** (`icons.tsx`): `DashIcon` (renders by name from the `DI` path map), `DI`, `BMark` (brand mark).
- **Core:** `Button`, `Badge`, `Card` + `CardHeader`, `StatCard`, `StatGrid`, `DataTable` (+ `Column<T>`), `EmptyState`, `PageHeader`, `Modal`.
- **Layout / chrome:** `Toolbar`, `SearchBox`, `Avatar`, `NameCell`, `Toggle`, `LivePill`, `Segmented`, `RoleChips`, `FilterPills`, `FormRow`, `SubTabs` (+ `SubTab`), `LangTabs`.
- **Charts:** `Donut` (+ `DonutSegment`), `ColumnChart` (+ `ColumnDatum`), `Legend`, `ChartHead`.

Conventions worth knowing: `Button` and `StatCard` accept `icon` as a **DashIcon name string or a ReactNode**; `Card` renders an optional inline header via `title`/`description`/`action` (+ `bodyClassName`); `Modal` closes on backdrop click and Escape; `DataTable` is TanStack-backed with sorting + pagination and takes `Column<T>[]`.

## i18n (trilingual & co-located)

- Locales live in [src/i18n/config.ts](src/i18n/config.ts): `en` (default, LTR), `fr` (LTR), `ar` (**RTL**). Active locale is read from the **`NEXT_LOCALE` cookie** in [src/i18n/request.ts](src/i18n/request.ts) and written by [src/i18n/actions.ts](src/i18n/actions.ts) (the `language-switcher`).
- **Strings are distributed, not centralized.** There is **no root `messages/` directory.** They come from three places, all merged by `getAllMessages()` in [src/i18n/messages.ts](src/i18n/messages.ts) into the flat object next-intl expects:
  1. **Shared** — [src/i18n/messages/{en,fr,ar}.json](src/i18n/messages/) (namespaces: `landing`, `common`, `auth`, `language`, `sidebar`, `dash`).
  2. **Per feature** — `src/features/<name>/locales/{en,fr,ar}.json`.
  3. **Per Supabase-backed route** — `src/app/d/<name>/locales/{en,fr,ar}.json` (`agent-shops`, `orders`, `riders`, `trips`, plus the dashboard-root `src/app/d/locales/`). The `blink-cash` strings live in the feature bundle (`src/features/blink-cash/locales/`).
- **When you add or change copy, edit all three languages** and register any new bundle in `messages.ts`. Respect RTL for Arabic (use logical classes — `ms-`/`me-`, `ps-`/`pe-`, `start`/`end`, `rtl:` — and the `dirFor(lang)` helper).

## Theming

Dark/light via a `data-theme` attribute on `<html>` — toggled in [src/components/theme-switcher.tsx](src/components/theme-switcher.tsx), persisted to `localStorage`, applied pre-paint by the inline script in the root layout. Tokens are defined as CSS variables in [src/app/globals.css](src/app/globals.css) under `[data-theme="dark"]` (the dashboard default, `--background: #020617`) and `[data-theme="light"]`. The dashboard intentionally renders with a **system-ui font stack** (`--font-sans`) — no Google fonts on the admin surface.

## Design system — `.blink-design-system/`

A **handoff bundle from Claude Design** (HTML/CSS/JS prototypes) is the brand source of truth. Read [.blink-design-system/project/README.md](.blink-design-system/project/README.md) for the full system; the `ui_kits/dashboard/` kit is a faithful recreation of this very repo. Treat prototypes as visual spec — recreate pixel-perfectly in React, don't copy their internal structure.

Brand essentials (reference the CSS vars in `globals.css`, never hardcode hex):

- **Color:** one dominant **Blink raspberry `#EE335F`** (`--primary`, hover `--primary-hover`) on cool slate neutrals; pale-pink tints (`--soft-pink`) for info surfaces. Dark is the dashboard default. Use semantic vars: `--text`, `--subtext`, `--card`, `--card-hover`, `--border`, `--muted`, `--success/danger/info/warning(-light)`.
- **Type:** **Poppins** for headings/buttons/numbers (+0.04em tracking), **Inter** for body/UI in the design kit and on the landing site. (The admin dashboard renders with the system-ui stack — see Theming.)
- **Shape:** pill buttons & inputs, 16px cards with soft low-contrast shadows, generous radii. Voice is energetic, casual, Title Case labels; money shown as a big bold figure with an all-caps label above (`BALANCE` → **2450 Da**).
- **Icons:** clean rounded line icons; the source app maps SF-Symbol names → Material Icons. Dashboard icons live in [src/components/ui/icons.tsx](src/components/ui/icons.tsx) (`DashIcon`/`DI`).

## Conventions

- Reference design tokens through the Tailwind theme vars (e.g. `bg-card`, `text-subtext`, `border-border`) rather than literal colors.
- Keep all user-facing copy in the co-located `locales/*.json` across **all three** locales; respect RTL for Arabic.
- Import features and the UI kit only through their barrels — `@/features/<name>` and `@/components/ui`, never deep paths.
- `npm run dev` to develop · `npm run build` · `npm run lint`.
