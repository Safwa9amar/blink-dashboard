"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable, Badge, DashIcon, type Column } from "@/components/ui";
import { ROLE_VARIANT } from "./deep-link-field";
import type { DeepLinkRoute } from "../types";

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      aria-label="Copy"
      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer shrink-0"
    >
      <DashIcon name={done ? "shield" : "doc"} className="w-3.5 h-3.5" />
    </button>
  );
}

export function DeepLinkTable({ routes }: { routes: DeepLinkRoute[] }) {
  const t = useTranslations("deep_links");
  const columns: Column<DeepLinkRoute>[] = [
    { key: "label", label: t("col.destination"), render: (r) => <span className="font-medium text-text">{r.label}</span> },
    {
      key: "deepLink",
      label: t("col.deep_link"),
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <code className="text-[12px] font-mono text-subtext">{r.deepLink}</code>
          <CopyButton value={r.deepLink} />
        </span>
      ),
    },
    { key: "role", label: t("col.role"), render: (r) => <Badge variant={ROLE_VARIANT[r.role]}>{r.role}</Badge> },
    {
      key: "params",
      label: t("col.params"),
      sortable: false,
      render: (r) =>
        r.requiresParams.length ? (
          <span className="text-[12px] font-mono text-primary">{r.requiresParams.map((p) => `:${p}`).join(" ")}</span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
  ];
  return <DataTable columns={columns} data={routes} empty={t("no_routes")} pageSize={25} />;
}
