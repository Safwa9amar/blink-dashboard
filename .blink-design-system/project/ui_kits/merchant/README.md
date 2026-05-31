# Blink — Merchant UI Kit

A high-fidelity, interactive recreation of the **Blink Merchant** mobile app. Built from the
[`App Merchant Interface`](../../merchant-spec.txt) spec and styled to match the existing **Agent**
and **Customer** apps in the Blink Figma (crimson hero cards, frosted bottom nav, pill buttons,
DZD money treatment, Poppins/Inter type).

> The Merchant app was specced but **not yet designed** in the source Figma (`Merchant-UI-not-yet`,
> 0 frames). This kit is the first visual realization of it, derived from the written spec and the
> sibling Agent app's visual system.

## Run it
Open `index.html`. It renders a single phone frame that scales to fit. Everything is click-through:

- **Bottom nav:** Home · Blink Cash · Profile · Earnings
- **Home** → tap *Dashboard*, *My Stores*, *Switch Store* (sheet), the *Dues* readout, bell, or location pin
- **Blink Cash** → enter any 4-digit PIN to unlock the wallet → expand a store's dues → *Pay Dues* (method sheet)
- **Profile** → *My Profile* (Overview / Documents toggle), *My Stores*, *Blink Cash & Dues*, *Log Out* (confirm sheet)
- **Earnings** → toggle the eye, expand *Gross Income* / *Commissions & Taxes*, open period & store-scope sheets

## Files
| File | What it is |
|------|-----------|
| `index.html` | App shell: phone frame, font/CSS load, Babel + React, viewport scaling. |
| `Icon.jsx` | `<Icon name … />` + `<BlinkMark />`. Inline SVG icon set (Lucide-style line icons) — single source of truth for all glyphs. |
| `Chrome.jsx` | `StatusBar`, `TopBar`, `BottomNav`, `Sheet` (bottom-sheet overlay). |
| `Home.jsx` | Merchant Home — dues top bar, greeting hero + store switcher, action grid, Blink News carousel. |
| `Earnings.jsx` | Earnings — crimson summary hero, collapsible Gross Income & Commissions, recent operations. |
| `Profile.jsx` | Profile hub (avatar + completion ring, KPIs, menu) and the My Profile form (Overview / Documents). |
| `Cash.jsx` | Blink Cash — PIN gate, total-dues card, per-store collapsible dues, Pay-Dues method sheet. |
| `Stores.jsx` | My Stores — **Products** tab (search, category chips, live stock/price steppers, low-stock alerts, add product) + **Store Details** tab (profile, KPIs, documents). Also the Dashboard. |
| `app.jsx` | Router + phone frame + all sheets (switch store, location, pay, period, scope, logout) + Notifications. |

## How components share scope
Each `text/babel` script is compiled in isolation, so every component file ends with
`Object.assign(window, { … })` to publish its exports. `app.jsx` consumes them globally and mounts `<App />`.
Reuse a piece by loading its file (and `Icon.jsx` + `Chrome.jsx`) before your own script.

## Coverage vs. spec
**Built:** Merchant Home, Earnings (+ period/scope), Profile hub, My Profile (Overview + Documents),
My Stores (+ documents/status), Dashboard, Blink Cash (PIN + dues + pay flow), Notifications, and the
core sheets (switch store, location, logout).

**Intentionally stubbed** (shown via a "not in this kit yet" sheet): Challenges, Merchant Benefits,
Help & Support, Settings, full Strategy Improvement, and the shared onboarding flow (Splash, Signup,
OTP, Select Client Type, Tutorial Video) — those are shared across apps and live in the Customer/Rider
kits. The spec text is preserved verbatim in `../../merchant-spec.txt`.

## Notes
- Icons are inline SVG (not an icon font) for pixel-stable rendering everywhere. They match the design
  system's documented clean rounded line-icon vocabulary.
- Currency is **DZD** throughout; sample data (Karim Benali / Karim Électro / Karim Mobile) is fictional.
- This is a cosmetic prototype — no real auth, payments, or persistence.
