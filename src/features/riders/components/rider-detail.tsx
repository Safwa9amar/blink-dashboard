"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, Badge, Modal, btnSecondary, type Variant } from "@/components/ui";
import type { RiderRow, RiderVerification, VehicleDocState } from "../types";

export const VERIFICATION_VARIANT: Record<RiderVerification, Variant> = {
  not_submitted: "default",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const DOC_VARIANT: Record<VehicleDocState, Variant> = {
  approved: "success",
  needs_update: "danger",
  pending: "warning",
  not_uploaded: "default",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <dt className="text-subtext shrink-0">{label}</dt>
      <dd className="font-medium text-text text-end break-words min-w-0">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-subtext mb-1">{title}</h4>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

// Profile, vehicle specs and the vehicle documents a motorcycle needs (gray card,
// insurance). The driving licence is a rider document, reviewed in rider verification.
export function RiderDetail({ rider, onClose }: { rider: RiderRow | null; onClose: () => void }) {
  const t = useTranslations("riders");
  const locale = useLocale();
  if (!rider) return null;
  const v = rider.vehicle;
  const dash = "—";

  return (
    <Modal open onClose={onClose} title={t("detail.title")} widthClassName="max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={rider.name || rider.riderId} />
        <div className="min-w-0">
          <p className="font-semibold text-text truncate">{rider.name || t("unnamed")}</p>
          <p className="font-mono text-xs text-primary">{rider.riderId}</p>
        </div>
        <Badge variant={VERIFICATION_VARIANT[rider.verification]} className="ms-auto">
          {t(`verification.${rider.verification}`)}
        </Badge>
      </div>

      <Section title={t("detail.profile")}>
        <Field label={t("phone")}>
          <span dir="ltr">{rider.phone ?? dash}</span>
        </Field>
        <Field label={t("wilaya")}>{rider.wilaya ?? dash}</Field>
        <Field label={t("available")}>{rider.available ? t("yes") : t("no")}</Field>
        <Field label={t("joined")}>{rider.joinedAt ? new Date(rider.joinedAt).toLocaleDateString(locale) : dash}</Field>
      </Section>

      <Section title={t("detail.vehicle")}>
        <Field label={t("detail.type")}>{rider.vehicleType ? t(`types.${rider.vehicleType}`) : dash}</Field>
        {v ? (
          <>
            <Field label={t("detail.brand")}>{v.brand || dash}</Field>
            <Field label={t("detail.model")}>{v.model || dash}</Field>
            {rider.vehicleType !== "bicycle" && (
              <Field label={t("detail.plate")}>
                <span dir="ltr">{v.plate || dash}</span>
              </Field>
            )}
            <Field label={t("detail.year")}>{v.year || dash}</Field>
            <Field label={t("detail.color")}>{v.color || dash}</Field>
            <Field label={t("detail.category")}>{v.category ? t(`categories.${v.category}` as "categories.standard") : dash}</Field>
          </>
        ) : (
          <Field label={t("detail.vehicle")}>{t("detail.no_vehicle")}</Field>
        )}
      </Section>

      <Section title={t("detail.documents")}>
        {rider.vehicleType === "bicycle" ? (
          <p className="py-1.5 text-[13px] text-subtext">{t("detail.no_documents")}</p>
        ) : (
          <>
            <Field label={t("detail.gray_card")}>
              <Badge variant={DOC_VARIANT[v?.grayCard ?? "not_uploaded"]}>{t(`doc.${v?.grayCard ?? "not_uploaded"}`)}</Badge>
            </Field>
            <Field label={t("detail.insurance")}>
              <Badge variant={DOC_VARIANT[v?.insurance ?? "not_uploaded"]}>{t(`doc.${v?.insurance ?? "not_uploaded"}`)}</Badge>
            </Field>
          </>
        )}
      </Section>
      <p className="text-xs text-subtext mb-4">{t("detail.licence_note")}</p>

      <div className="flex justify-end">
        <Link href="/riders/verification" className={btnSecondary}>
          {t("detail.review")}
        </Link>
      </div>
    </Modal>
  );
}
