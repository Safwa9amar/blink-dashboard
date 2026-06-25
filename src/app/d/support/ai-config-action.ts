"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";

// Support → AI tab actions. The support bot's PRODUCT-level config — whether it
// answers at all (`bot_enabled`) and its extra instructions (`system_prompt_extra`)
// — lives in the `ai_settings` singleton. The Settings → AI Server panel owns the
// disjoint ENGINE columns of the same singleton (`provider`) plus every
// `ai_provider_configs` row, so the two panels never clobber each other's fields.
// Global config (not per-user) → writes go through the service-role admin client,
// gated here by staff role.

export interface SupportBotConfig {
  bot_enabled: boolean;
  system_prompt: string | null; // full base prompt (blank → server's built-in default)
  system_prompt_extra: string | null;
  active_provider: string; // read-only context (configured in AI Server Settings)
  active_model: string | null; // read-only context
}

export async function saveSupportBot(input: {
  bot_enabled: boolean;
  system_prompt: string | null;
  system_prompt_extra: string | null;
}): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const now = new Date().toISOString();
  const updatedBy = user?.id ?? null;

  // Update the latest singleton row, or insert one if none exists. Only the
  // bot-level columns are touched — `provider` and the per-provider configs are
  // left to the AI Server panel.
  const { data: existing, error: readError } = await supabase
    .from("ai_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const payload = {
    bot_enabled: input.bot_enabled,
    // Blank → null, so the server falls back to its built-in DEFAULT_SUPPORT_PROMPT.
    system_prompt:
      input.system_prompt && input.system_prompt.trim() ? input.system_prompt : null,
    system_prompt_extra:
      input.system_prompt_extra && input.system_prompt_extra.trim()
        ? input.system_prompt_extra
        : null,
    updated_by: updatedBy,
    updated_at: now,
  };

  const { error } = existing?.id
    ? await supabase
        .from("ai_settings")
        .update(payload)
        .eq("id", (existing as { id: string }).id)
    : await supabase.from("ai_settings").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/d/support/ai");
  revalidatePath("/d/blink-server");
  return { error: null };
}
