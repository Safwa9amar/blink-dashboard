"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import type { ManagedDeepLink, ManagedDeepLinkInput } from "@/features/deep-links";

// Writes use the service-role admin client (createAdminClient) so they bypass the
// `deep_links_select_active` RLS — gated here by staff role instead. Mirrors the
// news server-action pattern (src/app/d/news/action.ts).

type DeepLinkResult = { error: string | null; row: ManagedDeepLink | null };

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "link";
const rand = () => Math.random().toString(36).slice(2, 6);

// Map the camelCase form input → the snake_case `deep_links` columns. Only keys
// present on `input` are emitted, so it serves both insert and partial update.
function toRow(input: Partial<ManagedDeepLinkInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.role !== undefined) row.role = input.role;
  if (input.routePath !== undefined) row.route_path = input.routePath;
  if (input.deepLink !== undefined) row.deep_link = input.deepLink;
  if (input.webUrl !== undefined) row.web_url = input.webUrl || null;
  if (input.requiredParams !== undefined) row.required_params = input.requiredParams;
  if (input.params !== undefined) row.params = input.params;
  if (input.campaign !== undefined) row.campaign = input.campaign || null;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  if (input.expiresAt !== undefined) row.expires_at = input.expiresAt || null;
  return row;
}

export async function createDeepLink(input: ManagedDeepLinkInput): Promise<DeepLinkResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const supabase = await createAdminClient();
  const slug = input.slug?.trim() || `${slugify(input.title)}-${rand()}`;

  const { data, error } = await supabase
    .from("deep_links")
    .insert({ ...toRow(input), slug })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation (slug already taken)
    return { error: error.code === "23505" ? "That slug is already taken." : error.message, row: null };
  }
  revalidatePath("/d/deep-links");
  return { error: null, row: data as ManagedDeepLink };
}

export async function updateDeepLink(
  id: string,
  patch: Partial<ManagedDeepLinkInput>
): Promise<DeepLinkResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", row: null };
  }
  const row = toRow(patch);
  if (Object.keys(row).length === 0) return { error: "Nothing to update", row: null };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("deep_links")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "That slug is already taken." : error.message, row: null };
  }
  revalidatePath("/d/deep-links");
  return { error: null, row: data as ManagedDeepLink };
}

export async function toggleDeepLinkActive(id: string, isActive: boolean): Promise<DeepLinkResult> {
  return updateDeepLink(id, { isActive });
}

export async function deleteDeepLink(id: string): Promise<{ error: string | null }> {
  // Deletion is destructive — reserve it for super_admin (matches news/users).
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("deep_links").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/d/deep-links");
  return { error: null };
}
