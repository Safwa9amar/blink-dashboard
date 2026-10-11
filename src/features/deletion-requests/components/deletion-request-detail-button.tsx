"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui";
import type { DeletionRequest } from "../types";
import { DeletionStatusBadge } from "./deletion-status-badge";
import { useReasonLabel } from "./use-reason-label";

export function DeletionRequestDetailButton({ request }: { request: DeletionRequest }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("deletion_requests");
  const reasonLabel = useReasonLabel();

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("user"), value: request.name || t("deleted_user") },
    { label: t("phone"), value: request.phone_number || "—" },
    { label: t("email"), value: request.email || "—" },
    { label: t("role"), value: <span className="capitalize">{request.role}</span> },
    { label: t("reason"), value: reasonLabel(request.reason) },
    { label: t("requested"), value: new Date(request.created_at).toLocaleString() },
    { label: t("status"), value: <DeletionStatusBadge status={request.status} /> },
    {
      label: t("processed"),
      value: request.processed_at ? new Date(request.processed_at).toLocaleString() : "—",
    },
    { label: t("processed_by"), value: request.processed_by_name || "—" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--subtext)] hover:text-[var(--text)] transition-colors cursor-pointer"
        title={t("view")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("request_details")}>
        <dl className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4">
              <dt className="text-sm text-[var(--subtext)] shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-[var(--text)] text-end break-all">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <p className="text-sm text-[var(--subtext)] mb-2">{t("feedback")}</p>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap break-words rounded-xl bg-[var(--muted)] p-3">
            {request.feedback || t("no_feedback")}
          </p>
        </div>
      </Modal>
    </>
  );
}
