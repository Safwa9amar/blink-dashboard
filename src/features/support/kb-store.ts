"use client";

import { create } from "zustand";
import type { SupportArticleRow, SupportCategoryRow } from "./types";

// Knowledge Base / FAQ client store. Hydrated from the server fetch in the
// support layout (KbStoreSeeder) and kept fresh by a postgres_changes
// subscription that calls router.refresh(). Mirrors useNewsStore / useSupportStore
// — seeding uses the built-in setState so it survives HMR.
interface KbState {
  articles: SupportArticleRow[];
  categories: SupportCategoryRow[];
  setArticles: (rows: SupportArticleRow[]) => void;
  setCategories: (rows: SupportCategoryRow[]) => void;
}

export const useKbStore = create<KbState>((set) => ({
  articles: [],
  categories: [],
  setArticles: (articles) => set({ articles }),
  setCategories: (categories) => set({ categories }),
}));
