import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToPost, type NewsRow, type Post } from "@/features/news";

// Admin client reads ALL posts (drafts/scheduled included); the mobile app is
// scoped to published by the news_select_published RLS policy. Fetched once in
// the layout and seeded into the client store so every sub-tab is hydrated.
export const getNewsPosts = cache(
  async (): Promise<{ posts: Post[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    const posts = ((data as NewsRow[] | null) ?? []).map(rowToPost);
    return { posts, error: error?.message ?? null };
  }
);
