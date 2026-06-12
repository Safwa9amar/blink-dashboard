"use client";

import { useState } from "react";
import { Modal, Button, Badge, FormRow } from "@/components/ui";
import { SUGGESTION_STATUS, PRICE_TOLERANCE, type PriceSuggestion, type TFn } from "../data";

interface Props {
  t: TFn;
  suggestion: PriceSuggestion | null;
  open: boolean;
  onClose: () => void;
  onAction: (id: string, action: "accepted" | "rejected", note?: string) => void;
}

export function SuggestionReviewModal({ t, suggestion, open, onClose, onAction }: Props) {
  const [note, setNote] = useState("");
  if (!suggestion) return null;

  const isOverTolerance = Math.abs(suggestion.deviation) > PRICE_TOLERANCE * 100;

  function handleAction(action: "accepted" | "rejected") {
    onAction(suggestion!.id, action, note || undefined);
    setNote("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t("review.title")}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-subtext uppercase tracking-wider">{t("col.store")}</p>
            <p className="text-sm font-medium text-text">{suggestion.storeName}</p>
          </div>
          <div>
            <p className="text-xs text-subtext uppercase tracking-wider">{t("col.product")}</p>
            <p className="text-sm font-medium text-text">{suggestion.productName}</p>
          </div>
          <div>
            <p className="text-xs text-subtext uppercase tracking-wider">{t("col.category")}</p>
            <p className="text-sm text-text">{suggestion.productCategory}</p>
          </div>
          <div>
            <p className="text-xs text-subtext uppercase tracking-wider">{t("col.barcode")}</p>
            <p className="text-sm font-mono text-text">{suggestion.barcode}</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-subtext">{t("review.blink_price")}</span>
            <span className="text-sm font-bold tabular-nums">{suggestion.blinkPrice} Da</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-subtext">{t("review.current_price")}</span>
            <span className="text-sm tabular-nums">{suggestion.currentPrice} Da</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-text">{t("review.suggested_price")}</span>
            <span className="text-base font-bold text-primary tabular-nums">{suggestion.suggestedPrice} Da</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-subtext">{t("review.deviation")}</span>
            <Badge variant={isOverTolerance ? "danger" : "success"}>
              {suggestion.deviation > 0 ? "+" : ""}{suggestion.deviation.toFixed(1)}%
            </Badge>
          </div>
          {isOverTolerance && (
            <p className="text-xs text-danger">{t("review.over_tolerance")}</p>
          )}
        </div>

        {suggestion.status === "pending" && (
          <>
            <FormRow label={t("review.note")} htmlFor="review-note">
              <textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("review.note_placeholder")}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-subtext focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </FormRow>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => handleAction("accepted")} icon="check">
                {t("review.approve")}
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => handleAction("rejected")} icon="x">
                {t("review.reject")}
              </Button>
            </div>
          </>
        )}
        {suggestion.status !== "pending" && (
          <div className="text-center py-2">
            <Badge variant={SUGGESTION_STATUS[suggestion.status]}>
              {t("status." + suggestion.status)}
            </Badge>
            {suggestion.note && <p className="text-xs text-subtext mt-2">{suggestion.note}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
