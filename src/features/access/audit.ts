// Server-only: writes one row of the staff access audit trail.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessEventAction } from "./types";
import type { StaffRole } from "@/lib/auth/access";

export async function logAccessEvent(
  supabase: SupabaseClient,
  event: {
    actorId: string;
    targetId: string;
    action: AccessEventAction;
    fromRole?: StaffRole | null;
    toRole?: StaffRole | null;
    note?: string | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("staff_access_events").insert({
      actor_id: event.actorId,
      target_id: event.targetId,
      action: event.action,
      from_role: event.fromRole ?? null,
      to_role: event.toRole ?? null,
      note: event.note ?? null,
    });
    if (error) console.error("[access] audit insert failed:", error.message);
  } catch (e) {
    console.error("[access] audit insert threw:", e);
  }
}
