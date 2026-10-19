import { describe, expect, it } from "vitest";
import {
  PACK_LIMITS,
  draftLines,
  emptyDraft,
  hasDraftErrors,
  isImageUrl,
  newDraftItem,
  packDraftBody,
  packToDraft,
  packUpdatePatch,
  validatePackDraft,
} from "./draft";
import { pricePack } from "./pricing";
import type { Pack, PackDraft, PackItem } from "./types";

const P1 = "22222222-2222-4222-8222-222222222222";
const P2 = "33333333-3333-4333-8333-333333333333";

const valid = (over: Partial<PackDraft> = {}): PackDraft => ({
  ...emptyDraft(),
  name: "Breakfast box",
  items: [newDraftItem(P1)],
  ...over,
});

describe("validatePackDraft — create", () => {
  it("accepts a minimal pack", () => {
    expect(validatePackDraft(valid(), "create")).toEqual({});
  });
  it("requires a name and caps it at 80 after trimming", () => {
    expect(validatePackDraft(valid({ name: "   " }), "create").name).toBe("name_required");
    expect(validatePackDraft(valid({ name: "x".repeat(81) }), "create").name).toBe("name_too_long");
    expect(validatePackDraft(valid({ name: `  ${"x".repeat(80)}  ` }), "create").name).toBeUndefined();
  });
  it("caps the description at 500", () => {
    expect(validatePackDraft(valid({ description: "d".repeat(501) }), "create").description).toBe(
      "description_too_long"
    );
    expect(validatePackDraft(valid({ description: "d".repeat(500) }), "create").description).toBeUndefined();
  });
  it("needs 1..30 items with unique valid product ids", () => {
    expect(validatePackDraft(valid({ items: [] }), "create").items).toBe("items_required");
    const many = Array.from({ length: PACK_LIMITS.itemsMax + 1 }, (_, i) =>
      newDraftItem(`22222222-2222-4222-8222-${String(i).padStart(12, "0")}`)
    );
    expect(validatePackDraft(valid({ items: many }), "create").items).toBe("items_too_many");
    const dup = validatePackDraft(valid({ items: [newDraftItem(P1), newDraftItem(P1)] }), "create");
    expect(dup.items).toBe("items_duplicate");
    expect(dup.lines?.[P1]).toBe("items_duplicate");
    expect(validatePackDraft(valid({ items: [newDraftItem("not-a-uuid")] }), "create").items).toBe("items_invalid");
  });
  it("checks quantities and buy-X-get-Y counts per line", () => {
    const q0 = validatePackDraft(valid({ items: [{ ...newDraftItem(P1), quantity: 0 }] }), "create");
    expect(q0.lines?.[P1]).toBe("quantity_range");
    const q1000 = validatePackDraft(valid({ items: [{ ...newDraftItem(P1), quantity: 1000 }] }), "create");
    expect(q1000.lines?.[P1]).toBe("quantity_range");
    const frac = validatePackDraft(valid({ items: [{ ...newDraftItem(P1), quantity: 1.5 }] }), "create");
    expect(frac.lines?.[P1]).toBe("quantity_range");
    const promo = validatePackDraft(
      valid({ items: [{ ...newDraftItem(P1), qtyPromo: true, buyQty: 0, getQty: 1 }] }),
      "create"
    );
    expect(promo.lines?.[P1]).toBe("promo_range");
    // Counts don't matter while the promo is off.
    const off = validatePackDraft(valid({ items: [{ ...newDraftItem(P1), buyQty: 0, getQty: 0 }] }), "create");
    expect(off).toEqual({});
  });
  it("keeps the discount within 0..90 (whole percent)", () => {
    expect(validatePackDraft(valid({ discountPercent: 91 }), "create").discount).toBe("discount_range");
    expect(validatePackDraft(valid({ discountPercent: -1 }), "create").discount).toBe("discount_range");
    expect(validatePackDraft(valid({ discountPercent: 12.5 }), "create").discount).toBe("discount_range");
    expect(validatePackDraft(valid({ discountEnabled: true, discountPercent: 90 }), "create")).toEqual({});
  });
  it("only lets a new pack start active or inactive", () => {
    expect(validatePackDraft(valid({ status: "inactive" }), "create")).toEqual({});
    expect(validatePackDraft(valid({ status: "archived" }), "create").status).toBe("status_invalid");
    expect(validatePackDraft(valid({ status: "under_review" }), "create").status).toBe("status_invalid");
  });
  it("only takes http(s) image URLs", () => {
    expect(validatePackDraft(valid({ image: "https://x.supabase.co/a.jpg" }), "create")).toEqual({});
    expect(validatePackDraft(valid({ image: "javascript:alert(1)" }), "create").image).toBe("image_invalid");
    expect(isImageUrl("not a url")).toBe(false);
  });
  it("survives garbage from the browser", () => {
    const errors = validatePackDraft(
      { name: 42, items: [null, "x"], discountPercent: "10" } as unknown as Partial<PackDraft>,
      "create"
    );
    expect(errors.name).toBe("name_required");
    expect(errors.items).toBe("items_invalid");
    expect(errors.discount).toBe("discount_range");
  });
});

describe("validatePackDraft — update", () => {
  it("checks only the fields sent", () => {
    expect(validatePackDraft({ freeDelivery: true }, "update")).toEqual({});
    expect(validatePackDraft({ name: "" }, "update").name).toBe("name_required");
    expect(validatePackDraft({ items: [] }, "update").items).toBe("items_required");
  });
  it("allows archiving but never sending under_review", () => {
    expect(validatePackDraft({ status: "archived" }, "update")).toEqual({});
    expect(validatePackDraft({ status: "under_review" }, "update").status).toBe("status_invalid");
  });
});

describe("hasDraftErrors", () => {
  it("counts line errors too", () => {
    expect(hasDraftErrors({})).toBe(false);
    expect(hasDraftErrors({ lines: {} })).toBe(false);
    expect(hasDraftErrors({ lines: { [P1]: "quantity_range" } })).toBe(true);
    expect(hasDraftErrors({ name: "name_required" })).toBe(true);
  });
});

describe("packDraftBody", () => {
  it("trims text, nulls empty text and always sends buy / get counts", () => {
    const body = packDraftBody(
      valid({
        name: "  Box  ",
        description: "   ",
        image: "",
        items: [{ productId: P1, quantity: 2, qtyPromo: false, buyQty: 0, getQty: 0 }],
        discountEnabled: true,
        discountPercent: 20,
        freeDelivery: true,
        status: "inactive",
      })
    );
    expect(body).toEqual({
      name: "Box",
      description: null,
      image: null,
      items: [{ product_id: P1, quantity: 2, qty_promo_enabled: false, buy_qty: 2, get_qty: 1 }],
      discount_enabled: true,
      discount_percent: 20,
      free_delivery: true,
      status: "inactive",
    });
  });
  it("never sends under_review and only sends the fields present", () => {
    expect(packDraftBody({ status: "under_review" })).toEqual({});
    expect(packDraftBody({ freeDelivery: false })).toEqual({ free_delivery: false });
  });
  it("never swaps a live promo's counts for the defaults", () => {
    const body = packDraftBody({
      items: [
        { productId: P1, quantity: 4, qtyPromo: true, buyQty: 0, getQty: 1 },
        { productId: P2, quantity: 4, qtyPromo: true, buyQty: 3, getQty: 2 },
      ],
    });
    expect(body.items).toEqual([
      { product_id: P1, quantity: 4, qty_promo_enabled: true, buy_qty: 0, get_qty: 1 },
      { product_id: P2, quantity: 4, qty_promo_enabled: true, buy_qty: 3, get_qty: 2 },
    ]);
  });
});

describe("packUpdatePatch", () => {
  const base = valid({ status: "under_review", description: "Hello" });
  it("is empty when nothing meaningful changed", () => {
    expect(packUpdatePatch(base, { ...base, name: " Breakfast box ", description: "Hello " })).toEqual({});
  });
  it("carries only the changed fields", () => {
    const patch = packUpdatePatch(base, {
      ...base,
      name: "Lunch box",
      items: [newDraftItem(P1), newDraftItem(P2)],
      freeDelivery: true,
    });
    expect(Object.keys(patch).sort()).toEqual(["freeDelivery", "items", "name"]);
  });
  it("sends a status only when staff picked another one", () => {
    expect(packUpdatePatch(base, { ...base }).status).toBeUndefined();
    expect(packUpdatePatch(base, { ...base, status: "active" }).status).toBe("active");
  });
});

describe("packToDraft", () => {
  const packWith = (items: PackItem[]) =>
    ({
      name: "Box",
      description: null,
      image: null,
      items,
      discountEnabled: false,
      discountPercentRaw: 15,
      freeDelivery: true,
      status: "inactive",
    }) as unknown as Pack;
  const line = (over: Partial<PackItem>) =>
    ({ productId: P1, quantity: 3, qtyPromo: false, buyQty: 0, getQty: 0, ...over }) as PackItem;

  it("keeps stored values and defaults unset promo counts on a line whose promo is off", () => {
    expect(packToDraft(packWith([line({})]))).toEqual({
      name: "Box",
      description: "",
      image: "",
      items: [{ productId: P1, quantity: 3, qtyPromo: false, buyQty: 2, getQty: 1 }],
      discountEnabled: false,
      discountPercent: 15,
      freeDelivery: true,
      status: "inactive",
    });
  });

  describe("a live promo with a count below 1", () => {
    const pack = packWith([
      line({ productId: P1, quantity: 4, qtyPromo: true, buyQty: 0, getQty: 1 }),
      line({ productId: P2, quantity: 4, qtyPromo: true, buyQty: 2, getQty: 0 }),
    ]);
    const draft = packToDraft(pack);

    it("keeps the stored counts", () => {
      expect(draft.items).toEqual([
        { productId: P1, quantity: 4, qtyPromo: true, buyQty: 0, getQty: 1 },
        { productId: P2, quantity: 4, qtyPromo: true, buyQty: 2, getQty: 0 },
      ]);
    });
    it("gives no free units, like blink-server's pricing", () => {
      expect(pricePack(draftLines(draft.items, () => 100), false, 0).freeCount).toBe(0);
    });
    it("is flagged per line once the items are saved", () => {
      const errors = validatePackDraft({ items: draft.items }, "update");
      expect(errors.lines).toEqual({ [P1]: "promo_range", [P2]: "promo_range" });
      expect(hasDraftErrors(errors)).toBe(true);
    });
    it("is never rewritten by an edit that leaves the items alone", () => {
      expect(packUpdatePatch(draft, { ...draft })).toEqual({});
      expect(packUpdatePatch(draft, { ...draft, name: "Big box" })).toEqual({ name: "Big box" });
    });
  });
});

describe("draftLines", () => {
  it("prices lines with live prices, 0 for unknown products", () => {
    const lines = draftLines(
      [
        { ...newDraftItem(P1), quantity: 2 },
        { ...newDraftItem(P2), quantity: 1 },
      ],
      (id) => (id === P1 ? 150 : undefined)
    );
    expect(pricePack(lines, true, 10)).toMatchObject({ originalPrice: 300, savings: 30, price: 270, itemCount: 3 });
  });
});
