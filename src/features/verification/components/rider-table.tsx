"use client";

import Link from "next/link";
import { Badge, Button, DashIcon } from "@/components/ui";
import { formatDateTime } from "../queue";
import { riderDocLabel, riderUploadProgress, type RiderQueueItem } from "../partners";
import type { TFn } from "../types";

const VIEW_VARIANT = { pending: "warning", replacements: "info", rejected: "danger", waiting: "default" } as const;

export function RiderTable({
  t,
  locale,
  riders,
  onSelectRider,
}: {
  t: TFn;
  locale: string;
  riders: RiderQueueItem[];
  onSelectRider: (rider: RiderQueueItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border/70 text-subtext uppercase font-bold text-[11px] tracking-wider text-start">
              <th scope="col" className="py-3 px-4 text-start font-bold">Rider / Applicant</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden sm:table-cell">Vehicle</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden md:table-cell">Phone</th>
              <th scope="col" className="py-3 px-4 text-start font-bold">Status</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden lg:table-cell">Documents</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden xl:table-cell">Submitted</th>
              <th scope="col" className="py-3 px-4 text-end font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {riders.map((r) => {
              const name = r.name || t("unnamed");
              const vehicle = r.vehicle ? t(`partners.vehicle.${r.vehicle}`) : "—";
              const verifiedDocs = r.docs.filter((d) => d.status === "verified").length;
              const totalDocs = r.docs.length;
              const waiting = r.view === "waiting";
              const progress = riderUploadProgress(r.docs);
              const missing = progress.missing.map((k) => riderDocLabel(t, k)).join(", ");
              const hasUploads = r.docs.some((d) => d.status !== "missing");

              return (
                <tr
                  key={r.id}
                  onClick={waiting && !hasUploads ? undefined : () => onSelectRider(r)}
                  className={`hover:bg-card-hover/80 ${waiting && !hasUploads ? "" : "cursor-pointer"} transition-colors group`}
                >
                  <td className="py-3.5 px-4 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                        {(name || "RD").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-text group-hover:text-primary transition-colors block truncate">
                          {name}
                        </span>
                        <span className="text-[11px] text-subtext truncate block mt-0.5">
                          {r.riderId || "—"}
                        </span>
                        {waiting && missing && (
                          <span className="text-[11px] text-warning block mt-0.5 max-w-[260px]">
                            {t("partners.rider.missing", { docs: missing })}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <span className="font-medium text-text">{vehicle}</span>
                  </td>

                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <span className="font-mono text-subtext text-[11px]" dir="ltr">
                      {r.phone || "—"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={VIEW_VARIANT[r.view]}>{t(`partners.rider.filter.${r.view}`)}</Badge>
                  </td>

                  <td className="py-3.5 px-4 hidden lg:table-cell">
                    <span className="text-subtext font-medium text-[11px]">
                      {waiting
                        ? t("partners.rider.uploaded", { done: progress.done, total: progress.total })
                        : `${verifiedDocs}/${totalDocs} Verified`}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 hidden xl:table-cell text-subtext text-[11px] whitespace-nowrap">
                    {formatDateTime(r.submittedAt, locale)}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    {waiting ? (
                      <Link
                        href={`/riders/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>{t("partners.rider.open_page")}</span>
                        <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      className="group-hover:border-primary group-hover:text-primary transition-colors inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRider(r);
                      }}
                    >
                      <span>Inspect</span>
                      <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                    </Button>
                    )}
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
