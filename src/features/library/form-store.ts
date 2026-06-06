import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { emptyLang } from "@/components/ui";
import type {
  LibraryCategory,
  LibraryProduct,
  NewLibraryCategoryInput,
  NewLibraryProductInput,
} from "./types";

// Blank form values (functions so each draft gets a fresh object/record).
export const EMPTY_PRODUCT = (): NewLibraryProductInput => ({
  name: emptyLang(),
  description: emptyLang(),
  barcode: "",
  brand: "",
  category: "",
  unit: "",
  photos: [],
  status: "draft",
});

export const EMPTY_CATEGORY = (): NewLibraryCategoryInput => ({
  name: emptyLang(),
  slug: "",
  icon: "square.grid.2x2.fill", // SF-Symbol name (see cat-icons.ts) — renders in app + dashboard
  status: "active",
  sortOrder: 0,
});

// Seed values for the form: a blank draft for "new", or the entity's current
// values for "edit" (with every language slot present so LangTabs binds cleanly).
export const productToInput = (p: LibraryProduct | null): NewLibraryProductInput =>
  p
    ? {
        name: { ...emptyLang(), ...p.name },
        description: { ...emptyLang(), ...p.description },
        barcode: p.barcode,
        brand: p.brand,
        category: p.category,
        unit: p.unit,
        photos: p.photos,
        status: p.status,
      }
    : EMPTY_PRODUCT();

export const categoryToInput = (c: LibraryCategory | null): NewLibraryCategoryInput =>
  c
    ? {
        name: { ...emptyLang(), ...c.name },
        slug: c.slug,
        icon: c.icon,
        status: c.status,
        sortOrder: c.sortOrder,
      }
    : EMPTY_CATEGORY();

// A draft is tagged with the target it belongs to ("new" or an entity id) so an
// in-progress "add" draft and an "edit" draft never clobber each other, and a
// half-filled form survives navigation / refresh within the browser session.
interface Draft<T> {
  key: string | null;
  data: T;
}

interface LibraryFormState {
  product: Draft<NewLibraryProductInput>;
  category: Draft<NewLibraryCategoryInput>;
  // Seed the slot for `key` only when switching targets — resuming the same target
  // keeps the persisted draft untouched.
  seedProduct: (key: string, seed: NewLibraryProductInput) => void;
  setProductDraft: (data: NewLibraryProductInput) => void;
  clearProduct: () => void;
  seedCategory: (key: string, seed: NewLibraryCategoryInput) => void;
  setCategoryDraft: (data: NewLibraryCategoryInput) => void;
  clearCategory: () => void;
}

export const useLibraryFormStore = create<LibraryFormState>()(
  persist(
    (set, get) => ({
      product: { key: null, data: EMPTY_PRODUCT() },
      category: { key: null, data: EMPTY_CATEGORY() },

      seedProduct: (key, seed) => {
        if (get().product.key !== key) set({ product: { key, data: seed } });
      },
      setProductDraft: (data) => set((s) => ({ product: { ...s.product, data } })),
      clearProduct: () => set({ product: { key: null, data: EMPTY_PRODUCT() } }),

      seedCategory: (key, seed) => {
        if (get().category.key !== key) set({ category: { key, data: seed } });
      },
      setCategoryDraft: (data) => set((s) => ({ category: { ...s.category, data } })),
      clearCategory: () => set({ category: { key: null, data: EMPTY_CATEGORY() } }),
    }),
    {
      name: "blink-library-form",
      // Drafts live for the browser session only — cleared when the tab closes.
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    }
  )
);
