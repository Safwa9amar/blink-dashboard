"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, DashIcon, EmptyState, FilterPills } from "@/components/ui";
import { reviewRiderDocument } from "@/app/d/verification/partner-action";
import {
  RIDER_DOC_GROUPS,
  RIDER_NOTE_MAX,
  RIDER_VIEWS,
  ridersInView,
  riderDocLabel,
  riderUploadProgress,
  type RiderDocSlot,
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
import { RiderTable } from "./rider-table";

const VIEW_VARIANT = { pending: "warning", replacements: "info", rejected: "danger", waiting: "default" } as const;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [notice, setNotice] = useState<PartnerNoticeValue | null>(null);

  const shown = ridersInView(load.items, view);
  const selectedRider = selectedId ? load.items.find((r) => r.id === selectedId) : null;
  const currentIndex = selectedRider ? shown.findIndex((r) => r.id === selectedRider.id) : -1;

  const options: [RiderView, string][] = RIDER_VIEWS.map((v) => [
    v,
    t("partners.filter_count", { label: t(`partners.rider.filter.${v}`), n: load.counts[v] }),
  ]);

  function changeView(v: RiderView) {
    setView(v);
    setSelectedId(null);
    setNotice(null);
  }

  return (
    <>
      <PartnerNotice t={t} notice={notice} onDismiss={() => setNotice(null)} />

      {selectedRider ? (
        <div>
          {/* Top Back & Stepper Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5"
              >
                <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                <span>{t("stores.table.back_to_riders")}</span>
              </Button>
              <span className="text-xs text-subtext/60 hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-text truncate max-w-[200px] sm:max-w-xs">
                {selectedRider.name || t("unnamed")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {currentIndex >= 0 && (
                <span className="text-xs text-subtext font-medium">
                  {t("stores.table.rider_counter", { current: currentIndex + 1, total: shown.length })}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex <= 0}
                  onClick={() => currentIndex > 0 && setSelectedId(shown[currentIndex - 1].id)}
                  aria-label="Previous rider"
                  className="px-2"
                >
                  <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex < 0 || currentIndex >= shown.length - 1}
                  onClick={() => currentIndex < shown.length - 1 && setSelectedId(shown[currentIndex + 1].id)}
                  aria-label="Next rider"
                  className="px-2"
                >
                  <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <RiderCard t={t} locale={locale} rider={selectedRider} onNotice={setNotice} />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <FilterPills options={options} value={view} onChange={changeView} />

            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>☷</span>
                <span>{t("stores.table.view_table")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>⊞</span>
                <span>{t("stores.table.view_cards")}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-subtext -mt-2.5 mb-4">{t(`partners.rider.hint.${view}`)}</p>

          {shown.length === 0 ? (
            <EmptyState
              icon={<DashIcon name="shield" className="w-10 h-10" />}
              title={t(`partners.rider.empty.${view}`)}
              description={t(`partners.rider.empty.${view}_desc`)}
            />
          ) : viewMode === "table" ? (
            <RiderTable
              t={t}
              locale={locale}
              riders={shown}
              onSelectRider={(r) => setSelectedId(r.id)}
            />
          ) : (
            <div className="space-y-4">
              {shown.map((r) => (
                <RiderCard key={r.id} t={t} locale={locale} rider={r} onNotice={setNotice} />
              ))}
            </div>
          )}
        </>
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
  const progress = riderUploadProgress(r.docs);
  const waiting = r.view === "waiting";

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
        {waiting && (
          <DetailField label={t("partners.rider.documents")}>
            {t("partners.rider.uploaded", { done: progress.done, total: progress.total })}
          </DetailField>
        )}
        <DetailField label={t("partners.fields.profile")}>
          <Link href={`/riders/${r.id}`} className="font-semibold text-primary hover:underline">
            {t("partners.rider.open_page")}
          </Link>
        </DetailField>
      </dl>
      {waiting && progress.missing.length > 0 && (
        <p className="text-xs text-warning mb-3">
          {t("partners.rider.missing", { docs: progress.missing.map((k) => riderDocLabel(t, k)).join(", ") })}
        </p>
      )}
      {waiting && !r.docs.some((d) => d.status !== "missing") ? (
        <p className="text-xs text-subtext">{t("partners.rider.nothing_to_review")}</p>
      ) : (
      <>
      <p className="text-[11px] font-bold uppercase text-subtext mb-2.5">{t("partners.rider.documents")}</p>
      <div className="space-y-4">
        {RIDER_DOC_GROUPS.map((group) => {
          // A group shows when a document in it is required or has been uploaded.
          // A waiting rider's missing documents are listed above, so only uploads get tiles.
          const docs = r.docs.filter(
            (d) => d.group === group && (waiting ? d.status !== "missing" : d.required || d.status !== "missing")
          );
          if (docs.length === 0) return null;
          return (
            <section key={group}>
              <h4 className="text-xs font-semibold text-text mb-2">{t(`partners.rider.group.${group}`)}</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                {docs.map((d: RiderDocSlot) => {
                  const label = riderDocLabel(t, d.key);
                  return (
                    <DocumentTile
                      key={d.key}
                      t={t}
                      label={label}
                      url={d.url}
                      trusted={d.trusted}
                      isPdf={d.isPdf}
                      status={d.status}
                      note={d.note}
                      actions={
                        <PartnerDocActions
                          t={t}
                          label={label}
                          status={d.status}
                          untrusted={!!d.url && !d.trusted}
                          noteVariant="reject_rider_doc"
                          noteMax={RIDER_NOTE_MAX}
                          submit={(verdict, reason) =>
                            reviewRiderDocument({ riderId: r.id, document: d.key, path: d.path ?? "" }, verdict, reason)
                          }
                          onOutcome={(verdict, outcome) => handle(label, verdict, outcome)}
                        />
                      }
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      </>
      )}
    </ApplicantCard>
  );
}
