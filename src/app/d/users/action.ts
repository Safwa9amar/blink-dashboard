"use server";

import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";
import { revalidatePath } from "next/cache";

export async function updateUser(
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
  }
) {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update(data)
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/users");
  return { error: null };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  return updateUser(userId, { is_active: isActive });
}

export async function createUser(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number: string;
  role: string;
}) {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("users").insert({
    ...data,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/users");
  return { error: null };
}

export async function deleteUser(userId: string) {
  // Deletion is destructive — reserve it for super_admin even though ops_admin can edit.
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/d/users");
  return { error: null };
}
