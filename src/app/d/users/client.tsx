"use client";

import { useTranslations } from "next-intl";
import { PageHeader, DataTable, Badge } from "@/components/ui";
import {
  ToggleActiveButton,
  EditUserButton,
  DeleteUserButton,
  UserStatusBadge,
  AddUserButton,
} from "@/features/users";

const roleVariant: Record<string, "primary" | "success" | "info" | "warning" | "default"> = {
  super_admin: "primary",
  rider: "success",
  merchant: "info",
  agent: "warning",
  customer: "default",
};

export default function UsersClient({
  users,
  error,
}: {
  users: Record<string, unknown>[] | null;
  error?: string;
}) {
  const t = useTranslations("users");
  const tc = useTranslations("common");

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">
          {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: t("phone") },
    {
      key: "role",
      label: t("role"),
      render: (row: Record<string, unknown>) => (
        <Badge variant={roleVariant[row.role as string] ?? "default"}>
          {row.role as string}
        </Badge>
      ),
    },
    {
      key: "is_active",
      label: t("status"),
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <ToggleActiveButton userId={row.id as string} isActive={row.is_active as boolean} />
          <UserStatusBadge isActive={row.is_active as boolean} />
        </div>
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
    {
      key: "actions",
      label: t("actions"),
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <EditUserButton
            user={{
              id: row.id as string,
              first_name: row.first_name as string | null,
              last_name: row.last_name as string | null,
              email: row.email as string | null,
              phone_number: row.phone_number as string,
              role: row.role as string,
              gender: row.gender as string | null,
              is_active: row.is_active as boolean,
            }}
          />
          <DeleteUserButton userId={row.id as string} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} action={<AddUserButton />} />
      <DataTable columns={columns} data={users} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
