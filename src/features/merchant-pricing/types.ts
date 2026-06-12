import type { Variant } from "@/components/ui";

export type TFn = (k: string, v?: Record<string, string | number>) => string;

export type SuggestionStatus = "pending" | "accepted" | "rejected";

export interface PriceSuggestion {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productCategory: string;
  barcode: string;
  blinkPrice: number; // platform reference price (DZD)
  currentPrice: number; // merchant's current final price
  suggestedPrice: number; // merchant's proposed new price
  status: SuggestionStatus;
  deviation: number; // % deviation from blink price (calculated)
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  note?: string;
}

export type NewSuggestionInput = Omit<PriceSuggestion, "id" | "deviation" | "submittedAt">;

export const SUGGESTION_STATUS: Record<SuggestionStatus, Variant> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
};

export const SUGGESTION_STATUS_KEYS: SuggestionStatus[] = ["pending", "accepted", "rejected"];

export const PRICE_TOLERANCE = 0.2; // ±20% from blink price
