"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import type {
  SupportArticleInsert,
  SupportArticlePatch,
  SupportArticleRow,
  SupportArticleStatus,
  SupportCategoryInsert,
  SupportCategoryPatch,
  SupportCategoryRow,
} from "@/features/support";
import { getAiSettings, type AiSettings } from "./ai-data";

const API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

async function callServer(path: string, body?: unknown): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "No session" };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { error: j?.error ?? `Request failed (${res.status})` };
    }
    revalidatePath("/d/support");
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function assignChat(conversationId: string) {
  return callServer(`/support-chat/conversations/${conversationId}/assign`);
}

export async function replyToChat(conversationId: string, body: string) {
  return callServer(`/support-chat/conversations/${conversationId}/messages`, { body });
}

export async function resolveChat(conversationId: string) {
  return callServer(`/support-chat/conversations/${conversationId}/resolve`);
}

// ─── Knowledge Base / FAQ writes ─────────────────────────────────────────────
// Use the service-role admin client so they bypass the support_articles_select_
// published RLS — gated here by staff role instead. Mirror the news server-action
// pattern (src/app/d/news/action.ts).

type ArticleResult = { error: string | null; row: SupportArticleRow | null };
type CategoryResult = { error: string | null; row: SupportCategoryRow | null };

export async function createKbArticle(payload: SupportArticleInsert): Promise<ArticleResult> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_articles")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/support");
  return { error: null, row: data as SupportArticleRow };
}

export async function updateKbArticle(
  id: string,
  patch: SupportArticlePatch
): Promise<ArticleResult> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_articles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/support");
  return { error: null, row: data as SupportArticleRow };
}

// Convenience status flip (publish / unpublish / send to review).
export async function publishKbArticle(
  id: string,
  status: SupportArticleStatus
): Promise<ArticleResult> {
  return updateKbArticle(id, { status });
}

export async function deleteKbArticle(id: string): Promise<{ error: string | null }> {
  // Deletion is destructive — reserve it for super_admin (matches news).
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_articles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/d/support");
  return { error: null };
}

// ─── Category writes (basic CRUD) ────────────────────────────────────────────
export async function createKbCategory(payload: SupportCategoryInsert): Promise<CategoryResult> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_categories")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/support");
  return { error: null, row: data as SupportCategoryRow };
}

export async function updateKbCategory(
  id: string,
  patch: SupportCategoryPatch
): Promise<CategoryResult> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/support");
  return { error: null, row: data as SupportCategoryRow };
}

export async function deleteKbCategory(id: string): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/d/support");
  return { error: null };
}

// ─── AI Bot settings ─────────────────────────────────────────────────────────
// The support bot (blink-server) reads the latest `ai_settings` row. This is
// global config (not per-user) so writes go through the service-role admin client,
// gated here by staff role. API keys are NOT stored here — they stay in server env.

// Client-readable fetch of the current settings (used to hydrate the AI Bot tab on
// mount). Delegates to the cache()-wrapped admin read in ai-data.ts.
export async function getAiSettingsAction(): Promise<{ settings: AiSettings; error: string | null }> {
  return getAiSettings();
}

export async function saveAiSettings(
  patch: Partial<AiSettings>
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

  const payload = { ...patch, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };

  const { error } = existing?.id
    ? await supabase.from("ai_settings").update(payload).eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/d/support");
  return { error: null };
}

// Lists the models available for a provider by calling blink-server with the
// operator's Supabase access token (same staff-JWT pattern as the chat actions).
// Returns an empty list + error if the endpoint isn't reachable — the tab falls
// back to its free-text model input.
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
