# Blink — Marketing Website UI Kit

The **all-in-one blink.dz landing page** — one scrolling site with sections that convert three audiences:
customers, merchants, and riders.

## Run it
Open `index.html`. It's a responsive React page (stacks to mobile under 980px). Sections:

1. **Sticky nav** — logo, section links, Sign in + Get the app.
2. **Hero** — "Everything you need, just a blink away", store badges, a CSS phone mockup of the customer app, trust rating.
3. **Services** — Food, Marketplace, Courier, Rides.
4. **For customers** — live tracking, favourites, one wallet, deals (with the phone mockup).
5. **For merchants** — grow your store, with a mini-dashboard preview + "paid out" floaty card; links to the Merchant app & Admin dashboard kits.
6. **For riders** — drive with Blink, with an earnings card + trip list on the crimson hero panel.
7. **Stats band**, **Coverage** (city pills), **Download CTA**, and a full **footer**.

## Files
| File | What it is |
|------|-----------|
| `index.html` | Shell + all page-specific CSS; loads React + Babel, mounts the site. |
| `web.css` | Shared web foundations (tokens, buttons, eyebrow) — also used by the dashboard's sibling surfaces. Self-contained so it bundles offline. |
| `WebIcons.jsx` | `<WIcon>`, `<Mark>`, `<Wordmark>` — inline SVG icon set + brand mark. |
| `site.jsx` | All sections (Nav, Hero, Services, Customers, Merchants, Riders, Stats, Coverage, Download, Footer). |

## Notes
- Direction follows the brief: **tight to the app** — same pink, rounded, playful feel (no separate corporate skin).
- The landing copy echoes the real `blink-dashboard` repo's marketing strings (`Your city, in a blink`, services, drive & earn).
- "Get the app" / store badges are visual only. The Merchant and Dashboard CTAs link to the sibling kits.
- Photography is represented with brand color blocks + the CSS phone mockup; swap in real imagery when available.
