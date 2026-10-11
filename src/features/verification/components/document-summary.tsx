"use client";

import { DashIcon } from "@/components/ui";
import type { StoreDocSummary, TFn } from "../types";

// Compliance Audit Progress Bar: visual progress track (verified, pending,
// rejected, missing) with status pills and health percentage.
export function DocumentSummary({ t, summary }: { t: TFn; summary: StoreDocSummary }) {
  if (summary.total === 0) return null;
  const pct = Math.round((summary.verified / summary.total) * 100);
  const verifiedPct = (summary.verified / summary.total) * 100;
  const pendingPct = (summary.pending / summary.total) * 100;
  const rejectedPct = (summary.rejected / summary.total) * 100;
  const allVerified = summary.verified === summary.total;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 mb-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
            <DashIcon name="shield" className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-subtext">
                {t("stores.stages.audit_status")}
              </span>
              <span className="text-xs font-bold text-success">
                {pct}%
              </span>
            </div>
            <p className="text-xs font-semibold text-text mt-0.5">
              {t("doc_summary.verified", { n: summary.verified, total: summary.total })}
              {allVerified && <span className="text-success ms-1.5 font-bold">✓ {t("stores.stages.complete")}</span>}
            </p>
          </div>
        </div>

        {/* Status Pill Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-success-light/30 border border-success/30 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            {t("doc_summary.verified", { n: summary.verified, total: summary.total })}
          </span>

          {summary.pending > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-warning-light/30 border border-warning/35 text-warning animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
              {t("doc_summary.pending", { n: summary.pending })}
            </span>
          )}

          {summary.rejected > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-danger-light/30 border border-danger/35 text-danger">
              <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
              {t("doc_summary.rejected", { n: summary.rejected })}
            </span>
          )}

          {summary.missing > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted border border-border text-subtext">
              <span className="w-1.5 h-1.5 rounded-full bg-subtext"></span>
              {t("doc_summary.missing", { n: summary.missing })}
            </span>
          )}
        </div>
      </div>

      {/* Multi-Segment Visual Progress Track */}
      <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden flex border border-border/30">
        {verifiedPct > 0 && (
          <div
            style={{ width: `${verifiedPct}%` }}
            className="h-full bg-success transition-all duration-500"
            title={`${summary.verified} verified`}
          />
        )}
        {pendingPct > 0 && (
          <div
            style={{ width: `${pendingPct}%` }}
            className="h-full bg-warning transition-all duration-500"
            title={`${summary.pending} pending review`}
          />
        )}
        {rejectedPct > 0 && (
          <div
            style={{ width: `${rejectedPct}%` }}
            className="h-full bg-danger transition-all duration-500"
            title={`${summary.rejected} rejected`}
          />
        )}
      </div>
    </div>
  );
}
