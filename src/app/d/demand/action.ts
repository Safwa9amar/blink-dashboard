"use server";

import { getStaffActor } from "@/lib/auth/staff";
import { DEMAND_RANGES, type DemandRange, type DemandSnapshot } from "@/features/demand";
import { loadDemand } from "./data";

/** Re-reads the snapshot for the client's refresh poll. Returns null when the caller is not allowed. */
export async function refreshDemand(range: DemandRange): Promise<DemandSnapshot | null> {
  const actor = await getStaffActor("/demand");
  if (!actor) return null;
  return loadDemand(DEMAND_RANGES.includes(range) ? range : "7d");
}
