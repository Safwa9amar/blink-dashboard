// Domain types for the promotions feature (rows mirror the `promotions` table).
export type PromotionKind = "promo" | "deal";
export type PromotionAction = "activate" | "copy" | "claim" | "view";
export type DiscountType = "percent" | "fixed" | "free_delivery";

export interface PromotionRow {
  id: string;
  kind: PromotionKind;
  category: string;
  title: string;
  subtitle: string;
  image_url: string;
  code: string | null;
  action: PromotionAction;
  badge_text: string | null;
  badge_color: string | null;
  value_text: string | null;
  info_text: string | null;
  info_icon: string | null;
  store_id: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  valid_days: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
  max_coupons: number | null;
  discount_budget: number | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** One row of `rpc('promotion_stats')`. */
export interface PromotionStats {
  promotion_id: string;
  views: number;
  reach: number;
  taps: number;
  tappers: number;
  issued: number;
  used: number;
  discount_given: number;
  orders: number;
  revenue: number;
}

/** One row of `rpc('promotion_daily')`. */
export interface PromotionDay {
  day: string;
  views: number;
  taps: number;
  issued: number;
  used: number;
  discount_given: number;
}

export const EMPTY_STATS = (promotion_id: string): PromotionStats => ({
  promotion_id,
  views: 0,
  reach: 0,
  taps: 0,
  tappers: 0,
  issued: 0,
  used: 0,
  discount_given: 0,
  orders: 0,
  revenue: 0,
});

/** A promotion row joined with its stats (list + analytics views). */
export interface PromotionListItem {
  row: PromotionRow;
  stats: PromotionStats;
}

export interface StoreOption {
  id: string;
  name: string;
}

/** A coupon issued from a promotion (edit page "latest coupons"). */
export interface PromotionCouponRow {
  id: string;
  code: string;
  user_name: string;
  created_at: string;
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
}
