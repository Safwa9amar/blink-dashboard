/* eslint-disable @next/next/no-img-element */
import { Badge, DashIcon } from "@/components/ui";
import { categoryLabel, fileLabel, formatList, listSeparator, requiredDocLabel, STORE_FILTER_VARIANT } from "../queue";
import type {
  DocumentVerdict,
  ReviewDecision,
  ReviewOutcome,
  StoreDocKey,
  StoreFilter,
  StoreQueueItem,
  TFn,
} from "../types";
import { ApplicantCard } from "./applicant-card";
import { BusinessIds } from "./business-ids";
import { DetailField } from "./detail-field";
import { DocumentReviewActions } from "./document-review-actions";
import { DocumentSummary } from "./document-summary";
import { DocumentTile } from "./document-tile";
import { OpeningHours } from "./opening-hours";
import { ReviewButtons } from "./review-buttons";

const DECISIONS: Record<StoreFilter, readonly ReviewDecision[]> = {
  pending: ["approve", "reject"],
  rejected: ["approve"],
  live: ["deactivate"],
};

const tileGrid = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3";

// Merchant store verification designed as a 4-Stage Compliance Trust Journey:
// Stage 1: Merchant & Ownership Credential
// Stage 2: Official Fiscal Identifiers (NIF & NIS)
// Stage 3: Physical Operations & Storefront
// Stage 4: Registre du Commerce (RC) & Official Scans
export function StoreCard({
  t,
  locale,
  store: s,
  onOutcome,
  onDocumentOutcome,
}: {
  t: TFn;
  locale: string;
  store: StoreQueueItem;
  onOutcome?: (decision: ReviewDecision, outcome: ReviewOutcome) => void;
  onDocumentOutcome?: (doc: StoreDocKey, verdict: DocumentVerdict, outcome: ReviewOutcome) => void;
}) {
  const name = s.name || t("unnamed");
  const categories = s.categories.map((slug) => categoryLabel(t, slug)).join(listSeparator(locale));
  const docList = (keys: StoreDocKey[]) =>
    formatList(
      keys.map((k) => requiredDocLabel(t, k)),
      locale
    );
  const missing = docList(s.missing);
  const rejectedDocs = [...s.documents, ...s.businessIds].filter((d) => d.status === "rejected").map((d) => d.key);
  const decisions = s.ownerDeletion ? DECISIONS[s.filter].filter((d) => d !== "approve") : DECISIONS[s.filter];

  const approveConfirm = [
    s.degraded ? t("approve.degraded") : s.missing.length > 0 ? t("approve.missing", { list: missing }) : null,
    s.degraded
      ? t("approve.verifies_all")
      : s.docSummary.pending + s.docSummary.rejected > 0
        ? t("approve.verifies_shown")
        : null,
    rejectedDocs.length > 0 ? t("approve.overrides_rejected", { list: docList(rejectedDocs) }) : null,
  ].filter((line): line is string => !!line);
  const approveLabel =
    s.degraded || s.missing.length > 0 || rejectedDocs.length > 0 ? t("approve.confirm") : t("actions.approve");

  const reviewActions = (doc: (typeof s.documents)[number] | (typeof s.businessIds)[number], label: string) => (
    <DocumentReviewActions
      t={t}
      storeId={s.id}
      label={label}
      doc={doc}
      untrusted={"trusted" in doc && !!doc.url && !doc.trusted}
      onOutcome={(verdict, outcome) => onDocumentOutcome?.(doc.key, verdict, outcome)}
    />
  );

  return (
    <ApplicantCard
      t={t}
      locale={locale}
      name={name}
      avatar={
        s.logo ? (
          <img
            src={s.logo}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : undefined
      }
      meta={[categories, s.location].filter(Boolean).join(" · ")}
      badge={
        <>
          <Badge variant={STORE_FILTER_VARIANT[s.filter]}>{t(`stores.status.${s.filter}`)}</Badge>
          {s.resubmitted && <Badge variant="info">{t("stores.resubmitted")}</Badge>}
          {s.ownerDeletion && <Badge variant="danger">{t(`stores.owner_deletion.${s.ownerDeletion}`)}</Badge>}
          {s.filter === "live" && s.docSummary.pending > 0 && (
            <Badge variant="warning">{t("stores.badge_documents")}</Badge>
          )}
        </>
      }
      submittedAt={s.submittedAt}
      updatedAt={s.updatedAt}
      actions={
        decisions.length > 0 && (
          <ReviewButtons
            t={t}
            subject={name}
            target={{ kind: "merchant_store", storeId: s.id, expectedUpdatedAt: s.updatedAt }}
            decisions={decisions}
            approveConfirm={approveConfirm}
            approveLabel={approveLabel}
            onOutcome={onOutcome}
          />
        )
      }
    >
      {/* Top Alert Banners */}
      {s.ownerDeletion && (
        <div className="rounded-xl p-3 mb-3 text-sm bg-danger-light/40 border border-danger/30 text-danger font-semibold flex items-center gap-2">
          <DashIcon name="warn" className="w-4 h-4 shrink-0" />
          <span>{t(`stores.owner_deletion_hint.${s.ownerDeletion}`)}</span>
        </div>
      )}

      {s.degraded && (
        <div className="rounded-xl p-3 mb-3 text-sm bg-warning-light/40 border border-warning/30 text-text flex items-center gap-2">
          <DashIcon name="warn" className="w-4 h-4 shrink-0 text-warning" />
          <div>
            <span className="font-semibold text-warning">{t("stores.degraded_title")}</span> {t("stores.degraded")}
          </div>
        </div>
      )}

      {s.reviewNote && (
        <div
          className={`rounded-xl p-3 mb-3 text-sm border ${
            s.filter === "pending"
              ? "bg-warning-light/30 border-warning/30 text-text"
              : "bg-danger-light/30 border-danger/30 text-text"
          }`}
        >
          <p className={`text-xs font-bold mb-0.5 ${s.filter === "pending" ? "text-warning" : "text-danger"}`}>
            {s.filter === "pending" ? t("stores.previous_note") : t("stores.review_note")}
          </p>
          <p className="whitespace-pre-line break-words text-xs">{s.reviewNote}</p>
        </div>
      )}

      {/* Compliance Audit Progress Bar */}
      <DocumentSummary t={t} summary={s.docSummary} />

      {s.degraded ? (
        <div className="rounded-xl border border-border p-4 bg-background">
          <DetailField label={t("stores.owner")}>
            <span className="block">{s.ownerName || t("unnamed")}</span>
            {s.ownerPhone && (
              <span className="block text-subtext" dir="ltr">
                {s.ownerPhone}
              </span>
            )}
          </DetailField>
        </div>
      ) : (
        /* ========================================================
           4-STAGE COMPLIANCE TRUST JOURNEY
           ======================================================== */
        <div className="relative pl-7 sm:pl-9 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-success before:via-warning before:to-danger/60 space-y-6 mt-4">

          {/* STAGE 1: Merchant & Ownership Credential */}
          <div className="relative">
            <div
              className={`absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-card ${
                s.ownerDeletion ? "bg-danger text-white" : "bg-success text-white"
              }`}
            >
              {s.ownerDeletion ? "✕" : "✓"}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <span>{t("stores.stages.stage1_title")}</span>
                </h4>
                <p className="text-[11px] text-subtext">{t("stores.stages.stage1_desc")}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  s.ownerDeletion
                    ? "bg-danger-light/40 text-danger border border-danger/30"
                    : "bg-success-light/40 text-success border border-success/30"
                }`}
              >
                {s.ownerDeletion ? t(`stores.owner_deletion.${s.ownerDeletion}`) : t("stores.stages.passed")}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 p-3.5 sm:p-4 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-subtext font-medium">{t("stores.owner")}</span>
                <span className="font-semibold text-text text-[13px]">{s.ownerName || t("unnamed")}</span>
                {s.ownerPhone && (
                  <span className="text-subtext font-mono" dir="ltr">
                    {s.ownerPhone}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <span className="text-subtext font-medium">{t("stores.contact")}</span>
                {s.phone || s.whatsapp || s.email ? (
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {s.phone && (
                      <a
                        href={`tel:${s.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-text font-medium text-xs hover:bg-muted/80 transition-colors"
                        dir="ltr"
                      >
                        📞 {s.phone}
                      </a>
                    )}
                    {s.whatsapp && (
                      <a
                        href={`https://wa.me/${s.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-light/30 text-success font-medium text-xs hover:bg-success-light/50 transition-colors"
                        dir="ltr"
                      >
                        💬 {s.whatsapp}
                      </a>
                    )}
                    {s.email && (
                      <a
                        href={`mailto:${s.email}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-info-light/30 text-info font-medium text-xs hover:bg-info-light/50 transition-colors"
                        dir="ltr"
                      >
                        ✉️ {s.email}
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-subtext">—</span>
                )}
              </div>
            </div>
          </div>

          {/* STAGE 2: Official Fiscal Identifiers (NIF & NIS) */}
          <div className="relative">
            <div
              className={`absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-card ${
                rejectedDocs.length > 0
                  ? "bg-danger text-white"
                  : s.businessIds.some((b) => b.status === "pending")
                    ? "bg-warning text-black"
                    : "bg-success text-white"
              }`}
            >
              {rejectedDocs.length > 0 ? "✕" : s.businessIds.some((b) => b.status === "pending") ? "⚡" : "✓"}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <span>{t("stores.stages.stage2_title")}</span>
                </h4>
                <p className="text-[11px] text-subtext">{t("stores.stages.stage2_desc")}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  s.businessIds.some((b) => b.status === "pending")
                    ? "bg-warning-light/40 text-warning border border-warning/30"
                    : "bg-success-light/40 text-success border border-success/30"
                }`}
              >
                {s.businessIds.some((b) => b.status === "pending")
                  ? t("stores.stages.action_needed")
                  : t("stores.stages.passed")}
              </span>
            </div>

            <BusinessIds
              t={t}
              ids={s.businessIds.map((d) => ({
                key: d.key,
                value: d.value,
                status: d.status,
                reason: d.reason,
                actions: reviewActions(d, requiredDocLabel(t, d.key)),
              }))}
            />
          </div>

          {/* STAGE 3: Physical Operations & Storefront */}
          <div className="relative">
            <div className="absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold ring-4 ring-card shadow-sm">
              ✓
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <span>{t("stores.stages.stage3_title")}</span>
                </h4>
                <p className="text-[11px] text-subtext">{t("stores.stages.stage3_desc")}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success-light/40 text-success border border-success/30">
                {t("stores.stages.passed")}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 p-3.5 sm:p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailField label={t("stores.address")}>
                {s.address && <span className="block font-medium">{s.address}</span>}
                {s.location && <span className="block text-subtext">{s.location}</span>}
                {!s.address && !s.location && <span className="text-subtext">—</span>}
                {s.mapUrl && (
                  <a
                    href={s.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{t("stores.open_map")}</span>
                    <span>↗</span>
                  </a>
                )}
              </DetailField>

              <DetailField label={t("stores.hours")}>
                <OpeningHours t={t} hours={s.hours} />
              </DetailField>

              <DetailField label={t("stores.category")}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{categories || <span className="text-subtext">—</span>}</span>
                  <span className="text-xs text-subtext">
                    {t("stores.product_count", { n: s.productCount })}
                  </span>
                </div>
              </DetailField>

              {s.description && (
                <DetailField label={t("stores.description")} className="sm:col-span-2 xl:col-span-3">
                  <p className="text-xs text-subtext italic bg-muted/40 rounded-lg p-2.5 border border-border/40 whitespace-pre-line">
                    "{s.description}"
                  </p>
                </DetailField>
              )}
            </div>
          </div>

          {/* STAGE 4: Registre du Commerce (RC) & Official Scans */}
          <div className="relative">
            <div
              className={`absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-card ${
                s.missing.length > 0
                  ? "bg-danger text-white"
                  : s.docSummary.pending > 0
                    ? "bg-warning text-black"
                    : "bg-success text-white"
              }`}
            >
              {s.missing.length > 0 ? "✕" : s.docSummary.pending > 0 ? "⚡" : "✓"}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <span>{t("stores.stages.stage4_title")}</span>
                </h4>
                <p className="text-[11px] text-subtext">{t("stores.stages.stage4_desc")}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  s.missing.length > 0
                    ? "bg-danger-light/40 text-danger border border-danger/30"
                    : s.docSummary.pending > 0
                      ? "bg-warning-light/40 text-warning border border-warning/30"
                      : "bg-success-light/40 text-success border border-success/30"
                }`}
              >
                {s.missing.length > 0
                  ? t("stores.stages.missing_alert")
                  : s.docSummary.pending > 0
                    ? t("stores.stages.action_needed")
                    : t("stores.stages.passed")}
              </span>
            </div>

            {s.missing.length > 0 && (
              <div className="rounded-xl p-3 mb-3 text-xs bg-danger-light/40 border border-danger/30 text-danger font-semibold flex items-center gap-2">
                <DashIcon name="warn" className="w-4 h-4 shrink-0" />
                <span>{t("stores.missing", { list: missing })}</span>
              </div>
            )}

            <div className={`${tileGrid} mb-4`}>
              {s.documents.map((d) => {
                const label = requiredDocLabel(t, d.key);
                return (
                  <DocumentTile
                    key={d.key}
                    t={t}
                    label={label}
                    url={d.url}
                    trusted={d.trusted}
                    isPdf={d.isPdf}
                    status={d.status}
                    statusNs="doc_status"
                    note={d.reason}
                    actions={reviewActions(d, label)}
                  />
                );
              })}
              {s.files.map((f) => (
                <DocumentTile key={f.key} t={t} label={fileLabel(t, f)} url={f.url} trusted={f.trusted} isPdf={f.isPdf} />
              ))}
            </div>

            {s.media.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/40">
                <h5 className="text-[11px] font-bold uppercase text-subtext mb-2.5 flex items-center gap-2">
                  <span>{t("stores.photos")}</span>
                  <span className="text-[10px] text-subtext/80 font-normal">({s.media.length})</span>
                </h5>
                <div className={tileGrid}>
                  {s.media.map((f) => (
                    <DocumentTile
                      key={f.key}
                      t={t}
                      label={fileLabel(t, f)}
                      url={f.url}
                      trusted={f.trusted}
                      isPdf={f.isPdf}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ApplicantCard>
  );
}
