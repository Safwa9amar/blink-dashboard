"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupportStore, type SupportConversationRow } from "@/features/support";
import { createClient } from "@/lib/supabase/client";

export function SupportStoreSeeder({
  chats,
  history,
}: {
  chats: SupportConversationRow[];
  history: SupportConversationRow[];
}) {
  const router = useRouter();

  useEffect(() => {
    useSupportStore.setState({ conversations: chats, historyConversations: history });
  }, [chats, history]);

  // Live-refresh when conversations OR messages change. postgres_changes is
  // RLS-scoped — the operator must have a non-null staff_role (migration 00021).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("support-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () =>
        router.refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
