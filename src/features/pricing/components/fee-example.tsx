"use client";

import { useTranslations } from "next-intl";
import { exampleSentence } from "../format";
import { useClassName } from "./vehicle-classes-context";
import type { FeeExample, PricingKey, TFn } from "../types";

/** Server example of a fee as a muted sentence; nothing when the server has none. */
export function FeeExampleLine({
  feeKey,
  example,
  inline = false,
}: {
  feeKey: PricingKey;
  example: FeeExample | null | undefined;
  /** Render as a span (inside another sentence) instead of a paragraph. */
  inline?: boolean;
}) {
  const t = useTranslations("pricing") as unknown as TFn;
  const className = useClassName();
  const text = exampleSentence(feeKey, example, t, className);
  if (!text) return null;
  if (inline) return <span className="text-[12.5px] text-text">{text}</span>;
  return <p className="text-[12px] text-subtext leading-snug">{text}</p>;
}

/**
 * What a change does, before -> after: the value itself, then the server's worked example for both.
 * Prominent on purpose: it is the last thing staff read before saving.
 */
export function BeforeAfter({
  feeKey,
  before,
  after,
  loading,
  valueBefore,
  valueAfter,
}: {
  feeKey: PricingKey;
  before: FeeExample | null | undefined;
  after: FeeExample | null | undefined;
  loading?: boolean;
  /** The fee value in words, now and after the edit. */
  valueBefore?: string;
  valueAfter?: string;
}) {
  const t = useTranslations("pricing") as unknown as TFn;
  const className = useClassName();
  const b = exampleSentence(feeKey, before, t, className);
  const a = exampleSentence(feeKey, after, t, className);
  if (!b && !a && !valueBefore && !valueAfter) return null;
  const col = ({ label, value, example, strong }: { label: string; value?: string; example: string | null; strong?: boolean }) => (
    <div className={`min-w-0 rounded-lg px-3 py-2 ${strong ? "border border-primary bg-card" : "border border-border bg-card/60"}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${strong ? "text-primary" : "text-subtext"}`}>{label}</p>
      {value && <p className="mt-0.5 text-[13px] font-semibold text-text break-words">{value}</p>}
      {example && <p className={`mt-0.5 text-[12px] ${strong ? "text-text" : "text-subtext"}`}>{example}</p>}
    </div>
  );
  return (
    <section aria-label={t("preview.title")} aria-live="polite" className={`rounded-xl bg-soft-pink p-3 ${loading ? "opacity-60" : ""}`}>
      <p className="mb-2 text-[12.5px] font-bold text-text">{t("preview.title")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        {col({ label: t("preview.value_before"), value: valueBefore, example: b })}
        <span aria-hidden className="self-center justify-self-center text-primary font-bold rtl:rotate-180 sm:block hidden">
          →
        </span>
        {col({ label: t("preview.value_after"), value: valueAfter, example: a, strong: true })}
      </div>
    </section>
  );
}
