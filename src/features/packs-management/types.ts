import type { Variant } from "@/components/ui";

export type TFn = (k: string, v?: Record<string, string | number>) => string;

export type PackStatus = "active" | "reviewing" | "inactive" | "archived";

export interface PackProduct {
  id: string;
  name: string;
  price: number; // DZD per unit
}

export interface PackItem {
  product: PackProduct;
  quantity: number;
  qtyPromoEnabled: boolean;
  buyQty: number;
  getQty: number;
}

export interface Pack {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  imageUrl?: string;
  items: PackItem[];
  discountPercent: number; // 0-100
  freeDelivery: boolean;
  status: PackStatus;
  analysisAngle?: string; // for AI suggested packs
  createdAt: number;
}

export const PACK_STATUS: Record<PackStatus, Variant> = {
  active: "success",
  reviewing: "warning",
  inactive: "default",
  archived: "default",
};

export const PACK_STATUS_KEYS: PackStatus[] = ["active", "reviewing", "inactive", "archived"];

export const STANDARD_DELIVERY_FEE = 150; // DZD

export function packOriginalPrice(items: PackItem[]): number {
  return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

export function packDiscountAmount(pack: Pack): number {
  return Math.round((packOriginalPrice(pack.items) * pack.discountPercent) / 100);
}

export function packFinalPrice(pack: Pack): number {
  return packOriginalPrice(pack.items) - packDiscountAmount(pack);
}
