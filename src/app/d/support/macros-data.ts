import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MacroRow } from "@/features/support/macros";

const SECTION = "/support";

export interface MacrosResult {
  macros: MacroRow[];
  /** true when the support_macros table doesn't exist yet (migration not applied) */
  migrationPending: boolean;
  error?: string;
}

/** Service-role read of every macro, most used first. Gated on the /support section. */
export const loadMacros = cache(async (): Promise<MacrosResult> => {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_macros")
    .select("id,title,body,locale,target_role,uses,created_at,updated_at")
    .order("uses", { ascending: false })
    .order("title", { ascending: true });
  if (error) {
    if (error.code === "42P01") return { macros: [], migrationPending: true };
    return { macros: [], migrationPending: false, error: error.message };
  }
  return { macros: (data as MacroRow[] | null) ?? [], migrationPending: false };
});
