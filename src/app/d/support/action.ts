"use server";

import { revalidatePath } from "next/cache";
import { getRagConfig } from "./rag-data";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { fetchBlinkApi } from "@/lib/blink-api-base";
import type {
  SupportArticleInsert,
  SupportArticlePatch,
  SupportArticleRow,
  SupportArticleStatus,
  SupportCategoryInsert,
  SupportCategoryPatch,
  SupportCategoryRow,
} from "@/features/support";


// Best-effort incremental KB reindex after an article write. Never fails or delays
// the save for more than ~2s; the server also self-heals staleness.
async function kickReindex(): Promise<void> {
  try {
    // Skip while RAG is off (or unreadable / migration pending): no paid embedding calls.
    const rag = await getRagConfig();
    if (rag.error || rag.migrationPending || !rag.config.rag_enabled) return;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await Promise.race([
      fetchBlinkApi("/ai/kb/reindex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ full: false }),
        timeoutMs: 2000,
        cache: "no-store",
      }).catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    /* swallow */
  }
}

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
    const res = await fetchBlinkApi(path, {
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
  await kickReindex();
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
  await kickReindex();
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
  await kickReindex();
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
