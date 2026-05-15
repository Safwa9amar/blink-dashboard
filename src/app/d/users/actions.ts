"use server";

import { createClient } from "@/lib/supabase/server";
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
