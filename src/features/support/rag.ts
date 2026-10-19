// Support → AI → knowledge retrieval (RAG): shared, client-safe types + pure validation.

export const RAG_PROVIDERS = ["openrouter", "ollama", "lmstudio"] as const;
export type RagProvider = (typeof RAG_PROVIDERS)[number];
export type RagRole = "customer" | "rider" | "merchant" | "agent";
export type RagLocale = "en" | "fr" | "ar";
export const RAG_ROLES: RagRole[] = ["customer", "rider", "merchant", "agent"];
export const RAG_LOCALES: RagLocale[] = ["en", "fr", "ar"];

export interface SupportRagConfig {
  rag_enabled: boolean;
  embedding_provider: RagProvider;
  embedding_model: string | null;
  rag_top_k: number;
  rag_min_score: number;
}

export const RAG_DEFAULTS: SupportRagConfig = {
  rag_enabled: false,
  embedding_provider: "openrouter",
  embedding_model: null,
  rag_top_k: 6,
  rag_min_score: 0.3,
};

export interface KbIndexStatus {
  rag_enabled: boolean;
  embedding_provider: string;
  embedding_model: string;
  articles_published: number;
  articles_indexed: number;
  chunks_indexed: number;
  chunks_by_locale: { en: number; fr: number; ar: number };
  stale_articles: number;
  syncing: boolean;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface KbSearchResult {
  article_id: string;
  title: string;
  locale: RagLocale;
  type: "article" | "faq";
  content: string;
  similarity: number | null;
  keyword_rank: number | null;
  score: number;
}

export interface KbSearchResponse {
  mode: "hybrid" | "keyword" | "empty";
  results: KbSearchResult[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Coerces untrusted input into a valid config: top_k int 1..20, min_score 0..1,
// provider one of the 3 ids (else default), model trimmed or null.
export function sanitizeRagSettings(input: Partial<Record<keyof SupportRagConfig, unknown>>): SupportRagConfig {
  const topK = Number(input.rag_top_k);
  const minScore = Number(input.rag_min_score);
  const provider = RAG_PROVIDERS.find((p) => p === input.embedding_provider) ?? RAG_DEFAULTS.embedding_provider;
  const model = typeof input.embedding_model === "string" ? input.embedding_model.trim() : "";
  return {
    rag_enabled: input.rag_enabled === true,
    embedding_provider: provider,
    embedding_model: model || null,
    rag_top_k: Number.isFinite(topK) ? clamp(Math.round(topK), 1, 20) : RAG_DEFAULTS.rag_top_k,
    rag_min_score: Number.isFinite(minScore) ? clamp(minScore, 0, 1) : RAG_DEFAULTS.rag_min_score,
  };
}
