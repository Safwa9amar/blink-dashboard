"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { chatJSON, AIError } from "@/lib/ai";
import { NEWS_DRAFT_SCHEMA, newsDraftMessages } from "@/features/news/ai";
import type { NewsDraft, NewsDraftRequest } from "@/features/news/ai";
import type { NewsInsert, NewsRow } from "@/features/news";

// Writes use the service-role admin client (createAdminClient) so they bypass the
// `news_select_published` RLS — gated here by staff role instead. Mirrors the
// users server-action pattern (src/app/d/users/action.ts).

type NewsResult = { error: string | null; row: NewsRow | null };

export async function createNews(payload: NewsInsert): Promise<NewsResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("news").insert(payload).select("*").single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/news");
  return { error: null, row: data as NewsRow };
}

export async function updateNews(
  id: string,
  patch: Partial<NewsInsert>
): Promise<NewsResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("news")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message, row: null };
  revalidatePath("/d/news");
  return { error: null, row: data as NewsRow };
}

export async function togglePin(id: string, pinned: boolean): Promise<NewsResult> {
  return updateNews(id, { pinned });
}

export async function deleteNews(id: string): Promise<{ error: string | null }> {
  // Deletion is destructive — reserve it for super_admin (matches users).
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/d/news");
  return { error: null };
}

// Generates a full trilingual news draft from a topic prompt via the local LM
// Studio server (see src/lib/ai). Staff-gated like the write actions; returns the
// draft for the compose form to apply (it does NOT persist anything). On any AI
// failure it returns a user-friendly message rather than throwing.
export async function generateNewsDraft(
  req: NewsDraftRequest,
  opts?: { model?: string; temperature?: number; maxTokens?: number; ttl?: number }
): Promise<{ draft: NewsDraft | null; error: string | null }> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { draft: null, error: "Not authorized" };
  }
  if (!req.topic?.trim()) {
    return { draft: null, error: "Describe what the post should be about." };
  }
  try {
    const draft = await chatJSON<NewsDraft>({
      messages: newsDraftMessages(req),
      schema: NEWS_DRAFT_SCHEMA,
      model: opts?.model || undefined, // "" → auto-detect the loaded model
      temperature: opts?.temperature ?? 0.7,
      maxTokens: opts?.maxTokens,
      ttl: opts?.ttl,
    });
    return { draft, error: null };
  } catch (e) {
    const message =
      e instanceof AIError ? e.message : "Generation failed — check the LM Studio server.";
    return { draft: null, error: message };
  }
}

// Mints a one-time signed upload URL for the public `news` Storage bucket. The
// browser then uploads the file DIRECTLY to Storage (uploadToSignedUrl) — the
// file bytes never pass through this server action, so there's no Server-Action
// body limit (Next 1 MB / Vercel ~4.5 MB). Staff-gated here; the token authorizes
// the single upload. Returns the path (for getPublicUrl) and token.
export async function createNewsUploadUrl(
  ext: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { path: null, token: null, error: "Not authorized" };
  }
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage.from("news").createSignedUploadUrl(path);
  if (error || !data) {
    return { path: null, token: null, error: error?.message ?? "Failed to create upload URL" };
  }
  return { path: data.path, token: data.token, error: null };
}
