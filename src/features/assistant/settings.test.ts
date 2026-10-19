import { describe, expect, it } from "vitest";
import { sanitizeAssistantSettings, settingsFromRow } from "./settings";

describe("sanitizeAssistantSettings", () => {
  it("accepts a valid payload and trims the model", () => {
    expect(
      sanitizeAssistantSettings({ assistant_enabled: false, assistant_provider: "ollama", assistant_model: "  llama3.1:8b " })
    ).toEqual({ ok: true, value: { assistant_enabled: false, assistant_provider: "ollama", assistant_model: "llama3.1:8b" } });
  });
  it("blank / missing model → null (server default)", () => {
    for (const assistant_model of ["", "   ", null, undefined]) {
      const r = sanitizeAssistantSettings({ assistant_enabled: true, assistant_provider: "openrouter", assistant_model });
      expect(r).toMatchObject({ ok: true, value: { assistant_model: null } });
    }
  });
  it("rejects unknown providers and bad models", () => {
    expect(sanitizeAssistantSettings({ assistant_provider: "evil" })).toEqual({ ok: false, error: "provider" });
    expect(sanitizeAssistantSettings(null)).toEqual({ ok: false, error: "provider" });
    expect(sanitizeAssistantSettings({ assistant_provider: "openrouter", assistant_model: "a b; drop" })).toEqual({ ok: false, error: "model" });
    expect(sanitizeAssistantSettings({ assistant_provider: "openrouter", assistant_model: "x".repeat(201) })).toEqual({ ok: false, error: "model" });
    expect(sanitizeAssistantSettings({ assistant_provider: "openrouter", assistant_model: 5 })).toEqual({ ok: false, error: "model" });
  });
  it("coerces enabled to a boolean", () => {
    expect(sanitizeAssistantSettings({ assistant_enabled: "no", assistant_provider: "lmstudio" })).toMatchObject({ value: { assistant_enabled: true } });
  });
});

describe("settingsFromRow", () => {
  it("falls back to defaults", () => {
    expect(settingsFromRow(null)).toEqual({ assistant_enabled: true, assistant_provider: "openrouter", assistant_model: null });
    expect(settingsFromRow({ assistant_enabled: false, assistant_provider: "zzz", assistant_model: "m" })).toEqual({
      assistant_enabled: false,
      assistant_provider: "openrouter",
      assistant_model: "m",
    });
  });
});
