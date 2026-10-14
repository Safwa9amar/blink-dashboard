import type { Variant } from "@/components/ui";
import type { CouponSource, CouponStatus } from "./types";

// Same order as blink-server's `presentCoupon`: revoked → used → expired → active.
export function couponStatus(
  c: { revoked_at: string | null; used_at: string | null; expires_at: string | null },
  now: Date = new Date()
): CouponStatus {
  if (c.revoked_at) return "revoked";
  if (c.used_at) return "used";
  if (c.expires_at && new Date(c.expires_at).getTime() < now.getTime()) return "expired";
  return "active";
}

export const STATUS_VARIANT: Record<CouponStatus, Variant> = {
  active: "success",
  used: "info",
  expired: "default",
  revoked: "danger",
};

export const STATUSES: CouponStatus[] = ["active", "used", "expired", "revoked"];
export const SOURCES: CouponSource[] = ["promotion", "referral", "staff"];
export const COUPON_ART = ["market", "food", "cosmetics", "parcels", "rides", "others"] as const;

/** Promotion category (RIDES, FOOD, ...) → CouponCard art in the app. */
export function categoryToArt(category: string): (typeof COUPON_ART)[number] {
  switch (category) {
    case "RIDES":
      return "rides";
    case "FOOD":
      return "food";
    case "SUPERMARKET":
    case "MARKET":
      return "market";
    case "COSMETICS":
      return "cosmetics";
    case "PARCELS":
      return "parcels";
    default:
      return "others";
  }
}
