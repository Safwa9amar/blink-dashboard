"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServerInstance } from "./instances";

// Which backend instance the Blink Server monitoring tabs (AI Log + Live Logs)
// poll — shared across both tabs and persisted to localStorage. The instance keys
// + type live in ./instances (pure, server-safe); this client store holds the
// current selection.
interface InstanceState {
  instance: ServerInstance;
  setInstance: (i: ServerInstance) => void;
}

export const useServerInstanceStore = create<InstanceState>()(
  persist(
    (set) => ({
      instance: "online", // preserves the prior default (prod API)
      setInstance: (instance) => set({ instance }),
    }),
    {
      name: "blink-server-instance",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// Manual, post-mount rehydration so SSR/first client render matches the default
// ("online") and avoids a hydration mismatch; localStorage is read in an effect.
let rehydrated = false;
export function useHydrateServerInstance() {
  useEffect(() => {
    if (!rehydrated) {
      rehydrated = true;
      void useServerInstanceStore.persist.rehydrate();
    }
  }, []);
}
