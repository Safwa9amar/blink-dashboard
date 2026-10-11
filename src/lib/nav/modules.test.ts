import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MODULES, CREATE_ACTIONS, resolvePath, visibleModules, pageCount, moduleHasAttention } from "./modules";
import { STAFF_ROLES } from "@/lib/auth/access";

const routeFile = (href: string) => join(process.cwd(), "src/app/d", href === "/" ? "" : href, "page.tsx");
const locale = (l: string) => JSON.parse(readFileSync(join(process.cwd(), `src/i18n/messages/${l}.json`), "utf8"));

describe("MODULES", () => {
  it("every page href has a route", () => {
    for (const m of MODULES) for (const p of m.pages) expect(existsSync(routeFile(p.href)), p.href).toBe(true);
  });
  it("every create action has a route", () => {
    for (const a of CREATE_ACTIONS) expect(existsSync(routeFile(a.href)), a.href).toBe(true);
  });
  it("has 37 pages, no duplicates", () => {
    const hrefs = MODULES.flatMap((m) => m.pages.map((p) => p.href));
    expect(hrefs).toHaveLength(37);
    expect(new Set(hrefs).size).toBe(37);
  });
  it.each(["en", "fr", "ar"])("labels exist in %s", (l) => {
    const msg = locale(l);
    for (const m of MODULES) {
      expect(msg.shell.modules[m.key].name, `${l} module ${m.key}`).toBeTruthy();
      expect(msg.shell.modules[m.key].description, `${l} module ${m.key} desc`).toBeTruthy();
      for (const p of m.pages) expect(msg.sidebar[p.key], `${l} sidebar.${p.key}`).toBeTruthy();
    }
    for (const a of CREATE_ACTIONS) expect(msg.shell.create[a.key], `${l} shell.create.${a.key}`).toBeTruthy();
  });
});

describe("sections", () => {
  const used = [...new Set(MODULES.flatMap((m) => m.pages.map((p) => p.section).filter(Boolean)))] as string[];
  it.each(["en", "fr", "ar"])("section labels exist in %s", (l) => {
    const msg = locale(l);
    for (const k of used) expect(msg.shell.sections[k], `${l} shell.sections.${k}`).toBeTruthy();
  });
  it("pages sharing a section are contiguous within a module", () => {
    for (const m of MODULES) {
      const closed = new Set<string>();
      let prev: string | undefined;
      for (const p of m.pages) {
        if (p.section !== prev) {
          if (p.section) expect(closed.has(p.section), `${m.key}/${p.section}`).toBe(false);
          if (prev) closed.add(prev);
          prev = p.section;
        }
      }
    }
  });
  it("partners page order", () => {
    const partners = MODULES.find((m) => m.key === "partners")!;
    expect(partners.pages.map((p) => p.href)).toEqual([
      "/merchants", "/merchants/verification", "/riders", "/riders/verification", "/agents", "/agents/verification",
    ]);
    expect(partners.pages.map((p) => p.section)).toEqual(["merchants", "merchants", "riders", "riders", "agents", "agents"]);
  });
  it("support page order", () => {
    const support = MODULES.find((m) => m.key === "support")!;
    expect(support.pages.map((p) => p.href)).toEqual([
      "/support", "/support/inbox", "/email", "/support/tickets", "/support/kb", "/support/macros",
      "/support/ai", "/support/csat", "/support/sla", "/support/agents", "/deletion-requests",
    ]);
  });
});

describe("resolvePath", () => {
  it.each([
    ["/", "home", "/"],
    ["/blink-cash", "finance", "/blink-cash"],
    ["/blink-cash/dues", "finance", "/blink-cash"],
    ["/news/compose", "marketing", "/news"],
    ["/access/roles", "people", "/access"],
    ["/library/products/abc", "catalog", "/library"],
    ["/support/inbox", "support", "/support/inbox"],
    ["/support/articles/new", "support", "/support"],
    ["/support", "support", "/support"],
    ["/deletion-requests/history", "support", "/deletion-requests"],
    ["/email", "support", "/email"],
    ["/riders", "partners", "/riders"],
    ["/riders/verification", "partners", "/riders/verification"],
    ["/agents/verification", "partners", "/agents/verification"],
    ["/merchants/verification", "partners", "/merchants/verification"],
  ])("%s → %s", (path, mod, href) => {
    const r = resolvePath(path);
    expect(r?.module.key).toBe(mod);
    expect(r?.page.href).toBe(href);
  });
  it("unknown path → null", () => {
    expect(resolvePath("/test")).toBeNull();
    expect(resolvePath("/ordersx")).toBeNull();
  });
});

describe("visibleModules", () => {
  const keys = (r: (typeof STAFF_ROLES)[number]) => visibleModules(r).map((m) => m.key);
  it("super_admin sees all modules with pages", () => {
    expect(keys("super_admin")).toEqual(["home", "operations", "customers", "support", "partners", "catalog", "marketing", "finance", "people", "system"]);
  });
  it("finance_admin sees Home and Finance", () => expect(keys("finance_admin")).toEqual(["home", "finance"]));
  it("support_admin", () => expect(keys("support_admin")).toEqual(["home", "support", "marketing"]));
  it("never shows analytics while it has no pages", () => {
    for (const r of STAFF_ROLES) expect(keys(r)).not.toContain("analytics");
  });
  it("partner pages follow each role's access", () => {
    const partners = (r: (typeof STAFF_ROLES)[number]) =>
      visibleModules(r).find((m) => m.key === "partners")?.pages.map((p) => p.href) ?? [];
    expect(partners("ops_admin")).toEqual(["/riders", "/riders/verification", "/agents", "/agents/verification"]);
    expect(partners("hr_admin")).toEqual(["/merchants", "/merchants/verification", "/riders", "/riders/verification", "/agents", "/agents/verification"]);
    expect(partners("commerce_admin")).toEqual(["/merchants", "/merchants/verification"]);
    expect(partners("finance_admin")).toEqual([]);
    expect(partners("support_admin")).toEqual([]);
  });
  it("filters pages inside a module", () => {
    const support = visibleModules("ops_admin").find((m) => m.key === "support")!;
    expect(support.pages.map((p) => p.href)).toEqual(["/deletion-requests"]);
  });
});

describe("attention", () => {
  const pages = MODULES.flatMap((m) => m.pages);
  const verification = pages.find((p) => p.href === "/merchants/verification")!;
  it("pageCount sums the page's keys", () => {
    expect(pageCount(verification, { storesPending: 3, supportUnread: 9 })).toBe(3);
    expect(pageCount(verification, {})).toBe(0);
  });
  it("each verification page counts its own queue", () => {
    expect(pageCount(pages.find((p) => p.href === "/riders/verification")!, { ridersPending: 2, agentsPending: 5 })).toBe(2);
    expect(pageCount(pages.find((p) => p.href === "/agents/verification")!, { ridersPending: 2, agentsPending: 5 })).toBe(5);
  });
  it("moduleHasAttention", () => {
    const partners = MODULES.find((m) => m.key === "partners")!;
    expect(moduleHasAttention(partners, { storesPending: 1 })).toBe(true);
    expect(moduleHasAttention(partners, { supportUnread: 4 })).toBe(false);
  });
});
