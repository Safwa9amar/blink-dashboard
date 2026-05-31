import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_CATALOG } from "./data";
import { normalize } from "./processing";
import type { DeepLinkRoute, ImportResult, RawDeepLinkFile } from "./types";

interface DeepLinksState {
  scheme: string;
  routes: DeepLinkRoute[];
  importedAt: number | null;
  source: string | null;
  /** Parse + validate + normalize an imported catalog file, replacing the current one. */
  importFromText: (text: string, source?: string) => ImportResult;
  reset: () => void;
}

export const useDeepLinksStore = create<DeepLinksState>()(
  persist(
    (set) => ({
      scheme: SEED_CATALOG.scheme,
      routes: SEED_CATALOG.routes,
      importedAt: null,
      source: null,

      importFromText: (text, source) => {
        let parsed: RawDeepLinkFile;
        try {
          parsed = JSON.parse(text);
        } catch {
          return { ok: false, count: 0, error: "invalid_json" };
        }
        if (!parsed || !Array.isArray(parsed.routes)) {
          return { ok: false, count: 0, error: "no_routes" };
        }
        const routes = normalize(parsed);
        if (!routes.length) return { ok: false, count: 0, error: "no_routes" };
        const scheme = parsed.scheme ?? "blink";
        set({ scheme, routes, importedAt: Date.now(), source: source ?? null });
        return { ok: true, count: routes.length, scheme };
      },

      reset: () =>
        set({ scheme: SEED_CATALOG.scheme, routes: SEED_CATALOG.routes, importedAt: null, source: null }),
    }),
    {
      name: "blink-deeplinks",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ scheme: s.scheme, routes: s.routes, importedAt: s.importedAt, source: s.source }),
    }
  )
);

let rehydrated = false;
export function useHydrateDeepLinks() {
  useEffect(() => {
    if (!rehydrated) {
      rehydrated = true;
      void useDeepLinksStore.persist.rehydrate();
    }
  }, []);
}
