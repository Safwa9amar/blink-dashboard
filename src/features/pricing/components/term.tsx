"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Popover } from "./popover";

export const TERMS = ["tier", "zone", "unzoned", "override", "scope", "multiplier", "surcharge", "vehicle_class", "exclusive", "includedkm", "roadfactor"] as const;
export type TermKey = (typeof TERMS)[number];

/**
 * A jargon word with a plain-language definition on hover, focus or click. Without children it
 * shows the glossary label. Do not put it inside a <label>: the button would steal the label's click.
 */
export function Term({ term, children, icon = false }: { term: TermKey; children?: ReactNode; icon?: boolean }) {
  const t = useTranslations("pricing");
  const label = t(`glossary.${term}.label`);
  const def = t(`glossary.${term}.def`);
  const name = t("glossary.label", { term: label });
  return (
    <Popover
      hover
      label={name}
      triggerClassName={
        icon
          ? "ms-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-bold leading-none text-subtext hover:border-primary hover:text-primary"
          : "underline decoration-dotted decoration-subtext/70 underline-offset-[3px] hover:decoration-primary"
      }
      trigger={icon ? "?" : (children ?? label)}
    >
      <span className="block font-semibold">{label}</span>
      <span className="mt-1 block text-subtext">{def}</span>
    </Popover>
  );
}

/** Rich-text tag handlers for locale strings like `<tier>tier</tier>`; spread into `t.rich(key, { ...termTags })`. */
export const termTags: Record<string, (chunks: ReactNode) => ReactNode> = {
  tier: (c) => <Term term="tier">{c}</Term>,
  zone: (c) => <Term term="zone">{c}</Term>,
  unzoned: (c) => <Term term="unzoned">{c}</Term>,
  override: (c) => <Term term="override">{c}</Term>,
  scope: (c) => <Term term="scope">{c}</Term>,
  multiplier: (c) => <Term term="multiplier">{c}</Term>,
  surcharge: (c) => <Term term="surcharge">{c}</Term>,
  vclass: (c) => <Term term="vehicle_class">{c}</Term>,
  exclusive: (c) => <Term term="exclusive">{c}</Term>,
  includedkm: (c) => <Term term="includedkm">{c}</Term>,
  roadfactor: (c) => <Term term="roadfactor">{c}</Term>,
  b: (c) => <strong>{c}</strong>,
};
