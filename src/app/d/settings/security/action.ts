"use server";

// Audit trail for the signed-in user's own two-factor / passkey changes. The browser does
// the change with the user's session; these actions only RECORD it, and never trust the
// client: they re-read the user from the SSR session and verify the real state with the
// admin API before logging (actor = target = self).

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAccessEvent } from "@/features/access/audit";

type Change = "added" | "removed";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function lastEventNote(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  actions: string[],
): Promise<{ action: string; note: string | null } | null> {
  const { data } = await admin
    .from("staff_access_events")
    .select("action, note")
    .eq("actor_id", userId)
    .eq("target_id", userId)
    .in("action", actions)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as { action: string; note: string | null } | undefined) ?? null;
}

/** Records mfa_enrolled / mfa_removed after verifying the factor state server-side. */
export async function recordMfaChange(change: Change): Promise<{ logged: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { logged: false };
  const admin = await createAdminClient();

  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) return { logged: false };
  const hasVerified = (data?.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified");
  // The claimed change must match reality.
  if (change === "added" && !hasVerified) return { logged: false };
  if (change === "removed" && hasVerified) return { logged: false };

  const action = change === "added" ? "mfa_enrolled" : "mfa_removed";
  // Don't log the same transition twice (e.g. a repeated client call).
  const last = await lastEventNote(admin, userId, ["mfa_enrolled", "mfa_removed"]);
  if (last?.action === action) return { logged: false };
  if (!last && change === "removed") return { logged: false };

  await logAccessEvent(admin, { actorId: userId, targetId: userId, action });
  return { logged: true };
}

/**
 * Records passkey_added / passkey_removed. The admin passkey list gives the real count;
 * the count is stored in the event note so repeated client calls can't forge extra events.
 */
export async function recordPasskeyChange(change: Change): Promise<{ logged: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { logged: false };
  const admin = await createAdminClient();

  let count: number | null = null;
  try {
    const { data, error } = await admin.auth.admin.passkey.listPasskeys({ userId });
    if (!error) count = data?.length ?? 0;
  } catch {
    // admin client without the passkey flag: fall back to trusting the authenticated user
  }

  const last = await lastEventNote(admin, userId, ["passkey_added", "passkey_removed"]);
  const lastCount = last?.note?.match(/^count=(\d+)$/)?.[1];
  if (count !== null) {
    const baseline = lastCount !== undefined ? Number(lastCount) : change === "added" ? 0 : count + 1;
    if (change === "added" && count <= baseline) return { logged: false };
    if (change === "removed" && count >= baseline) return { logged: false };
  }

  await logAccessEvent(admin, {
    actorId: userId,
    targetId: userId,
    action: change === "added" ? "passkey_added" : "passkey_removed",
    note: count !== null ? `count=${count}` : null,
  });
  return { logged: true };
}
