import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { INBOX_CATEGORIES, INBOX_KINDS, inboxCategoriesFor, inboxHref, inboxKindsFor } from "./inbox-kinds";

// The kinds blink-server's triggers emit (supabase/migrations/20261019120000_staff_notifications.sql).
const SERVER_KINDS = [
  "agent.documents", "agent.joined", "agent.shop_review", "alert.fired", "campaign.failed", "campaign.sent",
  "deletion.requested", "dues.paid", "email.inbound", "merchant.joined", "merchant.review", "order.canceled",
  "order.low_rating", "order.rejected", "pack.review", "payment.amount_mismatch", "payment.unfulfilled", "price.suggestion", "product.review", "rider.documents",
  "rider.joined", "support.waiting", "trip.review", "user.signup",
];

const locale = (l: string) =>
  JSON.parse(readFileSync(join(process.cwd(), `src/features/inbox/locales/${l}.json`), "utf8")).inbox;
const at = (obj: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
const routeFile = (href: string) => join(process.cwd(), "src/app/d", href, "page.tsx");

// Every argument the copy may use (mirrors use-inbox-text DEFAULTS + name/amount/count).
const ARGS = {
  name: "Amina", store: "Pizza Oran", product: "Cola", pack: "Family", shop: "Kiosk", trip: "TR-1",
  rule: "Errors", title: "Promo", subject: "Late", rating: 1, recipients: 1200, role: "rider",
  scope: "role", amount: "4,500 Da", provider: "chargily",
};

describe("INBOX_KINDS", () => {
  it("covers every kind the server emits", () => {
    expect(Object.keys(INBOX_KINDS).sort()).toEqual([...SERVER_KINDS].sort());
  });

  it("every kind's page is a dashboard route", () => {
    for (const [kind, k] of Object.entries(INBOX_KINDS)) expect(existsSync(routeFile(k.page)), `${kind} → ${k.page}`).toBe(true);
  });

  it.each(["en", "fr", "ar"])("copy exists and formats in %s", (l) => {
    const msg = locale(l);
    for (const kind of Object.keys(INBOX_KINDS)) {
      const src = at(msg.kinds, kind);
      expect(typeof src, `${l} inbox.kinds.${kind}`).toBe("string");
      for (const count of [1, 3]) {
        const out = new IntlMessageFormat(src as string, l).format({ ...ARGS, count });
        expect(String(out), `${l} ${kind} count=${count}`).not.toMatch(/[{}]/);
      }
    }
    for (const c of INBOX_CATEGORIES) expect(msg.categories[c], `${l} categories.${c}`).toBeTruthy();
  });
});

describe("inboxKindsFor", () => {
  it("full access sees every kind, including ones the dashboard doesn't know", () => {
    expect(inboxKindsFor("super_admin")).toBeNull();
  });
  it("a category narrows even full access", () => {
    expect(inboxKindsFor("super_admin", "finance")).toEqual(["dues.paid", "payment.amount_mismatch", "payment.unfulfilled"]);
  });
  it("follows the access map", () => {
    expect(inboxKindsFor("finance_admin")).toEqual(["dues.paid", "payment.amount_mismatch", "payment.unfulfilled"]);
    const ops = inboxKindsFor("ops_admin")!;
    expect(ops).toEqual(expect.arrayContaining(["user.signup", "rider.documents", "agent.shop_review", "order.canceled", "trip.review", "deletion.requested"]));
    expect(ops).not.toContain("merchant.review");
    expect(ops).not.toContain("alert.fired");
    expect(inboxKindsFor("commerce_admin")).toEqual(
      expect.arrayContaining(["merchant.review", "product.review", "price.suggestion", "pack.review"])
    );
    expect(inboxKindsFor("support_admin")).toEqual(
      expect.arrayContaining(["support.waiting", "email.inbound", "deletion.requested", "campaign.failed"])
    );
  });
  it("lists only categories with visible kinds", () => {
    expect(inboxCategoriesFor("finance_admin")).toEqual(["finance"]);
    expect(inboxCategoriesFor("super_admin")).toEqual([...INBOX_CATEGORIES]);
  });
});

describe("inboxHref", () => {
  it("opens the record for a single event", () => {
    expect(inboxHref({ kind: "rider.joined", entityId: "u1", count: 1 })).toBe("/riders/u1");
    expect(inboxHref({ kind: "rider.documents", entityId: "u1", count: 2 })).toBe("/riders/u1");
  });
  it("opens the page for a folded group or a kind without a detail page", () => {
    expect(inboxHref({ kind: "rider.joined", entityId: "u1", count: 4 })).toBe("/riders");
    expect(inboxHref({ kind: "product.review", entityId: "s1", count: 1 })).toBe("/merchant-pricing/products");
  });
  it("sends unknown kinds to the inbox", () => {
    expect(inboxHref({ kind: "future.kind", entityId: null, count: 1 })).toBe("/inbox");
  });
});
