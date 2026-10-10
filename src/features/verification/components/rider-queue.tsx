"use client";

import { useState } from "react";
import { Badge, DashIcon, EmptyState, FilterPills } from "@/components/ui";
import { reviewRiderDocument } from "@/app/d/verification/partner-action";
import { formatDateTime } from "../queue";
import {
  RIDER_NOTE_MAX,
  RIDER_VIEWS,
  ridersInView,
  riderDocLabel,
  type RiderQueueItem,
  type RiderQueueLoad,
  type RiderView,
} from "../partners";
import type { ReviewOutcome, TFn } from "../types";
import { ApplicantCard } from "./applicant-card";
import { DetailField } from "./detail-field";
import { DocumentTile } from "./document-tile";
import { PartnerDocActions } from "./partner-doc-actions";
import { PartnerNotice, type PartnerNoticeValue } from "./partner-notice";

const VIEW_VARIANT = { pending: "warning", replacements: "info", rejected: "danger" } as const;

// Riders: applications waiting on staff (all four documents in), approved riders
// with a replacement document to check, and rejected ones waiting on the rider.
// Each of the four documents (licence and ID, front and back) is verified or
// rejected on its own, on the stored path the reviewer saw — if the rider
// replaced it meanwhile blink-server refuses (409) and the list refreshes.
// Previews are short-lived signed links from the private rider-documents bucket.
export function RiderQueue({
  t,
  locale,
  load,
}: {
  t: TFn;
  locale: string;
  load: RiderQueueLoad;
}) {
  const [view, setView] = useState<RiderView>("pending");
  const [notice, setNotice] = useState<PartnerNoticeValue | null>(null);
  const shown = ridersInView(load.items, view);
  const options: [RiderView, string][] = RIDER_VIEWS.map((v) => [
    v,
    t("partners.filter_count", { label: t(`partners.rider.filter.${v}`), n: load.counts[v] }),
  ]);

  return (
    <>
      <FilterPills
        options={options}
        value={view}
        onChange={(v) => {
          setView(v);
          setNotice(null);
        }}
      />
      <p className="text-xs text-subtext -mt-2.5 mb-4">{t(`partners.rider.hint.${view}`)}</p>
      <PartnerNotice t={t} notice={notice} onDismiss={() => setNotice(null)} />
      {shown.length < load.counts[view] && (
        <p className="text-xs text-subtext mb-3">
          {t("partners.showing", { shown: shown.length, total: load.counts[view] })}
        </p>
      )}
      {shown.length === 0 ? (
        <EmptyState
          icon={<DashIcon name="shield" className="w-10 h-10" />}
          title={t(`partners.rider.empty.${view}`)}
          description={t(`partners.rider.empty.${view}_desc`)}
        />
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <RiderCard key={r.id} t={t} locale={locale} rider={r} onNotice={setNotice} />
          ))}
        </div>
      )}
    </>
  );
}

function RiderCard({
  t,
  locale,
  rider: r,
  onNotice,
}: {
  t: TFn;
  locale: string;
  rider: RiderQueueItem;
  onNotice: (n: PartnerNoticeValue) => void;
}) {
  const name = r.name || t("unnamed");
  const vehicle = r.vehicle ? t(`partners.vehicle.${r.vehicle}`) : null;

  function handle(label: string, verdict: "verified" | "rejected", outcome: ReviewOutcome) {
    if (outcome.ok) {
      onNotice({ tone: "success", text: t(`partners.done.rider_${verdict}`, { doc: label, name }) });
    } else {
      onNotice({ tone: "danger", text: outcome.message });
    }
  }

  return (
    <ApplicantCard
      t={t}
      locale={locale}
      name={name}
      meta={[r.riderId, vehicle].filter(Boolean).join(" · ")}
      badge={<Badge variant={VIEW_VARIANT[r.view]}>{t(`partners.rider.filter.${r.view}`)}</Badge>}
      submittedAt={r.submittedAt}
      updatedAt={r.updatedAt}
    >
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mb-4">
        <DetailField label={t("partners.fields.phone")}>
          {r.phone ? <span dir="ltr">{r.phone}</span> : "—"}
        </DetailField>
        <DetailField label={t("partners.fields.vehicle")}>{vehicle ?? "—"}</DetailField>
      </dl>
      <p className="text-[11px] font-bold uppercase text-subtext mb-2.5">{t("partners.rider.documents")}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {r.docs.map((d) => {
          const label = riderDocLabel(t, d.key);
          if (!d.required && d.status === "missing") {
            return (
              <div key={d.key} className="min-w-0 flex flex-col gap-1">
                <p className="text-[11px] font-bold uppercase text-subtext">{label}</p>
                <div className="rounded-lg border border-dashed border-border p-3 text-[12px] text-subtext">
                  {t("partners.not_required_bicycle")}
                </div>
              </div>
            );
          }
          return (
            <div key={d.key} className="min-w-0 flex flex-col gap-1">
              <DocumentTile
                t={t}
                label={label}
                url={d.url}
                trusted={d.trusted}
                isPdf={d.isPdf}
                status={d.status}
                note={d.note}
                actions={
                  d.path ? (
                    <PartnerDocActions
                      t={t}
                      label={label}
                      status={d.status}
                      untrusted={!d.trusted}
                      noteVariant="reject_rider_doc"
                      noteMax={RIDER_NOTE_MAX}
                      submit={(verdict, note) =>
                        reviewRiderDocument({ riderId: r.id, document: d.key, path: d.path as string }, verdict, note)
                      }
                      onOutcome={(verdict, outcome) => handle(label, verdict, outcome)}
                    />
                  ) : undefined
                }
              />
              {d.uploadedAt && (
                <span className="text-[11px] text-subtext" suppressHydrationWarning>
                  {t("partners.uploaded_at", { date: formatDateTime(d.uploadedAt, locale) })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ApplicantCard>
  );
}
