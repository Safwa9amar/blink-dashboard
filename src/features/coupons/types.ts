// Domain types for the coupons feature.
export interface Coupon {
  disc: string;
  unit: string;
  title: string;
  min: number;
  max: number | null;
  code: string;
  days: number;
  locked: boolean;
  points?: number;
  audience?: string;
}
