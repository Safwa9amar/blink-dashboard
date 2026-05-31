"use client";

import { useTranslations } from "next-intl";
import { DataTable, Badge, NameCell, Button, type Column, type Variant } from "@/components/ui";
import { KYC, KYC_STATUS, type KycRow } from "../data";

const roleVariant = (role: string): Variant =>
  role === "merchant" ? "primary" : role === "rider" ? "success" : "warning";

export function VerificationTable() {
  const t = useTranslations("verification");

  const columns: Column<KycRow>[] = [
    { key: "who", label: t("applicant"), render: (r) => <NameCell name={r.who} /> },
    { key: "role", label: t("role"), render: (r) => <Badge variant={roleVariant(r.role)}>{r.role}</Badge> },
    { key: "doc", label: t("documents"), tdClass: "text-subtext" },
    {
      key: "status",
      label: t("status"),
      render: (r) => (
        <div>
          <Badge variant={KYC_STATUS[r.status]}>{t(`st.${r.status}`)}</Badge>
          {r.reason && <div className="text-[11px] text-subtext mt-1">{r.reason}</div>}
        </div>
      ),
    },
    { key: "sub", label: t("submitted"), tdClass: "text-subtext" },
    {
      key: "act",
      label: "",
      render: (r) =>
        r.status === "pending" || r.status === "in_progress" ? (
          <Button size="sm">{t("review")}</Button>
        ) : (
          <span className="text-subtext text-xs">—</span>
        ),
    },
  ];

  return <DataTable columns={columns} data={KYC} empty={t("empty")} />;
}
