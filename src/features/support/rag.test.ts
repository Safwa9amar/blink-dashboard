import { describe, expect, it } from "vitest";
import { sanitizeRagSettings, RAG_DEFAULTS } from "./rag";

describe("sanitizeRagSettings", () => {
  it("clamps and rounds top_k", () => {
    expect(sanitizeRagSettings({ rag_top_k: 99 }).rag_top_k).toBe(20);
    expect(sanitizeRagSettings({ rag_top_k: -3 }).rag_top_k).toBe(1);
    expect(sanitizeRagSettings({ rag_top_k: 4.6 }).rag_top_k).toBe(5);
    expect(sanitizeRagSettings({ rag_top_k: "abc" }).rag_top_k).toBe(RAG_DEFAULTS.rag_top_k);
  });
  it("clamps min_score to 0..1", () => {
    expect(sanitizeRagSettings({ rag_min_score: 2 }).rag_min_score).toBe(1);
    expect(sanitizeRagSettings({ rag_min_score: -1 }).rag_min_score).toBe(0);
    expect(sanitizeRagSettings({ rag_min_score: 0.35 }).rag_min_score).toBe(0.35);
    expect(sanitizeRagSettings({ rag_min_score: NaN }).rag_min_score).toBe(RAG_DEFAULTS.rag_min_score);
  });
  it("validates provider and trims model", () => {
    expect(sanitizeRagSettings({ embedding_provider: "evil" }).embedding_provider).toBe("openrouter");
    expect(sanitizeRagSettings({ embedding_provider: "ollama" }).embedding_provider).toBe("ollama");
    expect(sanitizeRagSettings({ embedding_model: "  m1  " }).embedding_model).toBe("m1");
    expect(sanitizeRagSettings({ embedding_model: "   " }).embedding_model).toBeNull();
    expect(sanitizeRagSettings({ embedding_model: 5 }).embedding_model).toBeNull();
  });
  it("only accepts boolean true for enabled", () => {
    expect(sanitizeRagSettings({ rag_enabled: "true" }).rag_enabled).toBe(false);
    expect(sanitizeRagSettings({ rag_enabled: true }).rag_enabled).toBe(true);
  });
});
