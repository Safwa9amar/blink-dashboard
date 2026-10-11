"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable, FilterPills, Badge, type Column } from "@/components/ui";
import {
  CancelDeletionButton,
  CompleteDeletionButton,
  DeletionRequestDetailButton,
  DeletionStatusBadge,
  toDeletionRequest,
  useReasonLabel,
  type DeletionRequest,
} from "@/features/deletion-requests";

type HistoryFilter = "all" | "completed" | "cancelled";

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

export default function DeletionRequestsClient({
  view,
  requests,
  error,
}: {
  /** `requests` = the pending queue · `history` = deleted accounts + cancelled requests. */
  view: "requests" | "history";
  requests: Record<string, unknown>[] | null;
  error?: string;
}) {
  const t = useTranslations("deletion_requests");
  const reasonLabel = useReasonLabel();
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const rows = (requests ?? []).map(toDeletionRequest);
  const visible = view === "history" && filter !== "all" ? rows.filter((r) => r.status === filter) : rows;

  const userColumn: Column<DeletionRequest> = {
    key: "name",
    label: t("user"),
    render: (r) => (
      <div className="min-w-0">
        <p className={r.name ? "font-medium text-text" : "italic text-subtext"}>{r.name || t("deleted_user")}</p>
        <p className="text-xs text-subtext">{r.phone_number || r.email || r.user_id.slice(0, 8)}</p>
      </div>
    ),
  };
  const roleColumn: Column<DeletionRequest> = {
    key: "role",
    label: t("role"),
    render: (r) => <Badge>{r.role}</Badge>,
  };
  const reasonColumn: Column<DeletionRequest> = {
    key: "reason",
    label: t("reason"),
    render: (r) => reasonLabel(r.reason),
  };
  const requestedColumn: Column<DeletionRequest> = {
    key: "created_at",
    label: t("requested"),
    render: (r) => <span className="text-subtext">{formatDate(r.created_at)}</span>,
  };

  const columns: Column<DeletionRequest>[] =
    view === "requests"
      ? [
          userColumn,
          roleColumn,
          reasonColumn,
          {
            key: "feedback",
            label: t("feedback"),
            sortable: false,
            render: (r) => (
              <span className="block max-w-[260px] truncate text-subtext" title={r.feedback ?? undefined}>
                {r.feedback || "—"}
              </span>
            ),
          },
          requestedColumn,
          {
            key: "actions",
            label: t("actions"),
            sortable: false,
            render: (r) => (
              <div className="flex items-center gap-2">
                <DeletionRequestDetailButton request={r} />
                <CompleteDeletionButton request={r} />
                <CancelDeletionButton request={r} />
              </div>
            ),
          },
        ]
      : [
          userColumn,
          roleColumn,
          reasonColumn,
          { key: "status", label: t("outcome"), render: (r) => <DeletionStatusBadge status={r.status} /> },
          requestedColumn,
          {
            key: "processed_at",
            label: t("processed"),
            render: (r) => <span className="text-subtext">{formatDate(r.processed_at)}</span>,
          },
          {
            key: "processed_by_name",
            label: t("processed_by"),
            render: (r) => <span className="text-subtext">{r.processed_by_name || "—"}</span>,
          },
          {
            key: "actions",
            label: "",
            sortable: false,
            render: (r) => <DeletionRequestDetailButton request={r} />,
          },
        ];

  return (
    <>
      {view === "history" && (
        <FilterPills<HistoryFilter>
          options={[
            ["all", t("all")],
            ["completed", t("completed")],
            ["cancelled", t("cancelled")],
          ]}
          value={filter}
          onChange={setFilter}
        />
      )}

      <DataTable
        columns={columns}
        data={visible}
        error={error}
        emptyMessage={view === "requests" ? t("empty") : t("empty_history")}
      />
    </>
  );
}
