import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailThreadRow } from "@/features/email";

// Inbox = every thread, newest activity first (capped so the page stays light;
// older threads still live in the DB). Admin client bypasses RLS for this
// server read; the browser Realtime subscription is RLS-scoped (the operator
// needs a non-null staff_role).
export const getEmailThreads = cache(
  async (): Promise<{ threads: EmailThreadRow[]; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("email_threads")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (error) {
      // Pre-migration: the email_threads table doesn't exist yet (PostgREST
      // PGRST205 "not found in schema cache" / Postgres 42P01 undefined_table).
      // Show an empty inbox instead of an error banner until
      // blink-server's 00031_email_inbox.sql is applied (npm run db:push).
      if (error.code === "PGRST205" || error.code === "42P01") {
        return { threads: [], error: null };
      }
      return { threads: [], error: error.message };
    }
    return { threads: (data as EmailThreadRow[] | null) ?? [], error: null };
  }
);
