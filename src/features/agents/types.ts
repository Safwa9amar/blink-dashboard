// Domain types for the agents feature.
//
// An "agent" is a `users` row with `role='agent'` AND `staff_role IS NULL`,
// optionally joined to its `agent_profiles` row (display ID "BK-AG-100023").
// Common fields — name, wilaya — live on `users`; the profile table holds only the
// display ID (the agent's SHOP lives separately in agent_shops). Kept in sync by
// hand with the blink-server Drizzle schema.
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
}
