export type {
  TFn,
  PackStatus,
  PackProduct,
  PackItem,
  Pack,
} from "./types";
export {
  PACK_STATUS,
  PACK_STATUS_KEYS,
  STANDARD_DELIVERY_FEE,
  packOriginalPrice,
  packDiscountAmount,
  packFinalPrice,
} from "./types";

import type { Pack } from "./types";

export const SEED_PACKS: Pack[] = [
  {
    id: "pack-1",
    storeId: "store-1",
    storeName: "Bab Ezzouar Market",
    name: "Weekend Family Pack",
    items: [
      { product: { id: "p1", name: "Coca-Cola 1L", price: 120 }, quantity: 3, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
      { product: { id: "p2", name: "Pain Tradition", price: 30 }, quantity: 5, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
      { product: { id: "p3", name: "Lait Candia 1L", price: 90 }, quantity: 2, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 15,
    freeDelivery: false,
    status: "active",
    createdAt: Date.now() - 604800000,
  },
  {
    id: "pack-2",
    storeId: "store-1",
    storeName: "Bab Ezzouar Market",
    name: "Breakfast Essentials",
    items: [
      { product: { id: "p2", name: "Pain Tradition", price: 30 }, quantity: 4, qtyPromoEnabled: true, buyQty: 3, getQty: 1 },
      { product: { id: "p3", name: "Lait Candia 1L", price: 90 }, quantity: 2, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 0,
    freeDelivery: false,
    status: "active",
    createdAt: Date.now() - 432000000,
  },
  {
    id: "pack-3",
    storeId: "store-2",
    storeName: "Hydra Express",
    name: "Dairy Bundle",
    items: [
      { product: { id: "p3", name: "Lait Candia 1L", price: 90 }, quantity: 4, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
      { product: { id: "p7", name: "Yaourt Danone x12", price: 500 }, quantity: 1, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 10,
    freeDelivery: true,
    status: "active",
    createdAt: Date.now() - 259200000,
  },
  {
    id: "pack-4",
    storeId: "store-3",
    storeName: "Kouba Superette",
    name: "Fresh Morning Pack",
    items: [
      { product: { id: "p2", name: "Pain Tradition", price: 30 }, quantity: 6, qtyPromoEnabled: true, buyQty: 5, getQty: 1 },
      { product: { id: "p8", name: "Eau Ifri 1.5L", price: 45 }, quantity: 3, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 5,
    freeDelivery: true,
    status: "reviewing",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "pack-5",
    storeId: "store-4",
    storeName: "Oran Centre",
    name: "Summer Refresh",
    items: [
      { product: { id: "p1", name: "Coca-Cola 1L", price: 120 }, quantity: 4, qtyPromoEnabled: true, buyQty: 3, getQty: 1 },
      { product: { id: "p6", name: "Pepsi 2L", price: 160 }, quantity: 2, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 12,
    freeDelivery: true,
    status: "reviewing",
    createdAt: Date.now() - 43200000,
  },
  {
    id: "pack-6",
    storeId: "store-1",
    storeName: "Bab Ezzouar Market",
    name: "Back to School",
    items: [
      { product: { id: "p8", name: "Eau Ifri 1.5L", price: 45 }, quantity: 6, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
    ],
    discountPercent: 10,
    freeDelivery: false,
    status: "inactive",
    createdAt: Date.now() - 2592000000,
  },
  {
    id: "pack-7",
    storeId: "store-5",
    storeName: "Constantine Market",
    name: "Pantry Saver",
    items: [
      { product: { id: "p4", name: "Huile Elio 5L", price: 980 }, quantity: 1, qtyPromoEnabled: false, buyQty: 0, getQty: 0 },
      { product: { id: "p2", name: "Pain Tradition", price: 30 }, quantity: 10, qtyPromoEnabled: true, buyQty: 8, getQty: 2 },
    ],
    discountPercent: 8,
    freeDelivery: false,
    status: "archived",
    createdAt: Date.now() - 5184000000,
  },
];

export function derivePackStats(packs: Pack[]) {
  return {
    total: packs.length,
    active: packs.filter((p) => p.status === "active").length,
    reviewing: packs.filter((p) => p.status === "reviewing").length,
    freeDelivery: packs.filter((p) => p.freeDelivery).length,
  };
}
