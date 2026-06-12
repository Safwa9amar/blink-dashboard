"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { revalidatePath } from "next/cache";

// Mutations run through the service-role client (past RLS, which would otherwise
// scope writes to the admin's own row) and are gated by hasStaffRole. Every write
// is also constrained to `role='customer'` so this action can't touch staff/other
// personas.

export async function updateCustomer(
  customerId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    wilaya?: string;
  }
) {
  if (!(await hasStaffRole("super_admin", "ops_admin", "hr_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .update(data)
    .eq("id", customerId)
    .eq("role", "customer");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/customers");
  return { error: null };
}

export async function deleteCustomer(customerId: string) {
  // Deletion is destructive — reserve it for super_admin even though others can edit.
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", customerId)
    .eq("role", "customer");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/customers");
  return { error: null };
}
