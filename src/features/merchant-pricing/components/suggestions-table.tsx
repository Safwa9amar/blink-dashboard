"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  SearchBox,
  FilterPills,
  DataTable,
  DashIcon,
  type Column,
} from "@/components/ui";
import {
  SEED_SUGGESTIONS,
  SUGGESTION_STATUS,
  SUGGESTION_STATUS_KEYS,
  PRICE_TOLERANCE,
  type PriceSuggestion,
  type SuggestionStatus,
  type TFn,
} from "../data";
import { SuggestionReviewModal } from "./suggestion-review-modal";

export function SuggestionsTable({ t }: { t: TFn }) {
  const [suggestions, setSuggestions] = useState(SEED_SUGGESTIONS);
  const [q, setQ] = useState("");
  const [sf, setSf] = useState<SuggestionStatus | "all">("all");
  const [reviewing, setReviewing] = useState<PriceSuggestion | null>(null);

  function handleAction(id: string, action: "accepted" | "rejected", note?: string) {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: action, reviewedAt: Date.now(), reviewedBy: "admin@blink.dz", note }
          : s
      )
    );
  }

  const columns: Column<PriceSuggestion>[] = [
    {
      key: "productName",
      label: t("col.product"),
      render: (r) => (
        <div>
          <p className="font-medium text-text">{r.productName}</p>
          <p className="text-xs text-subtext">{r.productCategory}</p>
        </div>
      ),
    },
    {
      key: "storeName",
      label: t("col.store"),
      render: (r) => <span className="text-sm">{r.storeName}</span>,
    },
    {
      key: "blinkPrice",
      label: t("col.blink_price"),
      render: (r) => <span className="tabular-nums">{r.blinkPrice} Da</span>,
    },
    {
      key: "suggestedPrice",
      label: t("col.suggested"),
      render: (r) => <span className="tabular-nums font-medium text-primary">{r.suggestedPrice} Da</span>,
    },
    {
      key: "deviation",
      label: t("col.deviation"),
      render: (r) => {
        const over = Math.abs(r.deviation) > PRICE_TOLERANCE * 100;
        return (
          <Badge variant={over ? "danger" : "success"}>
            {r.deviation > 0 ? "+" : ""}{r.deviation.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={SUGGESTION_STATUS[r.status]}>{t("status." + r.status)}</Badge>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <button
          type="button"
          onClick={() => setReviewing(r)}
          aria-label={t("review_btn")}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:bg-card-hover transition-colors cursor-pointer"
        >
          <DashIcon name="eye" className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const rows = suggestions
    .filter((s) => (sf === "all" ? true : s.status === sf))
    .filter((s) =>
      q
        ? s.productName.toLowerCase().includes(q.toLowerCase()) ||
          s.storeName.toLowerCase().includes(q.toLowerCase()) ||
          s.barcode.includes(q)
        : true
    );

  const filterOptions: [SuggestionStatus | "all", string][] = [
    ["all", t("all")],
    ...SUGGESTION_STATUS_KEYS.map((k) => [k, t("status." + k)] as [SuggestionStatus, string]),
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={setSf} />
      <DataTable columns={columns} data={rows} empty={t(q || sf !== "all" ? "empty.filtered" : "empty.none")} />
      <SuggestionReviewModal
        t={t}
        suggestion={reviewing}
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        onAction={handleAction}
      />
    </>
  );
}
