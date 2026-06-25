"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import {
  getAiServerSettings,
  PROVIDERS,
  type AiServerSettings,
  type Provider,
} from "./ai-server-data";

// AI Server settings actions. The support bot (blink-server) reads the active
// provider from the `ai_settings` singleton and that provider's config from
// `ai_provider_configs`. This is global config (not per-user) so writes go through
// the service-role admin client, gated here by staff role. Provider API keys are
// stored encrypted-at-rest in the DB and used by the server bot; they are never
// read back to the client (the data layer masks them).

const API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

// One provider's writable config. `api_key` (openrouter) is set ONLY when the admin
// typed a new key — an absent/blank key preserves the existing one. `base_url`
// (ollama/lmstudio) is written as-is (null = server env default).
export interface ProviderConfigPatch {
  provider: Provider;
  model: string | null;
  temperature: number;
  max_tokens: number;
  reasoning: boolean;
  base_url?: string | null;
  api_key?: string; // openrouter only; omit/blank to keep current
}

// The full save payload: bot-level (active provider + bot settings) + every
// provider's config.
export interface AiServerPayload {
  active: {
    provider: Provider;
    bot_enabled: boolean;
    system_prompt_extra: string | null;
  };
  providers: ProviderConfigPatch[];
}

// Client-readable fetch of the current settings (used to hydrate the panel on
// mount). Delegates to the cache()-wrapped admin read in ai-server-data.ts.
export async function getAiServerSettingsAction(): Promise<{
  settings: AiServerSettings;
  error: string | null;
}> {
  return getAiServerSettings();
}

export async function saveAiServer(
  payload: AiServerPayload
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const now = new Date().toISOString();
  const updatedBy = user?.id ?? null;

  // ── 1. Bot-level singleton: update the latest row, or insert if none exists. ──
  const { data: existing, error: readError } = await supabase
    .from("ai_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const activePayload = {
    provider: payload.active.provider,
    bot_enabled: payload.active.bot_enabled,
    system_prompt_extra: payload.active.system_prompt_extra,
    updated_by: updatedBy,
    updated_at: now,
  };

  const { error: activeError } = existing?.id
    ? await supabase
        .from("ai_settings")
        .update(activePayload)
        .eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(activePayload);
  if (activeError) return { error: activeError.message };

  // ── 2. Per-provider configs (one row per provider, keyed by `provider`). ──
  // The `api_key` is included ONLY when a new non-empty value was provided —
  // otherwise it is omitted from the upsert so the existing key is preserved.
  for (const cfg of payload.providers) {
    if (!PROVIDERS.includes(cfg.provider)) continue;
    const newKey = cfg.api_key?.trim();
    const row: Record<string, unknown> = {
      provider: cfg.provider,
      model: cfg.model,
      temperature: cfg.temperature,
      max_tokens: cfg.max_tokens,
      reasoning: cfg.reasoning,
      base_url: cfg.base_url ?? null,
      updated_by: updatedBy,
      updated_at: now,
    };
    if (newKey) row.api_key = newKey;

    const { error: cfgError } = await supabase
      .from("ai_provider_configs")
      .upsert(row, { onConflict: "provider" });
    if (cfgError) return { error: cfgError.message };
  }

  revalidatePath("/d/settings");
  return { error: null };
}

// Lists the models available for a provider by calling blink-server with the
// operator's Supabase access token (same staff-JWT pattern as the chat actions).
// blink-server uses the configured key for the chosen provider. Returns an empty
// list + error if the endpoint isn't reachable — the panel falls back to its
// free-text model input.
export async function fetchAiModels(
  provider: Provider
): Promise<{ models: string[]; error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { models: [], error: "Not authorized" };
  }
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { models: [], error: "No session" };

  try {
    const res = await fetch(`${API_BASE}/ai/models?provider=${encodeURIComponent(provider)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { models: [], error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { models?: string[] };
    return { models: Array.isArray(j.models) ? j.models : [], error: null };
  } catch (e) {
    return { models: [], error: (e as Error).message };
  }
}
