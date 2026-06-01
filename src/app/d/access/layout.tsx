import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { defaultPathFor } from "@/lib/auth/access";
import { AccessSubNav } from "./sub-nav";

export default async function AccessLayout({ children }: { children: ReactNode }) {
  // Managing dashboard access is super_admin-only — enforced here in the layout so
  // it covers every access sub-route (members, roles, activity), not just the index.
  const role = await getCurrentStaffRole();
  if (role !== "super_admin") redirect(defaultPathFor(role));

  const t = await getTranslations("access");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AccessSubNav />
      {children}
    </div>
  );
}
