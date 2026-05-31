# Blink — Admin Dashboard UI Kit

A high-fidelity, interactive recreation of the **Blink ops/admin console** — the desktop back-office
for fleet, deliveries, agents and support.

> **Grounded in real code.** This kit is rebuilt directly from the actual repo
> [`Safwa9amar/blink-dashboard`](https://github.com/Safwa9amar/blink-dashboard) (Next.js 15 + Tailwind v4 +
> Supabase). Color tokens are lifted verbatim from its `src/app/globals.css`; the sidebar, `StatCard`,
> `DataTable`, `Badge`, `PageHeader` and every page's columns/statuses mirror the real components and the
> `messages/en.json` copy. It is a cosmetic recreation — no Supabase, auth, or real data.

## Defining trait: dark by default
Unlike the bright, pink mobile apps, the dashboard ships **dark-themed by default** (`--background:#020617`,
cards `#1C1C1E`), with the Blink pink `#EE335F` as the single accent. A **light theme** is included and
toggleable (sidebar footer) — both palettes are the repo's exact values. The dashboard uses the **system
sans** stack (not Poppins) for body, with a monospace for IDs and money, matching the repo.

## Run it
Open `index.html`. A searchable, grouped fixed sidebar (Operations · People · Commerce · Money · Comms & System) switches between the views below. Type in the sidebar search to filter the menu.

| View | What it shows |
|------|---------------|
| **Overview** | 5 stat cards (Users, Riders, Orders, Trips, Transactions) + recent orders/trips. |
| **Demand** | Live demand-analytics view with an **Analytics ⇄ Map** toggle. Analytics: demand/supply by hour (peak marker), service-mix donut, zone × day-part heatmap, ranked top zones. Map: zone demand bubbles (sized & coloured by load) on a stylised coastal-Algiers canvas with rider dots, a legend, and a click-to-inspect side panel + surge suggestion. |
| **Users** | All platform users with role badges (customer / merchant / rider / agent) and status. |
| **Riders** | Rider profiles — ID, name, phone, wilaya, vehicle. |
| **Verification** | KYC & document review queue — applicants (rider/merchant/agent), document sets (RC, NIF, NIS, RIB, licence), statuses (pending/in-progress/rejected/missing-info/approved + reason) with Review actions. |
| **Orders** | Orders with the real status set (delivered, on_the_way, preparation, searching, pickup, canceled, merchant_rejected, heading_to_store). |
| **Trips** | Trips — pickup/dropoff, status (completed/upcoming/under_review/canceled), distance, payout. |
| **Transactions** | Deposits & withdrawals — method, amount, fees, total, status. |
| **Blink Cash** | Network wallet & ledger across all roles (replaces Finance). Sub-tabs: **Overview** (cash-in-circulation/deposit/withdrawal/dues/float stats, deposits-vs-withdrawals chart, wallet & fee config), **Ledger** (filterable cross-role transaction table: deposit_agent/online, withdrawal, trip_tax, dues_payment, commission), **Dues** (agents & merchants who owe Blink, with remind action), **Agent Float** (cash held per agent vs capacity). Mirrors the app's blink-cash flows: rider wallets, agent/merchant dues, deposit/withdraw via agents, PIN security. |
| **Promotions** | Public campaign manager with sub-tabs: **Campaigns** (category-filterable grid of full-image promo cards with Activate/Copy-code type, code chips, reach/used/CTR stats), **Create** (composer — cover, title/subtitle, category, action type activate vs copy-code + code, audience, budget, schedule, shareable toggle + live promo-card preview), and **Analytics** (weekly redemptions chart, by-service donut, revenue-lift cards). Public campaigns you browse — distinct from Coupons (owned vouchers). |
| **Coupons** | Personal voucher management — ticket-style cards (discount stub, code, min-order/max-discount, expiry countdown, points-locked rewards) + a Create-Coupon composer (percentage/fixed, thresholds, code, points-lock toggle) with a live ticket preview. Distinct from Promotions: coupons are owned & redeemed at checkout. |
| **Blink News** | In-app news/announcement CMS with sub-tabs: **All News** (posts with cover thumbnails, category + audience badges, reads/CTR/status), **Compose** (full composer — cover image, title, summary, category, audience/role targeting, body, CTA, schedule now/later, pin-to-top, send-push toggles + a live phone-card preview), and **Categories**. |
| **Agent Shops** | Agent deposit locations — open/closed, hours, rating, address. |
| **Support** | Full support back-office with sub-tabs: **Tickets** (dispute queue + CSAT cards), **Knowledge Base** (help articles with category, audience role badges, status, views), **Create Article** (editor with category, **audience/role targeting**, visibility, status/publish + live preview), and **Macros** (canned agent replies). |
| **Notifications** | Full notification system. The **10 real notification types** (order, courier, promo, offer, alert, security, announcement, news, benefit, deposit — from `types/notifications.ts`, icons/colours mirroring the app's `getIconConfig`) drive both **filtering** (type chip row + Type column on Campaigns) and **creation** (a type-picker grid in Compose that sets the push preview's icon/colour/label). Plus channel picker (push/in-app/email/SMS), trilingual title+message, audience role + segment, deep link, send-now/schedule, live reach estimate + lock-screen push preview, **Templates** (typed), and **Segments**. |
| **Notifications** | Sent notification feed with type badges. |
| **Settings** | Tabbed: General, Fees & Commission, Notifications, Security, Appearance (with live theme toggle). |

## Files
| File | What it is |
|------|-----------|
| `index.html` | Shell — loads React, Babel, `dash.css`, mounts the app (dark theme set on `<html>`). |
| `dash.css` | All styling. Theme tokens (`[data-theme="dark"]` / `[data-theme="light"]`) copied from the repo's `globals.css`. |
| `DashIcons.jsx` | Heroicon paths lifted verbatim from the repo sidebar + the Blink mark. |
| `parts.jsx` | Faithful `PageHeader`, `StatCard`, `Card`, `Badge`, `DataTable`, `Toolbar`, `Avatar` + demo data. |
| `views.jsx` | The nine page views — columns & status→variant maps mirror the repo pages. |
| `demand.jsx` | The **Demand** dashboard — demand/supply hourly chart, service-mix donut, zone heatmap, top-zone ranking, and the **map view** (zone bubbles on a stylised city). |
| `extras.jsx` | **Live Ops** (interval-updating activity feed, live counters, system health). |
| `support.jsx` | The **Support** module — Tickets, Knowledge Base, Create-Article editor (role/audience targeting + live preview), Macros. |
| `news.jsx` | The **Blink News** CMS — post list, full composer (cover, audience targeting, schedule, pin, push, CTA, live phone preview), categories. |
| `coupons.jsx` | The **Coupons** module — ticket-style voucher cards + create-coupon composer (thresholds, code, points-lock) with live preview. |
| `notifications.jsx` | The **Notifications** system — campaigns list, compose (channels/audience/segment/schedule + reach estimate + push preview), templates, segments. |
| `extras2.jsx` | **Verification (KYC)** view — grounded in the app's document-review flow. |
| `blinkcash.jsx` | The **Blink Cash** module — network wallet overview, cross-role ledger, dues, and agent-float views. |
| `promotions.jsx` | The **Promotions** module — campaign grid (category filter, full-image cards), create composer (activate/copy-code, audience, schedule, share) + live preview, and analytics. |
| `dash.jsx` | Settings view, `Sidebar`, `App` shell, theme state, mount. |

## Internationalization

Blink is trilingual — **Arabic (RTL), French, and English**. The content composers
(**Blink News**, **Notifications**, **Support → Create Article**) author each piece in all three
languages via a shared `<LangTabs>` control: an EN/FR/AR segmented switch (with a green dot marking
which languages are filled in), and inputs/preview that flip to **RTL** when Arabic is selected.
Mirrors the app's `next-intl` AR/FR/EN setup.

## Fidelity notes
- StatCard variants (`primary/success/info/warning/danger`), Badge variants, DataTable structure, and the
  sidebar's active treatment (`bg-soft-pink text-primary border-soft-border`, rounded-xl) match the repo.
- Status→badge mappings for orders and trips are copied from the repo's `statusVariant` maps.
- Demo rows (riders, orders, trips, agents…) are fictional but shaped like the real Supabase tables.
- Real repo extras not recreated here: Supabase data fetching, auth/login, i18n (AR/FR), per-row edit/delete modals.
