"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, Badge, Modal, btnSecondary, type Variant } from "@/components/ui";
import { OpeningHours } from "@/features/verification";
import type { Agent, ShopReviewStatus } from "../types";

export const SHOP_REVIEW_VARIANT: Record<ShopReviewStatus, Variant> = {
  under_review: "warning",
  active: "success",
  rejected: "danger",
};

export function AgentDetailButton({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("agents");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--subtext)] hover:text-[var(--text)] transition-colors cursor-pointer"
        title={t("view")}
        aria-label={t("view")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <AgentDetailModal agent={agent} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <dt className="text-subtext shrink-0">{label}</dt>
      <dd className="font-medium text-text text-end break-words min-w-0">{children}</dd>
    </div>
  );
}

// Agent profile and each shop's details (contact, status, weekly hours), with a
// link to the agents verification queue.
export function AgentDetailModal({ agent, open, onClose }: { agent: Agent; open: boolean; onClose: () => void }) {
  const t = useTranslations("agents");
  const tv = useTranslations("verification");
  const locale = useLocale();
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ") || "—";
  const dash = "—";

  return (
    <Modal open={open} onClose={onClose} title={t("detail_title")} widthClassName="max-w-lg">
      <div className="max-h-[70vh] overflow-y-auto pe-1">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={name} />
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{name}</p>
            {agent.agent_id && <p className="font-mono text-xs text-primary">{agent.agent_id}</p>}
          </div>
        </div>

        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-subtext mb-1">{t("profile")}</h4>
        <dl className="divide-y divide-border mb-4">
          <Field label={t("phone")}>
            <span dir="ltr">{agent.phone_number ?? dash}</span>
          </Field>
          <Field label={t("email")}>{agent.email ?? dash}</Field>
          <Field label={t("gender")}>{agent.gender ?? dash}</Field>
          <Field label={t("wilaya")}>{agent.wilaya ?? dash}</Field>
          <Field label={t("joined")}>{agent.created_at ? new Date(agent.created_at).toLocaleDateString(locale) : dash}</Field>
        </dl>

        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-subtext mb-1">{t("shop_details")}</h4>
        {agent.shops.length === 0 ? (
          <p className="py-1.5 text-[13px] text-subtext mb-4">{t("no_shop")}</p>
        ) : (
          agent.shops.map((s) => (
            <div key={s.id} className="border border-border rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="font-semibold text-text text-[13px] truncate">{s.name || dash}</p>
                <Badge variant={SHOP_REVIEW_VARIANT[s.review]}>{t(`shop_review.${s.review}`)}</Badge>
              </div>
              <dl className="divide-y divide-border">
                <Field label={t("shop_phone")}>
                  <span dir="ltr">{s.phone ?? dash}</span>
                </Field>
                <Field label={t("address")}>{s.address ?? dash}</Field>
                <Field label={t("shop_status")}>
                  <Badge variant={s.open ? "success" : "default"}>{s.open ? t("open") : t("closed")}</Badge>
                </Field>
                {s.openTime && s.closeTime && (
                  <Field label={t("default_hours")}>
                    <span dir="ltr">{`${s.openTime} - ${s.closeTime}`}</span>
                  </Field>
                )}
                {s.rating !== null && <Field label={t("rating")}>{s.rating.toFixed(1)}</Field>}
                {s.description && <Field label={t("description_label")}>{s.description}</Field>}
                {s.hours && (
                  <div className="py-1.5 text-[13px]">
                    <p className="text-subtext mb-1">{t("hours")}</p>
                    <OpeningHours t={tv} hours={s.hours} />
                  </div>
                )}
              </dl>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center gap-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
        >
          {t("close")}
        </button>
        <Link href="/agents/verification" className={btnSecondary}>
          {t("review")}
        </Link>
      </div>
    </Modal>
  );
}
