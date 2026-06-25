"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { getAiSettings, type AiSettings } from "./ai-server-data";

// AI Server settings actions. The support bot (blink-server) reads the latest
// `ai_settings` row. This is global config (not per-user) so writes go through the
// service-role admin client, gated here by staff role. The OpenRouter API key is
// stored encrypted-at-rest in the DB and used by the server bot; it is never read
// back to the client (the data layer masks it).

const API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

// Fields the admin may write. Extends the client-facing AiSettings (minus the
// masked-only fields) with the raw `openrouter_api_key`, which is set ONLY when
// the admin typed a new key. Provider URLs are written as-is (null = server env
// default).
export type AiSettingsPatch = Partial<
  Omit<AiSettings, "openrouter_key_set" | "openrouter_key_last4">
> & {
  openrouter_api_key?: string;
};

// Client-readable fetch of the current settings (used to hydrate the panel on
// mount). Delegates to the cache()-wrapped admin read in ai-server-data.ts.
export async function getAiSettingsAction(): Promise<{
  settings: AiSettings;
  error: string | null;
}> {
  return getAiSettings();
}

export async function saveAiSettings(
  patch: AiSettingsPatch
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();

  // Singleton: locate the latest row id, then update it; insert if none exists.
  const { data: existing, error: readError } = await supabase
    .from("ai_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  // Only persist `openrouter_api_key` when the admin actually typed a new key —
  // an absent key in the patch preserves the existing one.
  const payload = { ...patch, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };

  const { error } = existing?.id
    ? await supabase.from("ai_settings").update(payload).eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/d/settings");
  return { error: null };
}

// Lists the models available for a provider by calling blink-server with the
// operator's Supabase access token (same staff-JWT pattern as the chat actions).
// blink-server uses the configured key for the chosen provider. Returns an empty
// list + error if the endpoint isn't reachable — the panel falls back to its
// free-text model input.
export async function fetchAiModels(
  provider: AiSettings["provider"]
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
