// Domain types for the coupons feature (rows mirror `customer_coupons`).
export type CouponStatus = "active" | "used" | "expired" | "revoked";
export type CouponSource = "promotion" | "referral" | "staff";
export type CouponDiscountType = "percent" | "fixed" | "free_delivery";

/** A coupon joined with its customer, promotion and issuer, ready for the table. */
export interface CouponListRow {
  id: string;
  code: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  promotion_id: string | null;
  promotion_title: string | null;
  title: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  status: CouponStatus;
  expires_at: string | null;
  used_at: string | null;
  revoked_at: string | null;
  order_id: string | null;
  source: CouponSource;
  issued_by_name: string | null;
  note: string | null;
  created_at: string;
}

export interface CouponKpis {
  active: number;
  used30: number;
  expiring7: number;
  revoked: number;
}

export interface PromotionOption {
  id: string;
  title: string;
  kind: "promo" | "deal";
  archived: boolean;
}

export interface CustomerHit {
  id: string;
  name: string;
  phone: string;
}
