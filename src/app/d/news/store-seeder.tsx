"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNewsStore, type Post } from "@/features/news";
import { createClient } from "@/lib/supabase/client";

// Seeds the client store with the posts fetched on the server. Lives in the
// layout so every news sub-tab (list, compose, analytics, categories) is
// hydrated, including on a direct deep-link. Using the store's built-in
// setState (not a custom action) keeps this robust to HMR.
export function NewsStoreSeeder({ posts }: { posts: Post[] }) {
  const router = useRouter();

  useEffect(() => {
    useNewsStore.setState({ posts });
  }, [posts]);

  // Live-refresh: when the `news` table changes in the DB — from this console,
  // another admin, or a server-side/script write — re-run the server fetch so
  // the list reflects it. router.refresh() re-renders the layout, which passes a
  // fresh `posts` array to the effect above and re-seeds the store.
  // NB: postgres_changes respects RLS for the anon key, and the `news` table must
  // be in the `supabase_realtime` publication for events to be delivered.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("news-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
