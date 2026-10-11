"use client";

import { useEffect, useRef, useState } from "react";
import { Button, DashIcon, EmptyState, FilterPills } from "@/components/ui";
import { requiredDocLabel, storesInView } from "../queue";
import {
  STORE_VIEWS,
  type DocumentVerdict,
  type ReviewDecision,
  type ReviewOutcome,
  type StoreCounts,
  type StoreDocKey,
  type StoreQueueItem,
  type StoreView,
  type TFn,
} from "../types";
import { StoreCard } from "./store-card";
import { StoreTable } from "./store-table";

type Notice = { tone: "success" | "danger"; text: string };

/** A decision that failed because the list was stale; the page refreshes right after. */
type StaleFailure = { id: string; view: StoreView; text: string };

/** Failures that come with a refreshed list (the actions revalidate on 404 / 409, and on a vanished document). */
const STALE_CODES = new Set(["conflict", "not_found", "owner_leaving", "stale", "document_missing"]);

// Merchant stores queue: displays a master table list by default.
// Selecting a store row opens the detailed Compliance Trust Journey verification page,
// with a clean top navigation bar to go back or step to previous/next stores.
export function StoreQueue({
  t,
  locale,
  items,
  counts,
}: {
  t: TFn;
  locale: string;
  items: StoreQueueItem[];
  counts: StoreCounts;
}) {
  const [filter, setFilter] = useState<StoreView>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [stale, setStale] = useState<StaleFailure | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const shown = storesInView(items, filter);
  const selectedStore = selectedId ? items.find((s) => s.id === selectedId) : null;
  const currentIndex = selectedStore ? shown.findIndex((s) => s.id === selectedStore.id) : -1;

  const options: [StoreView, string][] = STORE_VIEWS.map((f) => [
    f,
    t("stores.filter_count", { label: t(`stores.filter.${f}`), n: counts[f] }),
  ]);

  const staleGone = !!stale && !items.some((s) => s.id === stale.id && s.views.includes(stale.view));
  const current: Notice | null = staleGone ? { tone: "danger", text: stale.text } : notice;
  const alertText = current?.tone === "danger" ? current.text : null;

  useEffect(() => {
    if (!alertText) return;
    noticeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    noticeRef.current?.focus({ preventScroll: true });
  }, [alertText]);

  function changeFilter(next: StoreView) {
    setFilter(next);
    setSelectedId(null);
    setStale(null);
  }

  function dismiss() {
    setNotice(null);
    setStale(null);
  }

  function handleOutcome(store: StoreQueueItem, decision: ReviewDecision, outcome: ReviewOutcome) {
    setStale(null);
    if (outcome.ok) {
      setNotice({ tone: "success", text: t(`stores.done.${decision}`, { name: store.name || t("unnamed") }) });
      return;
    }
    setNotice(null);
    if (STALE_CODES.has(outcome.code)) setStale({ id: store.id, view: filter, text: outcome.message });
  }

  function handleDocumentOutcome(
    store: StoreQueueItem,
    doc: StoreDocKey,
    verdict: DocumentVerdict,
    outcome: ReviewOutcome
  ) {
    setStale(null);
    if (outcome.ok) {
      const values = { doc: requiredDocLabel(t, doc), name: store.name || t("unnamed") };
      setNotice({ tone: "success", text: t(`stores.doc_done.${verdict}`, values) });
      return;
    }
    setNotice(null);
    if (STALE_CODES.has(outcome.code)) setStale({ id: store.id, view: filter, text: outcome.message });
  }

  return (
    <>
      {/* Notice Banner */}
      {current && (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role={current.tone === "danger" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-xl p-3 mb-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-danger/40 ${
            current.tone === "success" ? "bg-success-light text-success" : "bg-danger-light text-danger"
          }`}
        >
          <span>{current.text}</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("notice_dismiss")}
            className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <DashIcon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DETAIL VIEW: When a specific store is selected */}
      {selectedStore ? (
        <div>
          {/* Top Back & Stepper Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5"
              >
                <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                <span>{t("stores.table.back_to_list")}</span>
              </Button>

              <span className="text-xs text-subtext/60 hidden sm:inline">|</span>

              <span className="text-xs font-semibold text-text truncate max-w-[200px] sm:max-w-xs">
                {selectedStore.name || t("unnamed")}
              </span>
            </div>

            {/* Stepper Navigation: Previous / Next Store in Current Filter */}
            <div className="flex items-center gap-2.5">
              {currentIndex >= 0 && (
                <span className="text-xs text-subtext font-medium">
                  {t("stores.table.store_counter", { current: currentIndex + 1, total: shown.length })}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex <= 0}
                  onClick={() => currentIndex > 0 && setSelectedId(shown[currentIndex - 1].id)}
                  aria-label={t("stores.table.prev_store")}
                  className="px-2"
                >
                  <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex < 0 || currentIndex >= shown.length - 1}
                  onClick={() => currentIndex < shown.length - 1 && setSelectedId(shown[currentIndex + 1].id)}
                  aria-label={t("stores.table.next_store")}
                  className="px-2"
                >
                  <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Detailed Compliance Trust Journey Store Card */}
          <StoreCard
            t={t}
            locale={locale}
            store={selectedStore}
            onOutcome={(decision, outcome) => handleOutcome(selectedStore, decision, outcome)}
            onDocumentOutcome={(doc, verdict, outcome) => handleDocumentOutcome(selectedStore, doc, verdict, outcome)}
          />
        </div>
      ) : (
        /* MASTER LIST VIEW: Table or Cards listing */
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <FilterPills options={options} value={filter} onChange={changeFilter} />

            {/* View Mode Toggle: Table (default) vs Cards */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>☷</span>
                <span>{t("stores.table.view_table")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>⊞</span>
                <span>{t("stores.table.view_cards")}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-subtext -mt-2.5 mb-4">{t(`stores.filter_hint.${filter}`)}</p>

          {filter === "documents" && !counts.documentsComplete && (
            <p className="text-xs text-subtext mb-3">
              {t("stores.documents_checked", { checked: counts.documentsChecked, total: counts.live })}
            </p>
          )}

          {shown.length < counts[filter] && (
            <p className="text-xs text-subtext mb-3">
              {t(filter === "pending" || filter === "documents" ? "stores.showing_oldest" : "stores.showing_latest", {
                shown: shown.length,
                total: counts[filter],
              })}
            </p>
          )}

          {shown.length === 0 ? (
            <EmptyState
              icon={<DashIcon name="store" className="w-10 h-10" />}
              title={t(`empty.stores_${filter}`)}
              description={t(`empty.stores_${filter}_desc`)}
            />
          ) : viewMode === "table" ? (
            <StoreTable
              t={t}
              locale={locale}
              stores={shown}
              onSelectStore={(s) => setSelectedId(s.id)}
            />
          ) : (
            <div className="space-y-4">
              {shown.map((s) => (
                <StoreCard
                  key={s.id}
                  t={t}
                  locale={locale}
                  store={s}
                  onOutcome={(decision, outcome) => handleOutcome(s, decision, outcome)}
                  onDocumentOutcome={(doc, verdict, outcome) => handleDocumentOutcome(s, doc, verdict, outcome)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
