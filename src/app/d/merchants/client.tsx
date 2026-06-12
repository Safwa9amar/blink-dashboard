"use client";

import { useTranslations } from "next-intl";
import { PageHeader, StatGrid, StatCard, DataTable, type Column } from "@/components/ui";
import {
  EditMerchantButton,
  DeleteMerchantButton,
  MerchantDetailButton,
  type Merchant,
} from "@/features/merchants";

// merchant_profiles is embedded as a to-one (unique user_id) but PostgREST can
// surface it as a single-element array — normalise both to the display ID.
function displayId(row: Record<string, unknown>): string | null {
  const profile = row.merchant_profiles as
    | { merchant_id?: string | null }
    | { merchant_id?: string | null }[]
    | null
    | undefined;
  if (!profile) return null;
  const one = Array.isArray(profile) ? profile[0] : profile;
  return one?.merchant_id ?? null;
}

export default function MerchantsClient({
  merchants,
  error,
  total,
  newCount,
  male,
  female,
}: {
  merchants: Record<string, unknown>[] | null;
  error?: string;
  total: number;
  newCount: number;
  male: number;
  female: number;
}) {
  const t = useTranslations("merchants");

  const rows: Merchant[] = (merchants ?? []).map((row) => ({
    id: row.id as string,
    merchant_id: displayId(row),
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone_number: row.phone_number as string | null,
    gender: row.gender as string | null,
    wilaya: row.wilaya as string | null,
    created_at: row.created_at as string,
  }));

  const columns: Column<Merchant>[] = [
    {
      key: "merchant_id",
      label: t("merchant_id"),
      render: (m) =>
        m.merchant_id ? (
          <span className="font-mono text-primary font-medium">{m.merchant_id}</span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "name",
      label: t("name"),
      render: (m) => (
        <span className="font-medium text-text">
          {[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: t("phone"), render: (m) => m.phone_number || "—" },
    {
      key: "email",
      label: t("email"),
      render: (m) => <span className="text-subtext">{m.email || "—"}</span>,
    },
    { key: "wilaya", label: t("wilaya"), render: (m) => m.wilaya || "—" },
    {
      key: "gender",
      label: t("gender"),
      render: (m) => <span className="capitalize">{m.gender || "—"}</span>,
    },
    {
      key: "created_at",
      label: t("joined"),
      render: (m) => (
        <span className="text-subtext">{new Date(m.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (m) => (
        <div className="flex items-center gap-1">
          <MerchantDetailButton merchant={m} />
          <EditMerchantButton merchant={m} />
          <DeleteMerchantButton merchantId={m.id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("total")} value={total} icon="store" variant="primary" />
        <StatCard label={t("new_30d")} value={newCount} icon="trending" variant="info" />
        <StatCard label={t("male")} value={male} icon="activity" variant="success" />
        <StatCard label={t("female")} value={female} icon="activity" variant="warning" />
      </StatGrid>

      <DataTable columns={columns} data={rows} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
