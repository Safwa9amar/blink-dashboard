"use client";

import { useTranslations } from "next-intl";
import { PageHeader, StatGrid, StatCard, DataTable, type Column } from "@/components/ui";
import {
  EditCustomerButton,
  DeleteCustomerButton,
  CustomerDetailButton,
  type Customer,
} from "@/features/customers";

// customer_profiles is embedded as a to-one (unique user_id) but PostgREST can
// surface it as a single-element array — normalise both to the display ID.
function displayId(row: Record<string, unknown>): string | null {
  const profile = row.customer_profiles as
    | { customer_id?: string | null }
    | { customer_id?: string | null }[]
    | null
    | undefined;
  if (!profile) return null;
  const one = Array.isArray(profile) ? profile[0] : profile;
  return one?.customer_id ?? null;
}

export default function CustomersClient({
  customers,
  error,
  total,
  newCount,
  male,
  female,
}: {
  customers: Record<string, unknown>[] | null;
  error?: string;
  total: number;
  newCount: number;
  male: number;
  female: number;
}) {
  const t = useTranslations("customers");

  const rows: Customer[] = (customers ?? []).map((row) => ({
    id: row.id as string,
    customer_id: displayId(row),
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone_number: row.phone_number as string | null,
    gender: row.gender as string | null,
    wilaya: row.wilaya as string | null,
    created_at: row.created_at as string,
  }));

  const columns: Column<Customer>[] = [
    {
      key: "customer_id",
      label: t("customer_id"),
      render: (c) =>
        c.customer_id ? (
          <span className="font-mono text-primary font-medium">{c.customer_id}</span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "name",
      label: t("name"),
      render: (c) => (
        <span className="font-medium text-text">
          {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: t("phone"), render: (c) => c.phone_number || "—" },
    {
      key: "email",
      label: t("email"),
      render: (c) => <span className="text-subtext">{c.email || "—"}</span>,
    },
    { key: "wilaya", label: t("wilaya"), render: (c) => c.wilaya || "—" },
    {
      key: "gender",
      label: t("gender"),
      render: (c) => <span className="capitalize">{c.gender || "—"}</span>,
    },
    {
      key: "created_at",
      label: t("joined"),
      render: (c) => (
        <span className="text-subtext">{new Date(c.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (c) => (
        <div className="flex items-center gap-1">
          <CustomerDetailButton customer={c} />
          <EditCustomerButton customer={c} />
          <DeleteCustomerButton customerId={c.id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("total")} value={total} icon="users" variant="primary" />
        <StatCard label={t("new_30d")} value={newCount} icon="trending" variant="info" />
        <StatCard label={t("male")} value={male} icon="activity" variant="success" />
        <StatCard label={t("female")} value={female} icon="activity" variant="warning" />
      </StatGrid>

      <DataTable columns={columns} data={rows} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
