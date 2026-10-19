// Pack pricing — mirrors blink-server's src/lib/pack-pricing.ts (what the customer is
// charged), kept pure so the list rows (rows.ts toPack) and the live editor summary
// price a pack the same way:
//   original = Σ live unit price × quantity (rounded to 2dp)
//   savings  = round(original × effective% / 100), effective% = enabled && pct > 0 ? pct : 0
//   price    = original − savings
// Buy-X-get-Y free units (floor(quantity / buy) × get) are given on top, never charged.

/** One pack line as pricing reads it. */
export interface PricedLine {
  /** The product's live price (0 when it is missing). */
  unitPrice: number;
  /** Charged units. */
  quantity: number;
  qtyPromo: boolean;
  buyQty: number;
  getQty: number;
}

export interface PackPricing {
  /** Σ unit price × quantity — the items bought separately. */
  originalPrice: number;
  /** % discount in effect (0 when the discount is off or 0). */
  discountPercent: number;
  savings: number;
  /** What one pack costs the customer (before delivery). */
  price: number;
  /** Σ charged units. */
  itemCount: number;
  /** Σ free units (buy-X-get-Y). */
  freeCount: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Buy-X-get-Y: free units given on top of `quantity` (0 when the promo is off or incomplete). */
export function freeUnits(line: Pick<PricedLine, "quantity" | "qtyPromo" | "buyQty" | "getQty">): number {
  const buy = num(line.buyQty);
  const get = num(line.getQty);
  if (!line.qtyPromo || !(buy > 0) || !(get > 0)) return 0;
  return Math.floor(num(line.quantity) / buy) * get;
}

/** The % discount in effect: the percent when the discount is switched on and positive, else 0. */
export function effectiveDiscount(discountEnabled: boolean, discountPercent: number): number {
  const pct = num(discountPercent);
  return discountEnabled && pct > 0 ? pct : 0;
}

/** Prices a pack from its lines and discount settings — the same numbers blink-server charges. */
export function pricePack(lines: readonly PricedLine[], discountEnabled: boolean, discountPercent: number): PackPricing {
  const pct = effectiveDiscount(discountEnabled, discountPercent);
  const originalPrice = round2(lines.reduce((s, l) => s + num(l.unitPrice) * num(l.quantity), 0));
  const savings = pct > 0 ? Math.round((originalPrice * pct) / 100) : 0;
  return {
    originalPrice,
    discountPercent: pct,
    savings,
    price: round2(originalPrice - savings),
    itemCount: lines.reduce((s, l) => s + num(l.quantity), 0),
    freeCount: lines.reduce((s, l) => s + freeUnits(l), 0),
  };
}
