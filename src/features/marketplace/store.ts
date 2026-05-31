import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SEED_STORES,
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  type Store,
  type Product,
  type Category,
} from "./data";
import type { NewStoreInput, NewProductInput, NewCategoryInput } from "./types";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

interface MarketplaceState {
  stores: Store[];
  products: Product[];
  categories: Category[];

  addStore: (input: NewStoreInput) => Store;
  updateStore: (id: string, patch: Partial<NewStoreInput>) => void;
  deleteStore: (id: string) => void; // also deletes its products

  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: string, patch: Partial<NewProductInput>) => void;
  deleteProduct: (id: string) => void;

  addCategory: (input: NewCategoryInput) => Category;
  updateCategory: (id: string, patch: Partial<NewCategoryInput>) => void;
  deleteCategory: (id: string) => void;

  reset: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set) => ({
      stores: SEED_STORES,
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,

      addStore: (input) => {
        const store: Store = { id: uid("store"), productCount: 0, createdAt: Date.now(), ...input };
        set((s) => ({ stores: [store, ...s.stores] }));
        return store;
      },
      updateStore: (id, patch) =>
        set((s) => ({ stores: s.stores.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteStore: (id) =>
        set((s) => ({
          stores: s.stores.filter((x) => x.id !== id),
          products: s.products.filter((p) => p.storeId !== id),
        })),

      addProduct: (input) => {
        const product: Product = { id: uid("prod"), createdAt: Date.now(), ...input };
        set((s) => ({
          products: [product, ...s.products],
          stores: s.stores.map((st) =>
            st.id === input.storeId ? { ...st, productCount: st.productCount + 1 } : st
          ),
        }));
        return product;
      },
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteProduct: (id) =>
        set((s) => {
          const prod = s.products.find((p) => p.id === id);
          return {
            products: s.products.filter((x) => x.id !== id),
            stores: prod
              ? s.stores.map((st) =>
                  st.id === prod.storeId ? { ...st, productCount: Math.max(0, st.productCount - 1) } : st
                )
              : s.stores,
          };
        }),

      addCategory: (input) => {
        const category: Category = { id: uid("cat"), storeCount: 0, createdAt: Date.now(), ...input };
        set((s) => ({ categories: [category, ...s.categories] }));
        return category;
      },
      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),

      reset: () => set({ stores: SEED_STORES, products: SEED_PRODUCTS, categories: SEED_CATEGORIES }),
    }),
    {
      name: "blink-marketplace",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ stores: s.stores, products: s.products, categories: s.categories }),
    }
  )
);

let rehydrated = false;
export function useHydrateMarketplace() {
  useEffect(() => {
    if (!rehydrated) {
      rehydrated = true;
      void useMarketplaceStore.persist.rehydrate();
    }
  }, []);
}
