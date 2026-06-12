"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasStaffRole } from "@/lib/auth/staff";
import { revalidatePath } from "next/cache";

// Mutations run through the service-role client (past RLS) and are gated by
// hasStaffRole. Every write is constrained to `role='merchant'`.

export async function updateMerchant(
  merchantId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    wilaya?: string;
  }
) {
  if (!(await hasStaffRole("super_admin", "commerce_admin", "hr_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .update(data)
    .eq("id", merchantId)
    .eq("role", "merchant");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/merchants");
  return { error: null };
}

export async function deleteMerchant(merchantId: string) {
  // Deletion is destructive — reserve it for super_admin even though others can edit.
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", merchantId)
    .eq("role", "merchant");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/merchants");
  return { error: null };
}
