import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentStaff, requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { getInboxPage } from "@/lib/shell/inbox";
import { inboxCategoriesFor } from "@/lib/shell/inbox-kinds";
import InboxClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("inbox");
}

export default async function InboxPage() {
  await requirePathAccess("/inbox");
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const first = await getInboxPage(staff.id, staff.role, {});
  return <InboxClient initial={first} categories={inboxCategoriesFor(staff.role)} />;
}
