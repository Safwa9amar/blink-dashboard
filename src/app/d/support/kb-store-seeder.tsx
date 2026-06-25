"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useKbStore,
  type SupportArticleRow,
  type SupportCategoryRow,
} from "@/features/support";
import { createClient } from "@/lib/supabase/client";

// Seeds the kb-store with the articles + categories fetched on the server and
// live-refreshes when either table changes. Mirrors the news store-seeder.
// Kept separate from SupportStoreSeeder (live chat) so the two concerns stay
// independent. postgres_changes is RLS-scoped for the anon key — the tables must
// be in the supabase_realtime publication for events to be delivered.
export function KbStoreSeeder({
  articles,
  categories,
}: {
  articles: SupportArticleRow[];
  categories: SupportCategoryRow[];
}) {
  const router = useRouter();

  useEffect(() => {
    useKbStore.setState({ articles, categories });
  }, [articles, categories]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("support-kb-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_articles" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "support_categories" }, () =>
        router.refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
