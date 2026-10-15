"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffActor } from "@/lib/auth/staff";
import { PRIORITIES, type Priority, type SlaPolicy } from "@/features/support/metrics";

const MISSING = /does not exist|schema cache/i;

function fail(e: { code?: string; message: string }): { error: string } {
  return { error: e.code === "42703" || e.code === "42P01" || MISSING.test(e.message) ? "migration_pending" : e.message };
}

export async function setConversationPriority(id: string, priority: Priority): Promise<{ error: string | null }> {
  if (!(await getStaffActor("/support"))) return { error: "not_authorized" };
  if (!PRIORITIES.includes(priority)) return { error: "invalid" };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_conversations").update({ priority }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/d/support");
  return { error: null };
}

export async function saveSlaPolicies(policies: SlaPolicy[]): Promise<{ error: string | null }> {
  const actor = await getStaffActor("/support");
  if (!actor) return { error: "not_authorized" };
  const rows = [];
  for (const p of policies) {
    if (
      !PRIORITIES.includes(p.priority) ||
      !Number.isInteger(p.first_response_minutes) ||
      !Number.isInteger(p.resolution_minutes) ||
      p.first_response_minutes < 1 ||
      p.resolution_minutes < p.first_response_minutes ||
      p.resolution_minutes > 525600
    ) {
      return { error: "invalid" };
    }
    rows.push({
      priority: p.priority,
      first_response_minutes: p.first_response_minutes,
      resolution_minutes: p.resolution_minutes,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    });
  }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_sla_policies").upsert(rows, { onConflict: "priority" });
  if (error) return fail(error);
  revalidatePath("/d/support");
  return { error: null };
}
