"use client";

import { useTranslations } from "next-intl";
import { DataTable, Badge, type Column, type Variant } from "@/components/ui";
import { ACCESS_LOG, type AccessLogEntry, type AccessAction } from "../data";
import { RoleBadge } from "./role-badge";

const ACTION_VARIANT: Record<AccessAction, Variant> = {
  granted: "success",
  changed: "info",
  revoked: "danger",
  suspended: "warning",
  reinstated: "success",
};

export function AuditLog() {
  const t = useTranslations("access");

  const columns: Column<AccessLogEntry>[] = [
    {
      key: "at",
      label: t("log.when"),
      render: (row) => (
        <span className="text-subtext whitespace-nowrap">
          {new Date(row.at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    { key: "actor", label: t("log.actor"), render: (row) => <span className="font-medium text-text">{row.actor}</span> },
    {
      key: "action",
      label: t("log.action"),
      render: (row) => <Badge variant={ACTION_VARIANT[row.action]}>{t(`log.actions.${row.action}`)}</Badge>,
    },
    { key: "target", label: t("log.target"), render: (row) => <span className="text-text">{row.target}</span> },
    {
      key: "role",
      label: t("table.role"),
      render: (row) => (row.role ? <RoleBadge role={row.role} /> : <span className="text-subtext/40">—</span>),
    },
  ];

  return <DataTable columns={columns} data={ACCESS_LOG} emptyMessage={t("log.empty")} />;
}
