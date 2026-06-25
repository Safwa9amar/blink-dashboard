import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportArticleRow, SupportCategoryRow } from "@/features/support";

// Admin client reads ALL articles (drafts/review included); the mobile app is
// scoped to published by the support_articles_select_published RLS policy.
// Fetched in the support layout and seeded into the kb-store so every sub-tab is
// hydrated (mirrors news/data.ts).
export const getKbArticles = cache(
  async (): Promise<{ data: SupportArticleRow[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("support_articles")
      .select("*")
      .order("updated_at", { ascending: false });
    return { data: (data as SupportArticleRow[] | null) ?? [], error: error?.message ?? null };
  }
);

export const getKbCategories = cache(
  async (): Promise<{ data: SupportCategoryRow[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("support_categories")
      .select("*")
      .order("sort", { ascending: true });
    return { data: (data as SupportCategoryRow[] | null) ?? [], error: error?.message ?? null };
  }
);
