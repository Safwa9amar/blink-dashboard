"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";

// The customer email inbox is server-authoritative: SMTP send + IMAP intake live
// in blink-server (they need mailbox secrets and can't run in the browser). These
// actions proxy to its staff-gated /email routes, forwarding the operator's
// Supabase JWT — same pattern as the support live-chat actions. The dashboard
// sees new rows via Supabase Realtime, so a successful call needs no return body.
const API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

async function callServer(path: string, body?: unknown): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "No session" };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { error: j?.error ?? `Request failed (${res.status})` };
    }
    revalidatePath("/d/email");
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function replyToThread(threadId: string, body: string) {
  return callServer(`/email/threads/${threadId}/reply`, { body });
}

export async function assignThread(threadId: string) {
  return callServer(`/email/threads/${threadId}/assign`);
}

export async function resolveThread(threadId: string) {
  return callServer(`/email/threads/${threadId}/resolve`);
}

export async function markThreadRead(threadId: string) {
  return callServer(`/email/threads/${threadId}/read`);
}
