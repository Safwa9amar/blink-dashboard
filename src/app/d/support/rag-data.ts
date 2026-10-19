import { createAdminClient } from "@/lib/supabase/admin";
import { RAG_DEFAULTS, sanitizeRagSettings, type SupportRagConfig } from "@/features/support";

// Support → AI → RAG config (server-only). Reads only the RAG columns of the latest
// `ai_settings` row. Tolerates the migration not being applied yet: an unknown-column
// error falls back to defaults and flags `migrationPending` instead of crashing.
export async function getRagConfig(): Promise<{
  config: SupportRagConfig;
  migrationPending: boolean;
  error: string | null;
}> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("ai_settings")
    .select("rag_enabled, embedding_provider, embedding_model, rag_top_k, rag_min_score")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    const missing =
      error.code === "42703" ||
      error.code === "PGRST204" ||
      /column .* does not exist|could not find .* column/i.test(error.message);
    return { config: RAG_DEFAULTS, migrationPending: missing, error: missing ? null : error.message };
  }
  if (!data) return { config: RAG_DEFAULTS, migrationPending: false, error: null };
  return { config: sanitizeRagSettings(data), migrationPending: false, error: null };
}
