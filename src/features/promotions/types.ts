// Domain types for the promotions feature.
export interface Promo {
  title: string;
  sub: string;
  cat: string;
  type: "activate" | "copy";
  code?: string | null;
  cover: number;
  status: string;
  reach: number;
  redeemed: number;
  ctr: string;
}
