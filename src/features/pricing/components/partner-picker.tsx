"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { fInput } from "@/components/ui";
import { searchPartners } from "@/app/d/pricing/action";
import type { PartnerHit, PartnerKind } from "../types";

// Merchant / agent search-select (reads `users` server-side via the action).
export function PartnerPicker({
  kind,
  value,
  onChange,
  disabled,
}: {
  kind: PartnerKind;
  value: PartnerHit | null;
  onChange: (p: PartnerHit | null) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("pricing");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PartnerHit[]>([]);
  const [, start] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) return;
    const id = setTimeout(() => start(async () => setHits(await searchPartners(kind, q))), 250);
    return () => clearTimeout(id);
  }, [q, kind]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-[10px] border border-border px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{value.name}</p>
          {value.sub && <p className="text-xs text-subtext truncate">{value.sub}</p>}
        </div>
        {!disabled && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-primary cursor-pointer shrink-0">
            {t("actions.change")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className={fInput}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(`partner.search_${kind}`)}
        disabled={disabled}
      />
      {q.trim().length >= 2 && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(h);
                  setQ("");
                  setHits([]);
                }}
                className="w-full text-start px-3.5 py-2 hover:bg-card-hover cursor-pointer"
              >
                <span className="block text-sm text-text">{h.name}</span>
                {h.sub && <span className="block text-xs text-subtext">{h.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
