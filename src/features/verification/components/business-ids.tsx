import type { ReactNode } from "react";
import { DashIcon } from "@/components/ui";
import type { ReviewDocState, StoreIdKey, TFn } from "../types";
import { StatusBadge } from "./status-badge";

export interface BusinessIdRow {
  key: StoreIdKey;
  value: string | null;
  /** Review state, when the number is reviewed on its own (a store's NIF / NIS). */
  status?: ReviewDocState;
  /** Staff's reason when rejected. */
  reason?: string | null;
  /** Verify / reject controls. */
  actions?: ReactNode;
}

// NIF / NIS Algerian fiscal smart credentials: monospace identifier,
// status badge, inline verification actions, and rejection note if flagged.
export function BusinessIds({ t, ids }: { t: TFn; ids: readonly BusinessIdRow[] }) {
  if (ids.length === 0) return null;
  return (
    <dl className="grid gap-3 sm:grid-cols-2 mb-3">
      {ids.map((id) => {
        const isVerified = id.status === "verified";
        const isPending = id.status === "pending";
        const isRejected = id.status === "rejected";
        const isMissing = id.status === "missing";

        const cardStyle = isMissing
          ? "border-dashed border-danger/40 bg-danger/[0.03]"
          : isRejected
            ? "border-danger/40 bg-danger/[0.04] shadow-sm"
            : isPending
              ? "border-warning/50 bg-warning/[0.05] shadow-sm shadow-warning/5"
              : isVerified
                ? "border-success/35 bg-success/[0.04]"
                : "border-border bg-background/80";

        return (
          <div
            key={id.key}
            className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all duration-200 min-w-0 ${cardStyle}`}
          >
            {/* Header: Label & Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-subtext flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                {t(`fields.${id.key}`)}
              </dt>
              {id.status && (
                <dd>
                  <StatusBadge t={t} status={id.status} ns="doc_status" />
                </dd>
              )}
            </div>

            {/* Value: Algerian Tax Monospace */}
            <dd className="font-mono text-sm sm:text-[15px] font-bold text-text tracking-wide select-all break-all" dir="ltr">
              {id.value ?? "—"}
            </dd>

            {/* Footer: Actions & Note */}
            {(id.actions || id.reason) && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40 mt-0.5">
                {id.actions && <dd className="flex justify-end">{id.actions}</dd>}
                {id.reason && (
                  <dd className="text-[11px] text-danger bg-danger-light/30 border border-danger/25 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <DashIcon name="warn" className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("note", { note: id.reason })}</span>
                  </dd>
                )}
              </div>
            )}
          </div>
        );
      })}
    </dl>
  );
}
