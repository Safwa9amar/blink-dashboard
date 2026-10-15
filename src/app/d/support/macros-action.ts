"use server";

import { revalidatePath } from "next/cache";
import { getStaffActor } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMacroInput, type MacroRow } from "@/features/support/macros";

const SECTION = "/support";
const COLS = "id,title,body,locale,target_role,uses,created_at,updated_at";

type Result<T = null> = { error: string | null; row: T };
type FormInput = { title: string; body: string; locale: string | null; target_role: string | null };

const NOT_AUTH = "Not authorized";
const PENDING = "migration_pending";

/** Macros for the Inbox composer picker (staff only; empty when the table is missing). */
export async function listMacrosAction(): Promise<{ macros: MacroRow[]; migrationPending: boolean }> {
  if (!(await getStaffActor(SECTION))) return { macros: [], migrationPending: false };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_macros")
    .select(COLS)
    .order("uses", { ascending: false })
    .order("title", { ascending: true });
  if (error) return { macros: [], migrationPending: error.code === "42P01" };
  return { macros: (data as MacroRow[] | null) ?? [], migrationPending: false };
}

export async function createMacro(input: FormInput): Promise<Result<MacroRow | null>> {
  const actor = await getStaffActor(SECTION);
  if (!actor) return { error: NOT_AUTH, row: null };
  const parsed = parseMacroInput(input);
  if (!parsed.ok) return { error: `invalid_${parsed.error}`, row: null };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_macros")
    .insert({ ...parsed.value, created_by: actor.id })
    .select(COLS)
    .single();
  if (error) return { error: error.code === "42P01" ? PENDING : error.message, row: null };
  revalidatePath("/d/support/macros");
  return { error: null, row: data as MacroRow };
}

export async function updateMacro(id: string, input: FormInput): Promise<Result<MacroRow | null>> {
  if (!(await getStaffActor(SECTION))) return { error: NOT_AUTH, row: null };
  const parsed = parseMacroInput(input);
  if (!parsed.ok) return { error: `invalid_${parsed.error}`, row: null };
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_macros")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) return { error: error.code === "42P01" ? PENDING : error.message, row: null };
  revalidatePath("/d/support/macros");
  return { error: null, row: data as MacroRow };
}

export async function deleteMacro(id: string): Promise<Result> {
  if (!(await getStaffActor(SECTION))) return { error: NOT_AUTH, row: null };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_macros").delete().eq("id", id);
  if (error) return { error: error.code === "42P01" ? PENDING : error.message, row: null };
  revalidatePath("/d/support/macros");
  return { error: null, row: null };
}

/** Records that an agent inserted a macro (uses + 1). Best effort, never throws. */
export async function useMacro(id: string): Promise<{ error: string | null }> {
  if (!(await getStaffActor(SECTION))) return { error: NOT_AUTH };
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("support_macros").select("uses").eq("id", id).single();
  if (error) return { error: error.message };
  const uses = ((data as { uses?: number } | null)?.uses ?? 0) + 1;
  const { error: upErr } = await supabase.from("support_macros").update({ uses }).eq("id", id);
  return { error: upErr?.message ?? null };
}
