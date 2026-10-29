"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, EmptyState } from "@/components/ui";
import { buildTierMatrix, type MatrixCell, type MatrixRow } from "../matrix";
import { formatValueShort } from "../format";
import type { Fee, Override, TFn, Tier } from "../types";
import { tierName } from "../zones";
import { FeeEditModal, type TierTarget } from "./fee-edit-modal";

type Pick = { fee: Fee; target: TierTarget };

/** Fees x tiers: each cell is the tier's effective value; click to set or change the tier price. */
export function TiersView({
  fees,
  overrides,
  tiers,
  canEdit,
  error,
}: {
  fees: Fee[];
  overrides: Override[];
  tiers: Tier[];
  canEdit: boolean;
  error?: string;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const matrix = useMemo(() => buildTierMatrix(fees, overrides, tiers), [fees, overrides, tiers]);
  const [picked, setPicked] = useState<Pick | null>(null);
  // Derived from the current props so a refresh after a save hands the modal the fresh fee / override.
  const open = useMemo(() => {
    if (!picked) return null;
    const row = matrix.rows.find((r) => r.fee.key === picked.fee.key && (r.service ?? null) === (picked.target.service ?? null));
    const idx = matrix.tiers.findIndex((x) => x.code === picked.target.tier);
    if (!row || idx < 0) return picked;
    const cell = row.cells[idx];
    return { fee: row.fee, target: { ...picked.target, override: cell.override, initialValue: cell.value } };
  }, [picked, matrix]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!matrix.tiers.length || !matrix.rows.length) return <EmptyState title={t("matrix.empty")} description={t("matrix.empty_hint")} />;

  const choose = (row: MatrixRow, tier: Tier, cell: MatrixCell) =>
    setPicked({ fee: row.fee, target: { tier: tier.code, service: row.service, override: cell.override, initialValue: cell.value } });

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-subtext">{canEdit ? t("matrix.hint_edit") : t("matrix.hint")}</p>
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-subtext">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-primary bg-soft-pink" /> {t("matrix.legend_override")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-dashed border-border" /> {t("matrix.legend_inherited")}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-start font-semibold text-subtext px-4 py-3 min-w-[200px]">{t("overrides.col.fee")}</th>
              {matrix.tiers.map((x) => (
                <th key={x.code} className="text-start font-semibold text-text px-3 py-3 min-w-[170px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: x.color }} />
                    {tierName(tiers, x.code, locale)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.id} className="border-t border-border align-middle">
                <td className="px-4 py-2.5">
                  <span className="block font-semibold text-text">{t(`fees.${row.fee.key}.name`)}</span>
                  {row.service && <Badge variant="info">{t(`services.${row.service}`)}</Badge>}
                </td>
                {row.cells.map((cell, i) => {
                  const tier = matrix.tiers[i];
                  const value = formatValueShort(row.fee.key, cell.value, tf);
                  const cls =
                    cell.kind === "override"
                      ? "border-primary bg-soft-pink text-text font-semibold"
                      : "border-dashed border-border text-subtext";
                  const body = (
                    <>
                      <span className="block tabular-nums">{value}</span>
                      <span className="block text-[10.5px] font-normal opacity-75">
                        {cell.kind === "override" ? t("matrix.tier_price") : cell.fromTierWide ? t("matrix.inherited_tier") : t("matrix.inherited_default")}
                      </span>
                    </>
                  );
                  return (
                    <td key={tier.code} className="px-2 py-1.5">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => choose(row, tier, cell)}
                          className={`w-full text-start rounded-lg border px-3 py-2 cursor-pointer transition-colors hover:border-primary ${cls}`}
                          aria-label={`${t(`fees.${row.fee.key}.name`)} · ${tierName(tiers, tier.code, locale)}`}
                        >
                          {body}
                        </button>
                      ) : (
                        <div className={`rounded-lg border px-3 py-2 ${cls}`}>{body}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && <FeeEditModal fee={open?.fee ?? null} tiers={tiers} target={open?.target ?? null} onClose={() => setPicked(null)} />}
    </div>
  );
}
