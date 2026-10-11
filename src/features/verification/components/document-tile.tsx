"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from "react";
import { DashIcon } from "@/components/ui";
import type { ReviewDocState, TFn } from "../types";
import { DocumentViewer } from "./document-viewer";
import { StatusBadge } from "./status-badge";
import { UntrustedUrl } from "./untrusted-url";

// One document slot: thumbnail with hover zoom that opens the full-size viewer,
// status badge, and review action controls.
export function DocumentTile({
  t,
  label,
  url,
  trusted,
  isPdf,
  status,
  statusNs,
  note,
  actions,
}: {
  t: TFn;
  label: string;
  url: string | null;
  trusted: boolean;
  isPdf: boolean;
  status?: ReviewDocState;
  /** Wording of the status badge (see StatusBadge). */
  statusNs?: "status" | "doc_status";
  note?: string | null;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const missing = status === "missing";
  const previewable = !!url && trusted;
  const untrusted = !!url && !trusted;
  const placeholder = previewable ? t("viewer.pdf") : missing ? t("viewer.not_uploaded") : t("viewer.unavailable");
  
  const border = missing
    ? "border-dashed border-danger/40 bg-danger/[0.02]"
    : status === "rejected"
      ? "border-danger/45 bg-danger/[0.03]"
      : untrusted || status === "pending"
        ? "border-warning/45 bg-warning/[0.03]"
        : status === "verified"
          ? "border-success/35 bg-success/[0.02]"
          : "border-border bg-background/80";

  const thumb = "aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted/70 flex items-center justify-center relative group";
  const badge = status && <StatusBadge t={t} status={status} ns={statusNs} />;

  return (
    <div className={`rounded-xl border p-2.5 flex flex-col gap-2 min-w-0 transition-all duration-200 ${border}`}>
      {previewable ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("viewer.open", { doc: label })}
          className={`${thumb} cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all`}
        >
          {isPdf ? (
            <span className="flex flex-col items-center gap-1.5 text-xs text-subtext">
              <DashIcon name="doc" className="w-6 h-6 text-primary" />
              <span className="font-medium">{placeholder}</span>
            </span>
          ) : (
            <>
              <img
                src={url}
                alt={label}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                <DashIcon name="search" className="w-4 h-4" />
                <span>{t("viewer.open", { doc: "" }).trim() || "Zoom"}</span>
              </span>
            </>
          )}
        </button>
      ) : (
        <div className={thumb}>
          <span
            className={`flex flex-col items-center gap-1 text-xs text-center px-2 ${
              missing ? "text-danger" : untrusted ? "text-warning" : "text-subtext"
            }`}
          >
            <DashIcon name={untrusted ? "warn" : "doc"} className="w-5 h-5 opacity-70" />
            <span className="font-semibold text-[11px]">{untrusted ? t("viewer.untrusted") : placeholder}</span>
          </span>
        </div>
      )}

      {/* Label and Status */}
      <div className="flex items-center justify-between gap-1.5 mt-0.5">
        <span className="text-[12px] font-semibold text-text truncate" title={label}>
          {label}
        </span>
        {badge}
      </div>

      {untrusted && <UntrustedUrl t={t} url={url} bare />}
      {note && (
        <p className="text-[11px] text-danger bg-danger-light/30 border border-danger/25 rounded-md px-2 py-0.5">
          {t("note", { note })}
        </p>
      )}
      {actions && <div className="mt-auto pt-1">{actions}</div>}

      {previewable && (
        <DocumentViewer
          open={open}
          t={t}
          title={label}
          url={url}
          trusted
          isPdf={isPdf}
          onClose={() => setOpen(false)}
          footer={
            (badge || actions) && (
              <div className="flex flex-wrap items-start gap-2.5">
                {badge && <div className="pt-1">{badge}</div>}
                {actions}
              </div>
            )
          }
        />
      )}
    </div>
  );
}
