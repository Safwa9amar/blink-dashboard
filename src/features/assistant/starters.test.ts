import { describe, expect, it } from "vitest";
import { STAFF_ROLES } from "@/lib/auth/access";
import { startersFor } from "./starters";
import en from "./locales/en.json";

describe("startersFor", () => {
  it("gives every role four unique prompts that exist in the locale", () => {
    for (const role of STAFF_ROLES) {
      const keys = startersFor(role);
      expect(keys).toHaveLength(4);
      expect(new Set(keys).size).toBe(4);
      for (const k of keys) expect((en.assistant.starters as Record<string, string>)[k]).toBeTruthy();
    }
  });

  it("tailors the lead prompt per role", () => {
    expect(startersFor("super_admin")[0]).toBe("attention");
    expect(startersFor("finance_admin")[0]).toBe("cash_today");
    expect(startersFor("support_admin")[0]).toBe("waiting_conversations");
    expect(startersFor("commerce_admin")[0]).toBe("stores_review");
    expect(startersFor("hr_admin")[0]).toBe("find_user");
  });
});
