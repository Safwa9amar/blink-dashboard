// Domain types for the customers feature.
//
// A "customer" is a row of the shared `users` table whose `role = 'customer'`,
// optionally joined to its `customer_profiles` row (which carries the human-readable
// display ID like "BK-CU-100023"). Common fields — name, wilaya, address — live on
// `users`; the profile table holds only the display ID. Kept in sync by hand with the
// blink-server Drizzle schema (there is no shared schema package). The `users` table
// has NO active/status flag — do not reintroduce one here.
export interface Customer {
  id: string;
  customer_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  wilaya: string | null;
  created_at: string;
}
