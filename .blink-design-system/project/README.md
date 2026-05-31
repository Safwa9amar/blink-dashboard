# Blink Design System

**Blink** is a multi-service delivery **super-app** built for the Algerian market (currency: **DZD**, displayed as **"Da"**). One brand, three connected apps that form a single logistics + payments network:

| App | Audience | Purpose |
|-----|----------|---------|
| **Customer UI** | End users | Order food, shop the marketplace, request a courier, book rides. Browse deals, track orders, manage profile/addresses. |
| **Rider UI** | Couriers / drivers | Go online, accept trip requests, navigate, track earnings, manage vehicle docs, run **Blink Cash** wallet, complete challenges. |
| **Agent UI** | Cash agents | The cash-in / cash-out backbone. Agents accept **rider deposits** and process **withdrawals** via QR codes, settle **dues to Blink**, and view earnings. |

**Blink Cash** is the shared in-app wallet/ledger that ties Riders and Agents together — a QR-based deposit & withdrawal network that lets a cash-economy operate inside the app.

The app is bilingual (an **Arabic** page exists in the source) with right-to-left support in scope. The brand voice is energetic and informal — the lightning bolt in the logo signals *speed*.

---

## Sources

- **Figma:** `Blink UI_UX.fig` — attached and mounted read-only. Pages: `splash-screen`, `Customer-UI` (162 frames), `Rider-UI` (207 frames), `Agent-UI` (78 frames), `Merchant-UI` (not yet designed — empty), `arabic`, `Cover`, `component` (114 shared components).
- **GitHub — real product code** (owner `Safwa9amar`):
  - [`blink`](https://github.com/Safwa9amar/blink) — the Expo / React-Native mobile app. Its `constants/theme.ts` (saved here at `reference/blink-app-theme.ts`) was itself derived from this design system and **confirms every token** (colors, gradients, radii, shadows, type).
  - [`blink-dashboard`](https://github.com/Safwa9amar/blink-dashboard) — the Next.js 15 + Tailwind v4 + Supabase **admin console**. The `ui_kits/dashboard/` kit is a faithful recreation of it (tokens from its `globals.css`, components/pages/copy from its source).
  - [`blink-server`](https://github.com/Safwa9amar/blink-server) (Hono + Supabase API) and [`blink-supabase`](https://github.com/Safwa9amar/blink-supabase) — backend (not used for visuals).
- The merchant brief is preserved at `merchant-spec.txt`. The reader is assumed NOT to have repo access; this design system is the source of truth.

---

## CONTENT FUNDAMENTALS

How Blink writes.

- **Voice:** energetic, casual, and direct — like a fast friend. Built around *speed* ("Blink", lightning bolt, "Get Your First Rider").
- **Person:** speaks **to "you"** ("Your delivery network is active today", "Get Your First Rider", "Need assistance?"). Greets users by name + role ("Hello, Agent Malik").
- **Casing:** UI labels and buttons use **Title Case** ("Request a Courier", "Shop in Marketplace", "Continue With Apple", "Riders Deposit"). Section headers are sentence/Title case ("Top deals", "Blink news"). All-caps is reserved for **metric labels** above big numbers ("BALANCE", "DUES TO BLINK").
- **Numbers & money:** currency is **DZD / "Da"**, shown as a big bold figure with a small all-caps label above it (`BALANCE` → **2450 Da**; `DUES TO BLINK` → **12,500 DZD**). Discounts are punchy: "10% Off", "25% Off", "30% off all rides".
- **CTAs:** short and imperative — **Continue**, **Start Shift**, **View All**, **Riders Deposit**, **Riders Withdraw**.
- **Tone of helper copy:** reassuring and plain — "Instant support for your operations", "Your delivery network is active today".
- **Emoji:** essentially none in product UI. A bare `©` appears in the footer ("All Rights Reserved 2026 ©"). Status uses a colored dot + word ("● Online"), not emoji.
- **Note on placeholder copy:** many Figma frames carry obvious dummy text ("algerie Centre , Ya khouuu", "in this update we fixed bla bla prblem and djadj"). These are NOT brand copy — treat them as lorem. Use the polished strings (Agent/Rider screens) as the canonical voice.

---

## VISUAL FOUNDATIONS

The look: **bright, rounded, soft, and confident.** A single hot raspberry pink does all the heavy lifting against cool slate neutrals and lots of white space.

- **Color:** one dominant brand color — **Blink raspberry `#EE335F`** (used 2,723× in the file). Deepens to `#DE2555` / `#B9003F` for hero fills and gradients. Neutrals are a **cool slate ramp** (`#0F172A` → `#F8FAFC`) with Tailwind **gray** appearing in app chrome. Pale pink tints (`#FFF1F2`, `#FDE8EE`) wash info cards and icon halos. A single **secondary spring-green `#00E676`** appears only on the *About Us* "Our Story / Our Mission" accents (community & sustainability) — use it sparingly, never as a general UI color. Color is used boldly but sparingly — surfaces are mostly white/light-gray, then pink punches through on CTAs, active states, and hero zones.
- **Backgrounds:** flat solid fills, **no busy textures**. Customer pages sit on cool gray `#F9FAFB`; the Agent app sits on a warm gray `#F8F6F6`. Splash & cover are full-bleed solid pink. **Photography** (not illustration) fills news/promo cards — real photos of warehouses, fuel pumps, documents, food. The Rider home is a full-screen **map** with a soft red heat-glow over the user's location.
- **Gradients:** used purposefully, not decoratively. Customer header = vertical pink gradient (`#FF6C90` → `#EE3160`). Agent/Rider hero cards = diagonal deep-pink gradient. Deal banners = pink gradient with darker **organic blob shapes** scattered as decoration (the one signature "texture").
- **Corner radii:** generous and friendly everywhere. Pills (`999px`) for buttons, inputs, chips, the floating navbar, and status badges. Cards `16px`; hero panels `24px`; phone frames `32px`; small quick-action tiles `12px`.
- **Cards:** white fill, **1px `#D1D5DB` border**, soft low-contrast drop shadow (`0 4px 14px -3px rgba(0,0,0,0.2)`). Never harsh. Images inside cards bleed to the rounded top edge. Quick-action tiles use a translucent white fill (`rgba(255,255,255,0.8)`) with a centered icon in a pale-pink circular halo.
- **Shadows:** soft, neutral, low-opacity. Cards lift on a faint gray/black blur. The floating glass navbar carries a deeper ambient shadow (`0 6px 12px rgba(0,0,0,0.35)`). Primary pink buttons can carry a colored glow (`rgba(238,51,95,0.35)`). A subtle inner/outer dual-shadow (neumorphic hint) appears on the search bar.
- **Transparency & blur:** the bottom navbar is a **frosted glass pill** — translucent `rgba(243,244,246,0.94)` floating above content. Quick-action tiles and overlay icon halos use semi-transparent white. Modals dim the backdrop with `rgba(0,0,0,0.5)`.
- **Buttons:** fully-rounded **pills**. Primary = solid pink, white bold text. Secondary = light slate fill (`#E2E8F0`), dark text (used for "Continue with Apple/Google"). The Rider "Start Shift" is a special raised **3D circular** button in pink. Ghost/text actions are pink, no fill ("View All").
- **Press / hover states:** subtle **scale-down on press** (`scale(0.98)`); primary buttons **darken** on hover (`#EE335F` → `#DE2555`). Active nav item: pink icon + pink label inside a pale-pink pill (`#FFF1F2`); inactive: gray-400 icon + label.
- **Animation:** gentle and quick — fades, soft slides for bottom sheets, no aggressive bounce. Easing is standard ease/ease-out, ~120–200ms.
- **Layout rules:** mobile frames are **412×~900** on a `32px`-radius rounded screen. A fixed iOS status bar pins to the top; the **frosted navbar floats** with margin at the bottom (it does not span edge-to-edge). Content scrolls beneath both. Generous outer padding (~24–30px). Section = bold Poppins header + horizontally-scrolling card row.
- **Imagery vibe:** real, full-color photography — warm and lively for food/lifestyle, neutral/industrial for operations (warehouses, logistics). No b&w, no heavy grain.
- **Type:** **Poppins** for everything expressive (headings, buttons, labels, big numbers) — bold/extrabold with a signature **+0.04em letter-spacing**. **Inter** for body, fields, captions, and dense UI. Some newer Rider/Agent screens use **Plus Jakarta Sans**. (Arimo / Liberation Sans counts in the metadata are just Arial-metric fallbacks the exporter substituted — not intentional brand fonts.)

---

## ICONOGRAPHY

**Confirmed from the real app code** ([`Safwa9amar/blink`](https://github.com/Safwa9amar/blink) ·
`components/ui/icon-symbol.tsx`). The icon system is a single component, **`<IconSymbol>`**, with a
two-layer model:

**1. System icons — SF Symbol names → Material Icons.**
Icons are referenced by Apple **SF Symbol** strings (e.g. `house.fill`, `cart.fill`, `bolt.fill`). On
**iOS** these render as native SF Symbols (`expo-symbols`); on **Android & web** they fall back to
**Material Icons** (Google) via `@expo/vector-icons` — the primary icon family (~95% of the ~150-entry map).
A handful resolve to **FontAwesome 5** (`globe`, and the socials `facebook` / `instagram` / `twitter` /
`tiktok`, plus `store-slash`), one to **FontAwesome** (`copy`) and one to **Entypo** (`box`). Filled SF
names map to the filled Material glyph. Unknown names fall back to `help-outline`.

- **In this design system:** the full mapping is ported to the web in **`icons/blink-icons.js`** as a
  `<blink-icon name="house.fill">` custom element that loads the Material Icons + FontAwesome webfonts and
  renders the exact same glyph the app would. Browse them all in **`icons/index.html`**.

**2. Custom brand service icons.**
A small set of **bespoke two-tone SVGs** (`components/ui/CustomIcons.tsx`) for the headline services —
**Marketplace** (storefront) and **Courier** (parcel) — drawn in brand pink (`#EE335F` / `#EE3160`) over
near-black (`#111827`). These are copied out to **`assets/icons/blink-marketplace.svg`** and
**`assets/icons/blink-courier.svg`**; use them (not Material) for the big service tiles.

**Brand mark:** the **"B + lightning bolt"** logomark is bespoke (`assets/blink-mark.svg`, recolorable via
`currentColor`). The full wordmark is the pink mark + black geometric **"LINK."** lettering.

**Emoji:** not used as icons. Status is a colored dot + word. **Unicode:** only `©` in footers.

---

## VISUAL ASSETS (`assets/`)

- `blink-mark.svg` — the Blink "B + bolt" logomark (recolorable via `currentColor`).
- `blink-bolt.svg` — the standalone lightning bolt used on the splash screen.
- Additional product photos / illustrations are copied per-need into UI-kit folders.

---

## INDEX — what's in this design system

| Path | What it is |
|------|------------|
| `README.md` | This file — product context + all foundations. |
| `colors_and_type.css` | CSS variables for color, type, spacing, radii, shadows + semantic classes & component primitives. Import this in any Blink artifact. |
| `SKILL.md` | Agent-Skill manifest so this folder works as a downloadable Claude skill. |
| `assets/` | Logo mark, bolt, shared brand imagery, and `assets/icons/` (custom service SVGs). |
| `icons/` | **Icon system** — `blink-icons.js` (`<blink-icon>` element porting the app's SF-Symbol→Material map), `index.html` gallery, and the custom brand service SVGs. |
| `preview/` | Small HTML specimen cards that populate the Design System tab. |
| `merchant-spec.txt` | The written **Merchant Interface** spec (extracted from the uploaded brief) the Merchant kit is built from. |
| `reference/blink-app-theme.ts` | The real mobile app's `theme.ts` (from the `blink` repo) — confirms every token in this system. |
| `ui_kits/website/` | ✅ **Built** — all-in-one marketing landing (consumer · merchant · rider sections). |
| `ui_kits/dashboard/` | ✅ **Built** — ops/admin console, faithfully recreated from the real `blink-dashboard` repo (dark theme). |
| `ui_kits/merchant/` | ✅ **Built** — interactive Merchant app kit (Home, Earnings, Profile, Blink Cash, Dashboard, My Stores). |

Each `ui_kits/<surface>/` has its own `README.md`, an interactive `index.html`, and modular `.jsx` components.

### Not yet built (foundations documented above, kits available on request)
The **Customer**, **Rider**, and **Agent** mobile apps are fully specified in the foundations and live in the
source Figma + the `blink` repo — but have not yet been recreated as their own UI kits. Ask to spin any of them up.

---

## CAVEATS

- Fonts are loaded from **Google Fonts** (Poppins, Inter, Plus Jakarta Sans) — all freely available there. If you have licensed/locked font files, drop them into `fonts/` and swap the `@import` in `colors_and_type.css`.
- Icons use **Material Symbols Rounded** as a faithful substitute for the Figma's baked vector glyphs (see ICONOGRAPHY).
- A **Merchant** app is referenced in the file but **not yet designed** — no Merchant UI kit is included.
