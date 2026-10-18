"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button } from "@/components/ui";
import { listPartnerOverrides, loadCatalog } from "@/app/d/pricing/action";
import { formatValueShort } from "../format";
import type { Fee, Override, PartnerKind, TFn } from "../types";
import { OverrideWizard } from "./override-wizard";
import { ScopeChips } from "./scope-chips";
import { STATUS_VARIANT, formatWindow } from "./overrides-view";

// Merchant / agent "Pricing deals": this partner's overrides + a "New deal" button
// that opens the override modal with the partner pre-filled. Renders nothing for
// staff roles without pricing access.
export function PricingDealsCard({
  kind,
  partnerId,
  partnerName,
}: {
  kind: PartnerKind;
  partnerId: string;
  partnerName: string;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<Fee[] | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await listPartnerOverrides(kind, partnerId);
    if (!res.ok) {
      // No pricing access (or the module isn't deployed): stay out of the way.
      setHidden(true);
      setError(res.error);
      return;
    }
    setOverrides(res.data.overrides);
    setCanEdit(res.data.canEdit);
  }, [kind, partnerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openModal = async () => {
    if (!fees) {
      const res = await loadCatalog();
      if (!res.ok) return setError(res.error);
      setFees(res.data);
    }
    setOpen(true);
  };

  if (hidden) return null;

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text">{t("deals.title")}</h3>
        {canEdit && (
          <Button size="xs" icon="plus" onClick={openModal}>
            {t("deals.new")}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-danger mb-2">{error}</p>}
      {overrides === null ? (
        <p className="text-xs text-subtext">…</p>
      ) : overrides.length === 0 ? (
        <p className="text-xs text-subtext">{t("deals.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {overrides.map((o) => (
            <li key={o.id} className="rounded-xl border border-border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-text">{t(`fees.${o.key}.name`)}</span>
                <Badge variant={STATUS_VARIANT[o.status]}>{t(`status.${o.status}`)}</Badge>
              </div>
              <p className="text-[13px] text-text mt-0.5">{formatValueShort(o.key, o.value, tf)}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <ScopeChips service={o.service} wilaya_code={o.wilaya_code} />
                <span className="text-[11.5px] text-subtext">{formatWindow(o, locale, tf)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {fees && (
        <OverrideWizard
          open={open}
          onClose={() => setOpen(false)}
          fees={fees}
          preset={{ kind, partner: { id: partnerId, name: partnerName, sub: "" } }}
          onSaved={load}
        />
      )}
    </div>
  );
}
