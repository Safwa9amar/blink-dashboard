"use server";

import { revalidatePath } from "next/cache";
import { STAFF_ROLES } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { BLINK_API_BASES } from "@/lib/blink-api-base";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ASSISTANT_SETTINGS_DEFAULTS,
  sanitizeAssistantSettings,
  settingsFromRow,
  type AssistantConfig,
  type AssistantProvider,
  type AssistantSettings,
  type AssistantThread,
  type PersistedMessage,
} from "@/features/assistant";

// Staff assistant: CRUD + config through blink-server (signed with the operator's session).
// The chat stream itself goes browser → blink-server directly (see getAssistantBases).
// Every action returns { data, error } and never throws.

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string; status?: number };

const ROLES = STAFF_ROLES;

async function call<T>(
  path: string,
  opts: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; roles?: typeof ROLES | readonly ["super_admin"] } = {}
): Promise<ActionResult<T>> {
  const res = await blinkApi<T>(path, { method: opts.method, body: opts.body, roles: opts.roles ?? ROLES });
  if (res.ok) return { data: res.data, error: null };
  return { data: null, error: res.error, status: res.status };
}

/** blink-server base URLs for the browser's direct SSE connection (not secret). */
export async function getAssistantBases(): Promise<ActionResult<string[]>> {
  if (!(await hasStaffRole(...ROLES))) return { data: null, error: "Not authorized", status: 403 };
  return { data: [...BLINK_API_BASES], error: null };
}

export async function getAssistantConfig(): Promise<ActionResult<AssistantConfig>> {
  return call<AssistantConfig>("/assistant/config");
}

export async function listAssistantThreads(): Promise<ActionResult<AssistantThread[]>> {
  const r = await call<{ threads: AssistantThread[] }>("/assistant/threads");
  return r.error === null ? { data: r.data.threads ?? [], error: null } : r;
}

export async function createAssistantThread(title?: string): Promise<ActionResult<AssistantThread>> {
  const r = await call<{ thread: AssistantThread }>("/assistant/threads", { method: "POST", body: title ? { title } : {} });
  return r.error === null ? { data: r.data.thread, error: null } : r;
}

export async function renameAssistantThread(id: string, title: string): Promise<ActionResult<AssistantThread>> {
  const clean = title.trim().slice(0, 120);
  if (!clean) return { data: null, error: "Title required" };
  const r = await call<{ thread: AssistantThread }>(`/assistant/threads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title: clean },
  });
  return r.error === null ? { data: r.data.thread, error: null } : r;
}

export async function deleteAssistantThread(id: string): Promise<ActionResult<true>> {
  const r = await call<{ ok: true }>(`/assistant/threads/${encodeURIComponent(id)}`, { method: "DELETE" });
  return r.error === null ? { data: true, error: null } : r;
}

export async function getAssistantMessages(id: string): Promise<ActionResult<PersistedMessage[]>> {
  const r = await call<{ messages: PersistedMessage[] }>(`/assistant/threads/${encodeURIComponent(id)}/messages`);
  return r.error === null ? { data: r.data.messages ?? [], error: null } : r;
}

// ── Settings (super_admin) ───────────────────────────────────────────────────

export interface AssistantSettingsState {
  settings: AssistantSettings;
  /** The assistant_* columns don't exist yet (migration pending). */
  migrationPending: boolean;
}

const isMissingColumn = (e: { code?: string } | null) => e?.code === "42703" || e?.code === "PGRST204";

export async function getAssistantSettings(): Promise<ActionResult<AssistantSettingsState>> {
  if (!(await hasStaffRole("super_admin"))) return { data: null, error: "Not authorized", status: 403 };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("ai_settings")
    .select("assistant_enabled, assistant_provider, assistant_model")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingColumn(error)) {
      return { data: { settings: ASSISTANT_SETTINGS_DEFAULTS, migrationPending: true }, error: null };
    }
    return { data: null, error: error.message };
  }
  return { data: { settings: settingsFromRow(data), migrationPending: false }, error: null };
}

export async function saveAssistantSettings(input: unknown): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin"))) return { error: "Not authorized" };
  const parsed = sanitizeAssistantSettings(input);
  if (!parsed.ok) return { error: parsed.error === "provider" ? "Invalid provider" : "Invalid model name" };

  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const payload = { ...parsed.value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };

  const { data: existing, error: readError } = await supabase
    .from("ai_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: isMissingColumn(readError) ? "Migration pending" : readError.message };

  const { error } = existing?.id
    ? await supabase.from("ai_settings").update(payload).eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(payload);
  if (error) return { error: isMissingColumn(error) ? "Migration pending" : error.message };

  revalidatePath("/d/blink-server");
  return { error: null };
}

/** Tool-capable model suggestions for a provider (super_admin). Empty list on any failure. */
export async function listAssistantModels(provider: AssistantProvider): Promise<ActionResult<string[]>> {
  const r = await call<{ models: string[] }>(`/assistant/models?provider=${encodeURIComponent(provider)}`, {
    roles: ["super_admin"],
  });
  return r.error === null ? { data: Array.isArray(r.data.models) ? r.data.models : [], error: null } : r;
}
