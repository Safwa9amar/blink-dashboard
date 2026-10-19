"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, SearchBox } from "@/components/ui";
import { formatDa } from "../rows";
import type { PackProductOption } from "../types";
import { PackThumb } from "./pack-thumb";

/** Rows rendered at once; the search narrows the rest. */
const SHOWN = 60;

/**
 * The store's products, searchable, sellable ones first. Only available, approved
 * products can be added (customers never see a pack holding anything else); the
 * others stay listed, disabled, with the reason. A product is added once.
 */
export function ProductPicker({
  products,
  addedIds,
  onAdd,
  full,
  loading,
  error,
}: {
  products: PackProductOption[];
  addedIds: ReadonlySet<string>;
  onAdd: (productId: string) => void;
  /** The pack already holds the maximum number of products. */
  full: boolean;
  loading?: boolean;
  error?: string;
}) {
  const t = useTranslations("packs");
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const matches = products
    .filter((p) => (needle ? [p.title, p.unit].some((v) => v?.toLowerCase().includes(needle)) : true))
    .sort((a, b) => Number(a.issue !== null) - Number(b.issue !== null));
  const shown = matches.slice(0, SHOWN);

  return (
    <div className="rounded-xl border border-border p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-text">{t("editor.items.add_title")}</p>
        <SearchBox placeholder={t("editor.items.search")} value={q} onChange={setQ} />
      </div>
      {full && <p className="text-xs text-warning">{t("editor.items.limit_reached")}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-subtext py-2">{t("editor.items.loading")}</p>
      ) : shown.length === 0 ? (
        !error && (
          <p className="text-sm text-subtext py-2">
            {products.length === 0 ? t("editor.items.no_products") : t("editor.items.none")}
          </p>
        )
      ) : (
        <ul className="max-h-80 overflow-y-auto divide-y divide-border -mx-3 border-t border-border">
          {shown.map((p) => {
            const added = addedIds.has(p.id);
            return (
              <li key={p.id} className={`flex items-center gap-3 px-3 py-2 ${p.issue ? "opacity-70" : ""}`}>
                <PackThumb src={p.image} icon="package" className="w-9 h-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate" dir="auto">
                    {p.title}
                  </p>
                  <p className="text-xs text-subtext tabular-nums">
                    {p.unit && <span dir="auto">{p.unit} · </span>}
                    {formatDa(p.price)}
                  </p>
                  {p.issue && <p className="text-xs text-warning">{t(`issue.${p.issue}`)}</p>}
                </div>
                {added ? (
                  <Badge variant="success">{t("editor.items.added")}</Badge>
                ) : (
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    icon="plus"
                    disabled={!!p.issue || full}
                    onClick={() => onAdd(p.id)}
                  >
                    {t("editor.items.add")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!loading && matches.length > shown.length && (
        <p className="text-xs text-subtext">{t("editor.items.more", { shown: shown.length, total: matches.length })}</p>
      )}
    </div>
  );
}
