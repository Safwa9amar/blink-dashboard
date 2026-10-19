"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, SearchBox } from "@/components/ui";
import { formatDa } from "../rows";
import type { PackStoreOption } from "../types";
import { StoreCard } from "./store-card";

/** Rows rendered at once; the search narrows the rest. */
const SHOWN = 50;

/**
 * The create flow's store picker: searchable by store, owner name or phone, live
 * stores first. Once a store is picked it collapses to its card with a "Change"
 * button (picking another store clears the items — they belong to the old store).
 */
export function StorePicker({
  stores,
  value,
  onChange,
  hasItems,
  error,
}: {
  stores: PackStoreOption[];
  value: PackStoreOption | null;
  onChange: (store: PackStoreOption) => void;
  hasItems: boolean;
  error?: string;
}) {
  const t = useTranslations("packs.editor.store");
  const tEditor = useTranslations("packs.editor");
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");

  if (value && !picking) {
    return (
      <StoreCard
        store={value}
        action={
          <Button type="button" size="sm" variant="secondary" onClick={() => setPicking(true)}>
            {t("change")}
          </Button>
        }
      />
    );
  }

  const needle = q.trim().toLowerCase();
  const matches = stores
    .filter((s) =>
      needle ? [s.name, s.ownerName, s.ownerPhone].some((v) => v?.toLowerCase().includes(needle)) : true
    )
    .sort((a, b) => Number(b.status === "active") - Number(a.status === "active"));
  const shown = matches.slice(0, SHOWN);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setPicking(false)}>
            {tEditor("cancel")}
          </Button>
        )}
      </div>
      {value && hasItems && <p className="text-xs text-warning">{t("change_clears")}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-subtext py-2">{stores.length === 0 ? t("no_stores") : t("none")}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setPicking(false);
                  setQ("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-start transition-colors cursor-pointer hover:bg-card-hover ${
                  value?.id === s.id ? "bg-soft-pink" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate" dir="auto">
                    {s.name}
                  </p>
                  <p className="text-xs text-subtext truncate">
                    {s.ownerName || "—"}
                    {s.ownerPhone && (
                      <span dir="ltr" className="ms-1.5">
                        {s.ownerPhone}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-subtext tabular-nums whitespace-nowrap">{formatDa(s.deliveryFee)}</span>
                {s.status !== "active" && (
                  <Badge variant={s.status === "under_review" ? "warning" : "default"}>
                    {s.status === "under_review" || s.status === "inactive" ? t(`status.${s.status}`) : s.status}
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {matches.length > shown.length && (
        <p className="text-xs text-subtext">{t("more", { shown: shown.length, total: matches.length })}</p>
      )}
    </div>
  );
}
