import type { Variant } from "@/components/ui";
import type { Availability } from "./availability";

export const AVAIL_VARIANT: Record<Availability, Variant> = {
  live: "success",
  scheduled: "info",
  paused: "warning",
  ended: "default",
  sold_out: "danger",
  budget_spent: "danger",
  archived: "default",
};

export const AVAILABILITIES: Availability[] = ["live", "scheduled", "paused", "ended", "sold_out", "budget_spent"];
