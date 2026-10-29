"use client";

import { useTranslations } from "next-intl";
import { variesBy } from "../help";
import type { Fee } from "../types";
import { FeeExampleLine } from "./fee-example";
import { InfoPopover } from "./popover";

/** Locale keys that exist for a fee; `who_pays`, `who_earns` and `caution` are only written where they make sense. */
function useAbout(fee: Pick<Fee, "key" | "scopes" | "fields">) {
  const t = useTranslations("pricing");
  const has = (k: string) => t.has(`fees.${fee.key}.${k}` as never);
  const get = (k: string) => (has(k) ? t(`fees.${fee.key}.${k}` as never) : null);
  const varies = variesBy(fee).map((v) => t(`varies.${v}` as never));
  return {
    t,
    what: get("what"),
    whoPays: get("who_pays"),
    whoEarns: get("who_earns"),
    appliesTo: get("applies_to"),
    example: get("example"),
    caution: get("caution"),
    varies,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-3 gap-y-0.5 py-2 first:pt-0 last:pb-0">
      <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-subtext">{label}</dt>
      <dd className="text-[13px] text-text leading-snug">{children}</dd>
    </div>
  );
}

/** "About this setting": what a fee is, who pays / earns, where it applies, what it varies by. */
export function FeeAbout({ fee, defaultOpen = true }: { fee: Fee; defaultOpen?: boolean }) {
  const a = useAbout(fee);
  const { t } = a;
  return (
    <details open={defaultOpen} className="group rounded-xl border border-border bg-soft-pink/40 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
        <span>{t("about.title")}</span>
        <span aria-hidden className="text-subtext transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <dl className="divide-y divide-border px-3.5 pb-3">
        {a.what && <Row label={t("about.what")}>{a.what}</Row>}
        {a.whoPays && <Row label={t("about.who_pays")}>{a.whoPays}</Row>}
        {a.whoEarns && <Row label={t("about.who_earns")}>{a.whoEarns}</Row>}
        {a.appliesTo && <Row label={t("about.applies_to")}>{a.appliesTo}</Row>}
        <Row label={t("about.varies_by")}>
          {a.varies.length ? (
            <span className="flex flex-wrap gap-1">
              {a.varies.map((v) => (
                <span key={v} className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-text">
                  {v}
                </span>
              ))}
            </span>
          ) : (
            t("about.varies_none")
          )}
        </Row>
        {(a.example || fee.example) && (
          <Row label={t("about.example")}>
            {a.example && <span className="block">{a.example}</span>}
            {fee.example && (
              <span className="mt-1 block">
                <span className="me-1 text-[11.5px] font-semibold text-subtext">{t("about.example_live")}:</span>
                <FeeExampleLine feeKey={fee.key} example={fee.example} inline />
              </span>
            )}
          </Row>
        )}
        {a.caution && (
          <Row label={t("about.caution")}>
            <span className="block rounded-lg bg-warning-light px-2.5 py-1.5 text-warning">{a.caution}</span>
          </Row>
        )}
      </dl>
    </details>
  );
}

/** Info button for a fee card or matrix row: the same explanation in a popover. */
export function FeeInfo({ fee }: { fee: Fee }) {
  const a = useAbout(fee);
  const { t } = a;
  const name = t(`fees.${fee.key}.name` as never);
  return (
    <InfoPopover label={t("about.info", { fee: name })}>
      <span className="block text-[13px] font-bold">{name}</span>
      {a.what && <span className="mt-1 block">{a.what}</span>}
      {a.whoPays && (
        <span className="mt-1.5 block">
          <strong>{t("about.who_pays")}:</strong> {a.whoPays}
        </span>
      )}
      {a.whoEarns && (
        <span className="mt-1 block">
          <strong>{t("about.who_earns")}:</strong> {a.whoEarns}
        </span>
      )}
      {a.appliesTo && (
        <span className="mt-1 block">
          <strong>{t("about.applies_to")}:</strong> {a.appliesTo}
        </span>
      )}
      <span className="mt-1 block">
        <strong>{t("about.varies_by")}:</strong> {a.varies.length ? a.varies.join(", ") : t("about.varies_none")}
      </span>
      {a.example && (
        <span className="mt-1 block text-subtext">
          <strong className="text-text">{t("about.example")}:</strong> {a.example}
        </span>
      )}
      {a.caution && <span className="mt-2 block rounded-lg bg-warning-light px-2.5 py-1.5 text-warning">{a.caution}</span>}
    </InfoPopover>
  );
}
