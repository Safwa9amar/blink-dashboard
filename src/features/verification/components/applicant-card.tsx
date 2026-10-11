import type { ReactNode } from "react";
import { NameCell } from "@/components/ui";
import { formatDateTime } from "../queue";
import type { TFn } from "../types";

// One applicant in a queue: store identity, timestamps, badges,
// and decision controls in a sleek modern container.
export function ApplicantCard({
  t,
  locale,
  name,
  avatar,
  meta,
  badge,
  submittedAt,
  updatedAt,
  actions,
  children,
}: {
  t: TFn;
  /** UI language for the dates (shown on Algiers' clock). */
  locale?: string;
  name: string;
  avatar?: ReactNode;
  meta?: string;
  badge?: ReactNode;
  submittedAt: string;
  updatedAt?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const submitted = formatDateTime(submittedAt, locale);
  const updated = updatedAt ? formatDateTime(updatedAt, locale) : null;

  return (
    <section className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-border transition-colors">
      <header className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-5 border-b border-border/50">
        <div className="min-w-0">
          {avatar ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-border shadow-sm flex items-center justify-center shrink-0 bg-muted">
                {avatar}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base sm:text-lg text-text truncate block tracking-tight">
                  {name}
                </span>
                {meta && <p className="text-xs text-subtext mt-0.5">{meta}</p>}
              </div>
            </div>
          ) : (
            <>
              <NameCell name={name} />
              {meta && <p className="text-xs text-subtext mt-1">{meta}</p>}
            </>
          )}

          {/* Timestamp formatting */}
          <p className="text-[11px] text-subtext/90 mt-1.5" suppressHydrationWarning>
            {t("submitted_at", { date: submitted })}
            {updated && updated !== submitted && <> · {t("updated_at", { date: updated })}</>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {badge && <div className="flex flex-wrap items-center gap-1.5">{badge}</div>}
          {actions}
        </div>
      </header>

      {children}
    </section>
  );
}
