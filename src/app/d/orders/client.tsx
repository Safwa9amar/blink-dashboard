"use client";

import { useTranslations } from "next-intl";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "info" | "warning" | "primary" | "default"> = {
  delivered: "success",
  canceled: "danger",
  merchant_rejected: "danger",
  on_the_way: "info",
  searching: "warning",
  processing: "warning",
  preparation: "warning",
  pickup: "primary",
  heading_to_store: "info",
};

interface OrdersClientProps {
  orders: Record<string, unknown>[] | null;
  error?: string;
}

export default function OrdersClient({ orders, error }: OrdersClientProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");

  const columns = [
    {
      key: "store_name",
      label: t("store"),
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.store_name as string}</span>
      ),
    },
    {
      key: "type",
      label: t("type"),
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{row.type as string}</span>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={statusVariant[status] ?? "default"}>
            {t(`statuses.${status}` as Parameters<typeof t>[0])}
          </Badge>
        );
      },
    },
    {
      key: "total",
      label: t("total"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium">{(row.total as number)?.toFixed(2)} {tc("da")}</span>
      ),
    },
    {
      key: "items",
      label: t("items"),
      render: (row: Record<string, unknown>) => (
        <span>{(row.items as unknown[])?.length ?? 0}</span>
      ),
    },
    {
      key: "created_at",
      label: tc("created"),
      render: (row: Record<string, unknown>) => (
        <span className="text-subtext">
          {new Date(row.created_at as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable columns={columns} data={orders} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
