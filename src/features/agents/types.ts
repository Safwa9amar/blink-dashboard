// Domain types for the agents feature.
//
// An "agent" is a `users` row with `role='agent'` AND `staff_role IS NULL`,
// optionally joined to its `agent_profiles` row (display ID "BK-AG-100023") and its
// `agent_shops` rows (an agent can run several; the primary one leads). Common
// fields — name, wilaya — live on `users`. Kept in sync by hand with the
// blink-server Drizzle schema.
import type { HoursGroup } from "@/features/verification";

export type ShopReviewStatus = "under_review" | "active" | "rejected";

export interface AgentShop {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  /** The open / closed toggle riders see. */
  open: boolean;
  openTime: string;
  closeTime: string;
  rating: number | null;
  isPrimary: boolean;
  review: ShopReviewStatus;
  /** Weekly opening hours grouped by run of days; null = not set. */
  hours: HoursGroup[] | null;
}

export interface Agent {
  id: string;
  agent_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  wilaya: string | null;
  created_at: string;
  /** Primary shop first. */
  shops: AgentShop[];
}
