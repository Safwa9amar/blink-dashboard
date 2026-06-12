"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import { listModels, loadModel, unloadModel, AIError } from "@/lib/ai";
import type { LMModel, Provider } from "@/lib/ai";

// Server actions backing Settings → AI. They reach the local inference host
// (LM Studio or Ollama) from the Next.js server — the browser passes the chosen
// provider + base URL — gated by staff role like the other admin mutations. Each
// returns a serializable result with a friendly error string instead of throwing.

interface Conn {
  provider: Provider;
  baseUrl: string;
}

function authed() {
  return hasStaffRole("super_admin", "ops_admin");
}

function message(e: unknown): string {
  return e instanceof AIError ? e.message : "AI server request failed.";
}

// Connection probe + model inventory (load state per model).
export async function aiStatus(
  conn: Conn
): Promise<{ ok: boolean; models: LMModel[]; error: string | null }> {
  if (!(await authed())) return { ok: false, models: [], error: "Not authorized" };
  try {
    const models = await listModels({ provider: conn.provider, baseUrl: conn.baseUrl });
    return { ok: true, models, error: null };
  } catch (e) {
    return { ok: false, models: [], error: message(e) };
  }
}

// Loads/preloads a model, optionally pinning its context window (LM Studio).
export async function aiLoadModel(
  conn: Conn,
  model: string,
  contextLength?: number
): Promise<{ error: string | null }> {
  if (!(await authed())) return { error: "Not authorized" };
  if (!model.trim()) return { error: "Pick a model to load." };
  try {
    await loadModel({ provider: conn.provider, baseUrl: conn.baseUrl, model, contextLength });
    return { error: null };
  } catch (e) {
    return { error: message(e) };
  }
}

// Unloads (stops) a model, freeing its memory.
export async function aiUnloadModel(conn: Conn, model: string): Promise<{ error: string | null }> {
  if (!(await authed())) return { error: "Not authorized" };
  if (!model.trim()) return { error: "No model to unload." };
  try {
    await unloadModel({ provider: conn.provider, baseUrl: conn.baseUrl, model });
    return { error: null };
  } catch (e) {
    return { error: message(e) };
  }
}
