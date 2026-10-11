import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatGrid, StatCard } from "@/components/ui";
import { DeletionSubNav } from "@/features/deletion-requests";

export default async function DeletionRequestsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("deletion_requests");
  // Service-role client: RLS only lets a user read their own request.
  const supabase = await createAdminClient();
  const count = (status: string) =>
    supabase
      .from("account_deletion_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
  const [pendingRes, completedRes, cancelledRes] = await Promise.all([
    count("pending"),
    count("completed"),
    count("cancelled"),
  ]);
  const pending = pendingRes.count ?? 0;
  const completed = completedRes.count ?? 0;
  const cancelled = cancelledRes.count ?? 0;

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("pending")} value={pending} icon="clock" variant="warning" />
        <StatCard label={t("completed")} value={completed} icon="trash" variant="success" />
        <StatCard label={t("cancelled")} value={cancelled} icon="x" variant="info" />
        <StatCard label={t("total")} value={pending + completed + cancelled} icon="doc" variant="primary" />
      </StatGrid>

      <DeletionSubNav pending={pending} processed={completed + cancelled} />
      {children}
    </div>
  );
}
