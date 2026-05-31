import type { Variant } from "@/components/ui";
import type { Store, Product, Category, StoreStatus, ProductStatus, CategoryStatus } from "./types";

export type {
  TFn,
  StoreStatus,
  ProductStatus,
  CategoryStatus,
  Wilaya,
  Category,
  Store,
  Product,
  NewStoreInput,
  NewProductInput,
  NewCategoryInput,
} from "./types";

export const WILAYAS = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Setif", "Tlemcen"] as const;

export const STORE_STATUS: Record<StoreStatus, Variant> = {
  open: "success",
  closed: "default",
  suspended: "danger",
};
export const PRODUCT_STATUS: Record<ProductStatus, Variant> = {
  in_stock: "success",
  out_of_stock: "warning",
  hidden: "default",
};
export const CATEGORY_STATUS: Record<CategoryStatus, Variant> = {
  active: "success",
  inactive: "default",
};

export const STORE_STATUS_KEYS: StoreStatus[] = ["open", "closed", "suspended"];
export const PRODUCT_STATUS_KEYS: ProductStatus[] = ["in_stock", "out_of_stock", "hidden"];
export const CATEGORY_STATUS_KEYS: CategoryStatus[] = ["active", "inactive"];

// ---- 6 categories (from the app's MarketplaceCategory list) ----
export const SEED_CATEGORIES: Category[] = [
  { id: "cat-restaurant", name: "Food", slug: "restaurant", icon: "store", color: "#FF6347", status: "active", storeCount: 4, sortOrder: 1, createdAt: 1704067200000 },
  { id: "cat-supermarket", name: "Supermarkets", slug: "supermarket", icon: "package", color: "#00BFFF", status: "active", storeCount: 2, sortOrder: 2, createdAt: 1704067200000 },
  { id: "cat-parcels", name: "Parcels", slug: "parcels", icon: "truck", color: "#17A005", status: "inactive", storeCount: 0, sortOrder: 3, createdAt: 1704067200000 },
  { id: "cat-pastry", name: "Pastry", slug: "pastry", icon: "gift", color: "#DAA520", status: "active", storeCount: 1, sortOrder: 4, createdAt: 1704067200000 },
  { id: "cat-cosmetics", name: "Cosmetics", slug: "cosmetics", icon: "star", color: "#9370DB", status: "active", storeCount: 1, sortOrder: 5, createdAt: 1704067200000 },
  { id: "cat-others", name: "Others", slug: "others", icon: "grid", color: "#808080", status: "active", storeCount: 0, sortOrder: 6, createdAt: 1704067200000 },
];

// ---- 8 stores (6 from the app + 2 plausible additions, all Algeria) ----
export const SEED_STORES: Store[] = [
  { id: "store-1", name: "Blink Burger", categoryId: "cat-restaurant", status: "open", wilaya: "Alger", location: "Hydra - Alger", rating: 4.8, reviewCount: 340, deliveryFee: 0, minOrder: 1000, deliveryTime: "15-25 min", openingHours: "09:00 - 23:00", phone: "+213 555 12 34 56", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", featured: true, productCount: 3, createdAt: 1704067200000 },
  { id: "store-2", name: "Sushi Master", categoryId: "cat-restaurant", status: "open", wilaya: "Alger", location: "El Biar - Alger", rating: 4.9, reviewCount: 512, deliveryFee: 200, minOrder: 2000, deliveryTime: "20-35 min", openingHours: "11:00 - 22:30", phone: "+213 555 22 11 00", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80", featured: false, productCount: 2, createdAt: 1706745600000 },
  { id: "store-3", name: "The Salad Project", categoryId: "cat-restaurant", status: "open", wilaya: "Alger", location: "Kouba - Alger", rating: 4.5, reviewCount: 128, deliveryFee: 150, minOrder: 800, deliveryTime: "20-30 min", openingHours: "10:00 - 22:00", phone: "+213 555 33 44 55", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", featured: false, productCount: 1, createdAt: 1709251200000 },
  { id: "store-4", name: "Pizza Hub", categoryId: "cat-restaurant", status: "closed", wilaya: "Alger", location: "Bir Mourad Rais - Alger", rating: 4.3, reviewCount: 96, deliveryFee: 150, minOrder: 1000, deliveryTime: "25-40 min", openingHours: "10:00 - 23:30", phone: "+213 555 66 77 88", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", featured: false, productCount: 1, createdAt: 1711929600000 },
  { id: "store-5", name: "Supermarket Express", categoryId: "cat-supermarket", status: "open", wilaya: "Alger", location: "Said Hamdine - Alger", rating: 4.5, reviewCount: 210, deliveryFee: 250, minOrder: 1500, deliveryTime: "30-45 min", openingHours: "08:00 - 22:00", phone: "+213 555 99 00 11", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80", featured: false, productCount: 2, createdAt: 1714521600000 },
  { id: "store-6", name: "Fashion Hub", categoryId: "cat-cosmetics", status: "open", wilaya: "Oran", location: "Centre - Oran", rating: 4.8, reviewCount: 175, deliveryFee: 300, minOrder: 2000, deliveryTime: "35-50 min", openingHours: "10:00 - 20:00", phone: "+213 555 10 20 30", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80", featured: true, productCount: 2, createdAt: 1717200000000 },
  { id: "store-7", name: "Pâtisserie El Djazair", categoryId: "cat-pastry", status: "open", wilaya: "Constantine", location: "Sidi Mabrouk - Constantine", rating: 4.7, reviewCount: 88, deliveryFee: 200, minOrder: 600, deliveryTime: "20-35 min", openingHours: "08:00 - 21:00", phone: "+213 555 44 55 66", image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80", featured: false, productCount: 1, createdAt: 1719792000000 },
  { id: "store-8", name: "Daily Market", categoryId: "cat-supermarket", status: "suspended", wilaya: "Blida", location: "Centre - Blida", rating: 4.1, reviewCount: 54, deliveryFee: 200, minOrder: 1000, deliveryTime: "25-40 min", openingHours: "08:30 - 21:30", phone: "+213 555 77 88 99", image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80", featured: false, productCount: 0, createdAt: 1722470400000 },
];

// ---- 12 products (from the app's MarketplaceProduct samples) ----
export const SEED_PRODUCTS: Product[] = [
  { id: "burger_01", storeId: "store-1", title: "Cheeseburger", price: 1290, status: "in_stock", menuCategory: "burgers", rating: 4.7, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", createdAt: 1704067200000 },
  { id: "burger_02", storeId: "store-1", title: "Bacon Burger", price: 1450, status: "in_stock", menuCategory: "burgers", rating: 4.8, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&q=80", createdAt: 1704153600000 },
  { id: "burger_03", storeId: "store-1", title: "Classic Fries", price: 450, status: "out_of_stock", menuCategory: "sides", rating: 4.5, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80", createdAt: 1704240000000 },
  { id: "sushi_01", storeId: "store-2", title: "Salmon Nigiri", price: 1850, status: "in_stock", menuCategory: "sushi", rating: 4.9, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80", createdAt: 1706745600000 },
  { id: "sushi_02", storeId: "store-2", title: "Dragon Roll", price: 2400, status: "in_stock", menuCategory: "sushi", rating: 4.9, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&q=80", createdAt: 1706832000000 },
  { id: "salad_01", storeId: "store-3", title: "Caesar Salad", price: 950, status: "in_stock", menuCategory: "salads", rating: 4.4, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80", createdAt: 1709251200000 },
  { id: "pizza_01", storeId: "store-4", title: "Margherita Pizza", price: 1300, status: "out_of_stock", menuCategory: "pizza", rating: 4.3, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", createdAt: 1711929600000 },
  { id: "sm_dairy_01", storeId: "store-5", title: "Candia Milk", price: 120, status: "in_stock", menuCategory: "dairy", rating: 0, unit: "1L", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80", createdAt: 1714521600000 },
  { id: "sm_dairy_03", storeId: "store-5", title: "Cheddar Cheese Block", price: 310, status: "in_stock", menuCategory: "dairy", rating: 0, unit: "250g", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80", createdAt: 1714608000000 },
  { id: "fashion_m02", storeId: "store-6", title: "Denim Jeans", price: 5500, status: "in_stock", menuCategory: "fashion", rating: 4.7, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80", createdAt: 1717200000000 },
  { id: "cosm_08", storeId: "store-6", title: "Eau de Parfum", price: 5800, status: "hidden", menuCategory: "cosmetics", rating: 4.9, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80", createdAt: 1717286400000 },
  { id: "pastry_01", storeId: "store-7", title: "Mille-Feuille", price: 280, status: "in_stock", menuCategory: "pastry", rating: 4.7, unit: "1 pc", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80", createdAt: 1719792000000 },
];

export function deriveStats(stores: Store[], products: Product[], categories: Category[]) {
  return {
    totalStores: stores.length,
    openStores: stores.filter((s) => s.status === "open").length,
    suspendedStores: stores.filter((s) => s.status === "suspended").length,
    totalProducts: products.length,
    outOfStock: products.filter((p) => p.status === "out_of_stock").length,
    activeCategories: categories.filter((c) => c.status === "active").length,
    avgRating: stores.length ? (stores.reduce((a, s) => a + s.rating, 0) / stores.length).toFixed(1) : "0.0",
  };
}
