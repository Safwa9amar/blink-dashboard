"use client";

/* eslint-disable @next/next/no-img-element */
import { Badge, Button, DashIcon } from "@/components/ui";
import { categoryLabel, formatDateTime, listSeparator, STORE_FILTER_VARIANT } from "../queue";
import type { StoreQueueItem, TFn } from "../types";

// Master Verification Table: scannable row listing for merchant stores.
// Clicking any row opens the detailed Compliance Trust Journey verification page.
export function StoreTable({
  t,
  locale,
  stores,
  onSelectStore,
}: {
  t: TFn;
  locale: string;
  stores: StoreQueueItem[];
  onSelectStore: (store: StoreQueueItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border/70 text-subtext uppercase font-bold text-[11px] tracking-wider text-start">
              <th scope="col" className="py-3 px-4 text-start font-bold">{t("stores.table.col_store")}</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden md:table-cell">{t("stores.table.col_owner")}</th>
              <th scope="col" className="py-3 px-4 text-start font-bold">{t("stores.table.col_status")}</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden sm:table-cell">{t("stores.table.col_compliance")}</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden lg:table-cell">{t("stores.table.col_date")}</th>
              <th scope="col" className="py-3 px-4 text-end font-bold">{t("stores.table.col_action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {stores.map((s) => {
              const categories = s.categories.map((slug) => categoryLabel(t, slug)).join(listSeparator(locale));
              const verifiedPct = s.docSummary.total > 0 ? (s.docSummary.verified / s.docSummary.total) * 100 : 0;
              const pendingPct = s.docSummary.total > 0 ? (s.docSummary.pending / s.docSummary.total) * 100 : 0;
              const rejectedPct = s.docSummary.total > 0 ? (s.docSummary.rejected / s.docSummary.total) * 100 : 0;

              return (
                <tr
                  key={s.id}
                  onClick={() => onSelectStore(s)}
                  className="hover:bg-card-hover/80 cursor-pointer transition-colors group"
                >
                  {/* Store Name & Avatar */}
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-border/80 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                          {(s.name || "BM").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-text group-hover:text-primary transition-colors block truncate">
                          {s.name || t("unnamed")}
                        </span>
                        <span className="text-[11px] text-subtext truncate block mt-0.5">
                          {[categories, s.location].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Owner & Phone */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <span className="font-medium text-text block truncate">{s.ownerName || t("unnamed")}</span>
                    {(s.ownerPhone || s.phone) && (
                      <span className="text-subtext font-mono text-[11px] block mt-0.5" dir="ltr">
                        {s.ownerPhone || s.phone}
                      </span>
                    )}
                  </td>

                  {/* Status Badges */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={STORE_FILTER_VARIANT[s.filter]}>{t(`stores.status.${s.filter}`)}</Badge>
                      {s.resubmitted && <Badge variant="info">{t("stores.resubmitted")}</Badge>}
                      {s.ownerDeletion && <Badge variant="danger">{t(`stores.owner_deletion.${s.ownerDeletion}`)}</Badge>}
                      {s.filter === "live" && s.docSummary.pending > 0 && (
                        <Badge variant="warning">{t("stores.badge_documents")}</Badge>
                      )}
                    </div>
                  </td>

                  {/* Compliance Progress */}
                  <td className="py-3.5 px-4 hidden sm:table-cell min-w-[150px]">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden flex border border-border/40 mb-1">
                      {verifiedPct > 0 && <div style={{ width: `${verifiedPct}%` }} className="h-full bg-success" />}
                      {pendingPct > 0 && <div style={{ width: `${pendingPct}%` }} className="h-full bg-warning" />}
                      {rejectedPct > 0 && <div style={{ width: `${rejectedPct}%` }} className="h-full bg-danger" />}
                    </div>
                    <div className="text-[11px] text-subtext flex items-center gap-1">
                      <span>{s.docSummary.verified}/{s.docSummary.total} {t("stores.stages.passed")}</span>
                      {s.docSummary.pending > 0 && (
                        <span className="text-warning font-semibold">· {s.docSummary.pending} ⚡</span>
                      )}
                      {s.missing.length > 0 && (
                        <span className="text-danger font-semibold">· {s.missing.length} ⚠️</span>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-subtext whitespace-nowrap text-[11px]">
                    {formatDateTime(s.updatedAt || s.submittedAt, locale)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-end">
                    <Button
                      size="xs"
                      variant="outline"
                      className="group-hover:border-primary group-hover:text-primary transition-colors inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStore(s);
                      }}
                    >
                      <span>{t("stores.table.inspect")}</span>
                      <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
