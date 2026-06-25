"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";

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
    revalidatePath("/d/support");
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function assignChat(conversationId: string) {
  return callServer(`/support-chat/conversations/${conversationId}/assign`);
}

export async function replyToChat(conversationId: string, body: string) {
  return callServer(`/support-chat/conversations/${conversationId}/messages`, { body });
}

export async function resolveChat(conversationId: string) {
  return callServer(`/support-chat/conversations/${conversationId}/resolve`);
}
