import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getStaffActor, requirePathAccess } from "@/lib/auth/staff";
import Client from "./client";
import { loadStaff } from "./data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("access");
}

export default async function Page() {
  await requirePathAccess("/access");
  const [actor, staff] = await Promise.all([getStaffActor("/access"), loadStaff()]);
  return <Client tab="members" staff={staff} currentUserId={actor?.id ?? ""} />;
}
