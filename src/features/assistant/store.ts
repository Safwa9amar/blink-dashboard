import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

// UI state only. `open` + `threadId` are remembered per browser (localStorage, guarded).
interface AssistantUiState {
  open: boolean;
  historyOpen: boolean;
  threadId: string | null;
  /** A reply finished while the panel was closed. */
  unread: boolean;
  /** A confirm modal is open inside the panel (Escape belongs to it). */
  confirmOpen: boolean;
  setConfirmOpen: (v: boolean) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setHistoryOpen: (v: boolean) => void;
  setThreadId: (id: string | null) => void;
  setUnread: (v: boolean) => void;
}

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const useAssistantStore = create<AssistantUiState>()(
  persist(
    (set) => ({
      open: false,
      historyOpen: false,
      threadId: null,
      unread: false,
      confirmOpen: false,
      setConfirmOpen: (confirmOpen) => set({ confirmOpen }),
      setOpen: (open) => set((s) => ({ open, unread: open ? false : s.unread, historyOpen: open ? s.historyOpen : false })),
      toggle: () => set((s) => ({ open: !s.open, unread: s.open ? s.unread : false, historyOpen: false })),
      setHistoryOpen: (historyOpen) => set({ historyOpen }),
      setThreadId: (threadId) => set({ threadId }),
      setUnread: (unread) => set({ unread }),
    }),
    {
      name: "blink-assistant-ui",
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ open: s.open, threadId: s.threadId }),
      skipHydration: true, // rehydrated in an effect so SSR markup matches
    }
  )
);
