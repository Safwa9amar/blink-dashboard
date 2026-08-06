"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmailStore, type EmailThreadRow } from "@/features/email";
import { createClient } from "@/lib/supabase/client";

// Seeds the inbox store from the server read and keeps the thread list live:
// any change to email_threads / email_messages triggers router.refresh() to
// re-run the server component. postgres_changes is RLS-scoped — the operator
// must have a non-null staff_role (migration 00021).
export function EmailStoreSeeder({ threads }: { threads: EmailThreadRow[] }) {
  const router = useRouter();

  useEffect(() => {
    useEmailStore.setState({ threads });
  }, [threads]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("email-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_threads" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "email_messages" }, () =>
        router.refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
