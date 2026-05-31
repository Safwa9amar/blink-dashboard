"use server";

import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";
import { isStaffRole, type StaffRole } from "@/lib/auth/access";
import { revalidatePath } from "next/cache";

// Friendly message shown until the blink-server migration adds `users.staff_role`.
// 42703 = Postgres undefined_column.
const PENDING =
  "Dashboard roles aren't enabled yet — the staff_role column is pending the blink-server migration.";

// Create a new console account and assign a dashboard role in one step.
// Only a super_admin may create staff members.
export async function createStaffMember(data: {
  first_name: string;
  last_name?: string;
  email: string;
  phone_number: string;
  staff_role: StaffRole;
  is_active?: boolean;
}) {
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  if (!data.first_name || !data.email || !data.phone_number) {
    return { error: "Name, email and phone are required" };
  }
  if (!isStaffRole(data.staff_role)) {
    return { error: "Invalid role" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").insert({
    first_name: data.first_name,
    last_name: data.last_name ?? null,
    email: data.email,
    phone_number: data.phone_number,
    staff_role: data.staff_role,
    is_active: data.is_active ?? true,
  });

  if (error) {
    return { error: error.code === "42703" ? PENDING : error.message };
  }

  revalidatePath("/d/access");
  return { error: null };
}

// Assign or change a user's dashboard role. Pass null to revoke all access.
// Only a super_admin may manage dashboard access.
export async function setStaffRole(userId: string, staffRole: StaffRole | null) {
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  if (staffRole !== null && !isStaffRole(staffRole)) {
    return { error: "Invalid role" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ staff_role: staffRole }).eq("id", userId);

  if (error) {
    return { error: error.code === "42703" ? PENDING : error.message };
  }

  revalidatePath("/d/access");
  return { error: null };
}

// Grant dashboard access to an existing Blink user, looked up by account email.
export async function grantStaffRole(email: string, staffRole: StaffRole) {
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  if (!email) {
    return { error: "Email is required" };
  }
  if (!isStaffRole(staffRole)) {
    return { error: "Invalid role" };
  }

  const supabase = await createClient();
  const { data: user, error: findError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    return { error: findError.message };
  }
  if (!user) {
    return { error: "No Blink user found with that email." };
  }

  const { error } = await supabase
    .from("users")
    .update({ staff_role: staffRole })
    .eq("id", (user as { id: string }).id);

  if (error) {
    return { error: error.code === "42703" ? PENDING : error.message };
  }

  revalidatePath("/d/access");
  return { error: null };
}
