// Domain types for the merchants feature.
//
// A "merchant" is a `users` row with `role='merchant'` AND `staff_role IS NULL`,
// optionally joined to its `merchant_profiles` row (display ID "BK-MR-100023").
// Common fields — name, wilaya — live on `users`; the profile table holds only the
// display ID. Kept in sync by hand with the blink-server Drizzle schema.
export interface Merchant {
  id: string;
  merchant_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  wilaya: string | null;
  created_at: string;
}
