import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportConversationRow } from "@/features/support";

// Inbox = active conversations (waiting + assigned), newest first. Admin client
// bypasses RLS for the server-side read; the browser realtime subscription is
// RLS-scoped (operator needs a non-null staff_role).
export const getSupportChats = cache(
  async (): Promise<{ chats: SupportConversationRow[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .in("status", ["waiting", "assigned"])
      .order("last_message_at", { ascending: false });
    return { chats: (data as SupportConversationRow[] | null) ?? [], error: error?.message ?? null };
  }
);

// History = resolved conversations, newest first. Capped to the most recent 100
// so the tab stays light; older threads still live in the DB. Resolving a chat
// never deletes it — it just flips status to "resolved", so it surfaces here.
export const getSupportHistory = cache(
  async (): Promise<{ chats: SupportConversationRow[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("status", "resolved")
      .order("last_message_at", { ascending: false })
      .limit(100);
    return { chats: (data as SupportConversationRow[] | null) ?? [], error: error?.message ?? null };
  }
);
