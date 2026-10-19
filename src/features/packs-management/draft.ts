// The staff pack editor's draft: defaults, validation and the blink-server write
// body. Pure — the editor validates live with it and the server actions validate
// again with the same rules before calling blink-server, whose limits these mirror
// (POST /merchant/admin/stores/{storeId}/packs, PATCH /merchant/admin/packs/{packId}).
import { isUuid } from "./rows";
import type { PricedLine } from "./pricing";
import {
  PACK_CREATE_STATUSES,
  PACK_EDIT_STATUSES,
  type Pack,
  type PackDraft,
  type PackDraftErrorKey,
  type PackDraftErrors,
  type PackDraftItem,
  type PackWriteBody,
} from "./types";

export const PACK_LIMITS = {
  nameMax: 80,
  descriptionMax: 500,
  itemsMax: 30,
  quantityMax: 999,
  /** Buy / get counts of a buy-X-get-Y promo. */
  promoMax: 999,
  discountMax: 90,
  imageUrlMax: 2048,
} as const;

/** The merchant app's defaults for a new line's buy-X-get-Y promo (off until switched on). */
const DEFAULT_BUY = 2;
const DEFAULT_GET = 1;

const isIntIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function emptyDraft(): PackDraft {
  return {
    name: "",
    description: "",
    image: "",
    items: [],
    discountEnabled: false,
    discountPercent: 10,
    freeDelivery: false,
    status: "active",
  };
}

export function newDraftItem(productId: string): PackDraftItem {
  return { productId, quantity: 1, qtyPromo: false, buyQty: DEFAULT_BUY, getQty: DEFAULT_GET };
}

/**
 * An existing pack as editor state, stored values as they are. Only a line whose
 * promo is off gets the default buy / get counts when unset; a live promo keeps its
 * counts even when one is below 1 — it gives no free units then (blink-server's
 * pricing) and validatePackDraft flags the line, rather than the editor quietly
 * showing (and saving) a promo customers don't get today.
 */
export function packToDraft(pack: Pack): PackDraft {
  return {
    name: pack.name,
    description: pack.description ?? "",
    image: pack.image ?? "",
    items: pack.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      qtyPromo: i.qtyPromo,
      buyQty: i.qtyPromo || i.buyQty >= 1 ? i.buyQty : DEFAULT_BUY,
      getQty: i.qtyPromo || i.getQty >= 1 ? i.getQty : DEFAULT_GET,
    })),
    discountEnabled: pack.discountEnabled,
    discountPercent: pack.discountPercentRaw,
    freeDelivery: pack.freeDelivery,
    status: pack.status,
  };
}

/** An http(s) URL blink-server will store as the pack photo. */
export function isImageUrl(value: string): boolean {
  if (value.length > PACK_LIMITS.imageUrlMax) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Checks a draft against blink-server's rules. `create` checks every field (name and
 * items are required); `update` checks only the fields present (a PATCH). Defensive
 * about shapes: server actions run it on whatever the browser sent.
 */
export function validatePackDraft(d: Partial<PackDraft>, mode: "create" | "update"): PackDraftErrors {
  const errors: PackDraftErrors = {};
  const create = mode === "create";

  if (create || d.name !== undefined) {
    const name = str(d.name);
    if (!name) errors.name = "name_required";
    else if (name.length > PACK_LIMITS.nameMax) errors.name = "name_too_long";
  }

  if (d.description !== undefined && str(d.description).length > PACK_LIMITS.descriptionMax) {
    errors.description = "description_too_long";
  }

  if (d.image !== undefined) {
    const image = str(d.image);
    if (image && !isImageUrl(image)) errors.image = "image_invalid";
  }

  if (create || d.items !== undefined) {
    const items: unknown[] = Array.isArray(d.items) ? d.items : [];
    if (items.length === 0) errors.items = "items_required";
    else if (items.length > PACK_LIMITS.itemsMax) errors.items = "items_too_many";

    const seen = new Set<string>();
    const lines: Record<string, PackDraftErrorKey> = {};
    for (const raw of items) {
      const item = (raw && typeof raw === "object" ? raw : {}) as Partial<PackDraftItem>;
      if (!isUuid(item.productId)) {
        errors.items ??= "items_invalid";
        continue;
      }
      if (seen.has(item.productId)) {
        errors.items ??= "items_duplicate";
        lines[item.productId] = "items_duplicate";
        continue;
      }
      seen.add(item.productId);
      if (!isIntIn(item.quantity, 1, PACK_LIMITS.quantityMax)) lines[item.productId] = "quantity_range";
      else if (
        item.qtyPromo === true &&
        !(isIntIn(item.buyQty, 1, PACK_LIMITS.promoMax) && isIntIn(item.getQty, 1, PACK_LIMITS.promoMax))
      ) {
        lines[item.productId] = "promo_range";
      }
    }
    if (Object.keys(lines).length) errors.lines = lines;
  }

  if (create || d.discountPercent !== undefined) {
    if (!isIntIn(d.discountPercent, 0, PACK_LIMITS.discountMax)) errors.discount = "discount_range";
  }

  if (d.status !== undefined) {
    const allowed: readonly string[] = create ? PACK_CREATE_STATUSES : PACK_EDIT_STATUSES;
    if (!allowed.includes(d.status)) errors.status = "status_invalid";
  }

  return errors;
}

export function hasDraftErrors(errors: PackDraftErrors): boolean {
  const { lines, ...rest } = errors;
  return Object.values(rest).some(Boolean) || (!!lines && Object.keys(lines).length > 0);
}

/**
 * The blink-server body for the fields present in `d` (trimmed, empty text → null).
 * Every line carries its buy / get counts like the merchant app's lines: a live promo
 * its own (never swapped for defaults — validatePackDraft rejects counts outside
 * 1..999 before anything is sent), a switched-off one its counts or the defaults.
 * `under_review` is never sent: it isn't a status staff set.
 */
export function packDraftBody(d: Partial<PackDraft>): PackWriteBody {
  const body: PackWriteBody = {};
  if (d.name !== undefined) body.name = str(d.name);
  if (d.description !== undefined) body.description = str(d.description) || null;
  if (d.image !== undefined) body.image = str(d.image) || null;
  if (d.items !== undefined) {
    body.items = d.items.map((i) => {
      const promo = i.qtyPromo === true;
      return {
        product_id: i.productId,
        quantity: i.quantity,
        qty_promo_enabled: promo,
        buy_qty: promo || isIntIn(i.buyQty, 1, PACK_LIMITS.promoMax) ? i.buyQty : DEFAULT_BUY,
        get_qty: promo || isIntIn(i.getQty, 1, PACK_LIMITS.promoMax) ? i.getQty : DEFAULT_GET,
      };
    });
  }
  if (d.discountEnabled !== undefined) body.discount_enabled = d.discountEnabled === true;
  if (d.discountPercent !== undefined) body.discount_percent = d.discountPercent;
  if (d.freeDelivery !== undefined) body.free_delivery = d.freeDelivery === true;
  if (d.status !== undefined && d.status !== "under_review") body.status = d.status;
  return body;
}

/**
 * What changed between the pack as loaded and the edited draft — the PATCH, as draft
 * fields. Compared on the normalised write body, so whitespace or defaulted promo
 * counts alone don't count. The status only goes when staff picked another one.
 */
export function packUpdatePatch(initial: PackDraft, next: PackDraft): Partial<PackDraft> {
  const a = packDraftBody(initial);
  const b = packDraftBody(next);
  const patch: Partial<PackDraft> = {};
  if (a.name !== b.name) patch.name = next.name;
  if (a.description !== b.description) patch.description = next.description;
  if (a.image !== b.image) patch.image = next.image;
  if (JSON.stringify(a.items) !== JSON.stringify(b.items)) patch.items = next.items;
  if (a.discount_enabled !== b.discount_enabled) patch.discountEnabled = next.discountEnabled;
  if (a.discount_percent !== b.discount_percent) patch.discountPercent = next.discountPercent;
  if (a.free_delivery !== b.free_delivery) patch.freeDelivery = next.freeDelivery;
  if (next.status !== initial.status && next.status !== "under_review") patch.status = next.status;
  return patch;
}

/** Draft lines priced with the products' live prices (0 for a product that isn't known). */
export function draftLines(
  items: readonly PackDraftItem[],
  priceOf: (productId: string) => number | undefined
): PricedLine[] {
  return items.map((i) => ({
    unitPrice: priceOf(i.productId) ?? 0,
    quantity: i.quantity,
    qtyPromo: i.qtyPromo,
    buyQty: i.buyQty,
    getQty: i.getQty,
  }));
}
