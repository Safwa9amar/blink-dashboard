---
name: blink-design
description: Use this skill to generate well-branded interfaces and assets for Blink — the Algerian multi-service delivery super-app (Customer, Rider, Agent, Merchant) — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and the Merchant UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key files:
- `README.md` — product context, content fundamentals, visual foundations, iconography, index.
- `colors_and_type.css` — drop-in CSS variables + semantic classes (`.blink-h1`, `.blink-btn--primary`, etc). Import this first in any Blink artifact.
- `assets/` — the Blink logomark (`blink-mark.svg`, recolorable via `currentColor`), bolt, sample imagery, and `assets/icons/` custom service glyphs.
- `icons/` — the **icon system**: `blink-icons.js` gives you `<blink-icon name="house.fill">` (SF-Symbol names → Material Icons, exactly like the app); `icons/index.html` is the browsable gallery.
- `ui_kits/merchant/` — interactive Merchant app kit; `Icon.jsx` holds the shared inline-SVG icon set used across the brand.
- `preview/` — specimen cards illustrating every token and component.
- `merchant-spec.txt` — the Merchant interface written spec.

Brand essentials (see README for the full system):
- One dominant color: **Blink raspberry `#EE335F`**, deepening to `#B9003F` for hero gradients. Cool slate neutrals. Pale-pink tints for info surfaces.
- Type: **Poppins** for headings/buttons/numbers (+0.04em tracking), **Inter** for body/UI.
- Shapes: pill buttons & inputs, 16px cards with soft neutral shadows, 24px hero cards, frosted floating bottom nav. Currency is **DZD ("Da")**.
- Icons: clean rounded line icons (Lucide-style) — reuse `ui_kits/merchant/Icon.jsx`. For the canonical app vocabulary, use `icons/blink-icons.js` (`<blink-icon>`, SF-Symbol→Material Icons).

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create static HTML
files for the user to view. If working on production code, copy assets and apply the rules here to design
faithfully on-brand.

If the user invokes this skill without other guidance, ask what they want to build or design, ask a few
focused questions, then act as an expert Blink designer who outputs HTML artifacts _or_ production code,
depending on the need.
