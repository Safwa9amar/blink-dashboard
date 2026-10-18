import type { StaffRole } from "@/lib/auth/access";

// Writes: super_admin + finance_admin. Reads: also ops_admin + commerce_admin.
export const PRICING_WRITE_ROLES: readonly StaffRole[] = ["super_admin", "finance_admin"];
export const PRICING_READ_ROLES: readonly StaffRole[] = ["super_admin", "finance_admin", "ops_admin", "commerce_admin"];
