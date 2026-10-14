"use server";

import { getStaffActor } from "@/lib/auth/staff";
import type { LiveOpsSnapshot } from "@/features/live-ops";
import { loadLiveOps } from "./data";

export async function refreshLiveOps(): Promise<{ snapshot: LiveOpsSnapshot } | { error: string }> {
  const actor = await getStaffActor("/live-ops");
  if (!actor) return { error: "not_authorized" };
  try {
    return { snapshot: await loadLiveOps() };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
