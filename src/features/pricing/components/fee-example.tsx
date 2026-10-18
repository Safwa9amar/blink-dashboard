"use client";

import { useTranslations } from "next-intl";
import { exampleSentence } from "../format";
import type { FeeExample, PricingKey, TFn } from "../types";

/** Server example of a fee as a muted sentence; nothing when the server has none. */
export function FeeExampleLine({ feeKey, example }: { feeKey: PricingKey; example: FeeExample | null | undefined }) {
  const t = useTranslations("pricing") as unknown as TFn;
  const text = exampleSentence(feeKey, example, t);
  if (!text) return null;
  return <p className="text-[12px] text-subtext leading-snug">{text}</p>;
}

/** Before → after pair from `candidate_example` (two stacked sentences). */
export function BeforeAfter({
  feeKey,
  before,
  after,
  loading,
}: {
  feeKey: PricingKey;
  before: FeeExample | null | undefined;
  after: FeeExample | null | undefined;
  loading?: boolean;
}) {
  const t = useTranslations("pricing") as unknown as TFn;
  const b = exampleSentence(feeKey, before, t);
  const a = exampleSentence(feeKey, after, t);
  if (!b && !a) return null;
  return (
    <div className={`rounded-xl bg-soft-pink px-3.5 py-2.5 space-y-1 text-[12.5px] ${loading ? "opacity-60" : ""}`}>
      {b && (
        <p className="text-subtext">
          <span className="font-semibold me-1.5">{t("example.before")}</span>
          {b}
        </p>
      )}
      {a && (
        <p className="text-primary font-semibold">
          <span className="me-1.5">{t("example.after")}</span>
          {a}
        </p>
      )}
    </div>
  );
}
