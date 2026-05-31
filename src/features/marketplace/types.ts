// Domain types for the marketplace feature.
export type TFn = (k: string, v?: Record<string, string | number>) => string;

// --- status enums (admin-facing; the app used booleans) ---
export type StoreStatus = "open" | "closed" | "suspended";
export type ProductStatus = "in_stock" | "out_of_stock" | "hidden";
export type CategoryStatus = "active" | "inactive";

// Algerian wilayas — structured location (free string in the app).
export type Wilaya = "Alger" | "Oran" | "Constantine" | "Annaba" | "Blida" | "Setif" | "Tlemcen";

// --- Category (top-level marketplace vertical) ---
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // DashIcon name
  color: string; // hex accent
  status: CategoryStatus;
  storeCount: number;
  sortOrder: number;
  createdAt?: number;
}

// --- Store (vendor) ---
export interface Store {
  id: string;
  name: string;
  categoryId: string; // FK -> Category.id
  status: StoreStatus;
  wilaya: Wilaya;
  location: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number; // DZD
  minOrder: number; // DZD
  deliveryTime: string;
  openingHours: string;
  phone: string;
  image: string;
  featured: boolean;
  productCount: number;
  createdAt: number;
}

// --- Product (item sold) ---
export interface Product {
  id: string;
  storeId: string; // FK -> Store.id
  title: string;
  price: number; // DZD
  status: ProductStatus;
  menuCategory: string;
  rating: number;
  unit?: string;
  image: string;
  description?: string;
  createdAt?: number;
}

// --- form input types (id-less; store assigns id + derived fields) ---
export type NewStoreInput = Omit<Store, "id" | "productCount" | "createdAt">;
export type NewProductInput = Omit<Product, "id" | "createdAt">;
export type NewCategoryInput = Omit<Category, "id" | "storeCount" | "createdAt">;
