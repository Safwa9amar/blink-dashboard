"use client";

import { useTranslations } from "next-intl";
import { PageHeader, StatCard, Card, CardHeader } from "@/components/ui";
import { useDocumentTitle } from "@/lib/use-document-title";

interface DashboardStats {
  users: number;
  riders: number;
  orders: number;
  trips: number;
  transactions: number;
}

interface DashboardClientProps {
  stats: DashboardStats;
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const t = useTranslations("overview");
  useDocumentTitle(t("title"), stats.users.toLocaleString());

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label={t("total_users")} value={stats.users} variant="primary" />
        <StatCard label={t("active_riders")} value={stats.riders} variant="success" />
        <StatCard label={t("orders")} value={stats.orders} variant="info" />
        <StatCard label={t("trips")} value={stats.trips} variant="warning" />
        <StatCard label={t("transactions")} value={stats.transactions} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t("recent_orders")} description={t("recent_orders_desc")} />
          <p className="text-subtext text-sm">{t("placeholder_text")}</p>
        </Card>
        <Card>
          <CardHeader title={t("recent_trips")} description={t("recent_trips_desc")} />
          <p className="text-subtext text-sm">{t("placeholder_text")}</p>
        </Card>
      </div>
    </div>
  );
}
