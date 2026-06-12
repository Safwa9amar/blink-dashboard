"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { toProductPayload, toCategoryPayload } from "@/features/library";
import type { NewLibraryProductInput, NewLibraryCategoryInput } from "@/features/library";

// Writes use the service-role admin client (createAdminClient) so they bypass the
// `library_*_select_*` RLS — gated here by staff role instead. Mirrors the news /
// users server-action pattern.

const REVALIDATE = ["/d/library", "/d/library/categories"] as const;
function revalidate() {
  REVALIDATE.forEach((p) => revalidatePath(p));
}

// ─── Products ────────────────────────────────────────────────────────────────
export async function createLibraryProduct(input: NewLibraryProductInput): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_products").insert(toProductPayload(input));
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateLibraryProduct(
  id: string,
  patch: Partial<NewLibraryProductInput>
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_products").update(toProductPayload(patch)).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deleteLibraryProduct(id: string): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// Bulk delete — removes every selected catalog item in one round trip.
export async function deleteLibraryProducts(ids: string[]): Promise<{ error: string | null }> {
  if (!ids.length) return { error: null };
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_products").delete().in("id", ids);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// Bulk import — inserts many catalog items in one round trip (parsed client-side
// from CSV/Excel/JSON; see features/library/import.ts).
export async function importLibraryProducts(
  inputs: NewLibraryProductInput[]
): Promise<{ error: string | null; count: number }> {
  if (!inputs.length) return { error: null, count: 0 };
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized", count: 0 };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("library_products")
    .insert(inputs.map(toProductPayload))
    .select("id");
  if (error) return { error: error.message, count: 0 };
  revalidate();
  return { error: null, count: data?.length ?? inputs.length };
}

// ─── Categories ──────────────────────────────────────────────────────────────
export async function createLibraryCategory(input: NewLibraryCategoryInput): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_categories").insert(toCategoryPayload(input));
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateLibraryCategory(
  id: string,
  patch: Partial<NewLibraryCategoryInput>
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();

  // Keep products in sync when a category is renamed. Products denormalize the
  // category by its English name (name_en) — the language-stable reference key.
  let prevNameEn: string | null = null;
  if (patch.name !== undefined) {
    const { data } = await supabase.from("library_categories").select("name_en").eq("id", id).single();
    prevNameEn = (data as { name_en?: string } | null)?.name_en ?? null;
  }

  const { error } = await supabase.from("library_categories").update(toCategoryPayload(patch)).eq("id", id);
  if (error) return { error: error.message };

  if (patch.name !== undefined && prevNameEn && prevNameEn !== patch.name.en) {
    await supabase.from("library_products").update({ category: patch.name.en }).eq("category", prevNameEn);
  }

  revalidate();
  return { error: null };
}

export async function deleteLibraryCategory(id: string): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("library_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// Bulk import categories (parsed client-side from CSV/Excel/JSON).
export async function importLibraryCategories(
  inputs: NewLibraryCategoryInput[]
): Promise<{ error: string | null; count: number }> {
  if (!inputs.length) return { error: null, count: 0 };
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) return { error: "Not authorized", count: 0 };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("library_categories")
    .insert(inputs.map(toCategoryPayload))
    .select("id");
  if (error) return { error: error.message, count: 0 };
  revalidate();
  return { error: null, count: data?.length ?? inputs.length };
}

// ─── Photo upload ────────────────────────────────────────────────────────────
// Mints a one-time signed upload URL for the public `library` Storage bucket; the
// browser then uploads the file DIRECTLY to Storage (uploadToSignedUrl), so the
// bytes never pass through this server action. Mirrors createNewsUploadUrl.
export async function createLibraryUploadUrl(
  ext: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  if (!(await hasStaffRole("super_admin", "commerce_admin"))) {
    return { path: null, token: null, error: "Not authorized" };
  }
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage.from("library").createSignedUploadUrl(path);
  if (error || !data) {
    return { path: null, token: null, error: error?.message ?? "Failed to create upload URL" };
  }
  return { path: data.path, token: data.token, error: null };
}
