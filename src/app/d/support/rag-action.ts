"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { blinkApi } from "@/lib/blink-api";
import { hasStaffRole } from "@/lib/auth/staff";
import { getRagConfig } from "./rag-data";
import {
  RAG_LOCALES,
  RAG_PROVIDERS,
  RAG_ROLES,
  sanitizeRagSettings,
  type KbIndexStatus,
  type KbSearchResponse,
  type RagLocale,
  type RagRole,
  type SupportRagConfig,
} from "@/features/support";

// Support → AI → knowledge retrieval (RAG). Settings are written straight to the
// RAG columns of `ai_settings` (only those — never the bot/engine columns). Index
// status / reindex / search / model suggestions proxy blink-server's staff
// endpoints; all return { data, error } and never throw (the service may not be deployed).

const ROLES = ["super_admin", "support_admin"] as const;

type Result<T> = { data: T | null; error: string | null };

function unavailable(status: number, error: string): string {
  return status === 404 || status === 0 || status >= 502 ? "unavailable" : error;
}

export async function saveRagSettings(
  input: SupportRagConfig
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole(...ROLES))) return { error: "Not authorized" };
  const clean = sanitizeRagSettings(input);
  const before = await getRagConfig().catch(() => null);
  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  const { data: existing, error: readError } = await supabase
    .from("ai_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const payload = { ...clean, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };
  const { error } = existing?.id
    ? await supabase.from("ai_settings").update(payload).eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/d/support/ai");

  // Best-effort: RAG switched on, or the embedding provider/model changed → build the
  // index now (full:false is enough; the server re-embeds anything whose model changed).
  const prev = before && !before.error && !before.migrationPending ? before.config : null;
  const turnedOn = clean.rag_enabled === true && prev?.rag_enabled !== true;
  const modelChanged =
    clean.rag_enabled === true &&
    prev !== null &&
    (clean.embedding_provider !== prev.embedding_provider || clean.embedding_model !== prev.embedding_model);
  if (turnedOn || modelChanged) {
    await Promise.race([
      blinkApi("/ai/kb/reindex", { method: "POST", body: { full: false }, roles: ROLES }).catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }
  return { error: null };
}

export async function getKbIndexStatus(): Promise<Result<KbIndexStatus>> {
  const r = await blinkApi<{ status: KbIndexStatus }>("/ai/kb/status", { roles: ROLES });
  if (!r.ok) return { data: null, error: unavailable(r.status, r.error) };
  return { data: r.data.status ?? null, error: null };
}

export async function reindexKb(full: boolean): Promise<Result<{ started: boolean }>> {
  const r = await blinkApi<{ started: boolean }>("/ai/kb/reindex", {
    method: "POST",
    body: { full: full === true },
    roles: ROLES,
  });
  if (!r.ok) return { data: null, error: unavailable(r.status, r.error) };
  return { data: { started: r.data.started === true }, error: null };
}

export async function searchKb(input: {
  query: string;
  role: RagRole;
  locale?: RagLocale;
  top_k?: number;
  min_score?: number;
}): Promise<Result<KbSearchResponse>> {
  const query = String(input.query ?? "").trim().slice(0, 1000);
  if (!query) return { data: null, error: "Enter a question" };
  const role = RAG_ROLES.includes(input.role) ? input.role : "customer";
  const body: Record<string, unknown> = { query, role };
  if (input.locale && RAG_LOCALES.includes(input.locale)) body.locale = input.locale;
  if (input.top_k !== undefined) body.top_k = sanitizeRagSettings({ rag_top_k: input.top_k }).rag_top_k;
  if (input.min_score !== undefined)
    body.min_score = sanitizeRagSettings({ rag_min_score: input.min_score }).rag_min_score;
  const r = await blinkApi<KbSearchResponse>("/ai/kb/search", { method: "POST", body, roles: ROLES });
  if (!r.ok) return { data: null, error: unavailable(r.status, r.error) };
  return { data: { mode: r.data.mode, results: r.data.results ?? [] }, error: null };
}

export async function listEmbeddingModels(provider: string): Promise<Result<string[]>> {
  if (!(RAG_PROVIDERS as readonly string[]).includes(provider)) return { data: [], error: null };
  const r = await blinkApi<{ models: string[] }>(
    `/ai/embedding-models?provider=${encodeURIComponent(provider)}`,
    { roles: ROLES }
  );
  if (!r.ok) return { data: [], error: unavailable(r.status, r.error) };
  return { data: Array.isArray(r.data.models) ? r.data.models : [], error: null };
}
