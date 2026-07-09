"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import type { AlertRuleInsert } from "@/features/blink-server";

// Blink Server → Alerts CRUD. Admin-only mutations on the shared alert_rules table.
// The tables are service-role-only (RLS deny-by-default), so writes go through
// createAdminClient; hasStaffRole gates the operator. The blink-server evaluator
// reads these rules and writes alert_events (history) on its own.
const PATH = "/d/blink-server/alerts";

export async function createAlertRule(input: AlertRuleInsert): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("alert_rules").insert(input);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null };
}

export async function updateAlertRule(
  id: string,
  input: Partial<AlertRuleInsert>
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("alert_rules").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null };
}

export async function toggleAlertRule(
  id: string,
  enabled: boolean
): Promise<{ error: string | null }> {
  return updateAlertRule(id, { enabled });
}

export async function deleteAlertRule(id: string): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin"))) return { error: "Not authorized" };
  const supabase = await createAdminClient();
  // alert_events cascade on the FK, so history for this rule is removed too.
  const { error } = await supabase.from("alert_rules").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null };
}
