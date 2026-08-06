"use client";

import { create } from "zustand";
import type { EmailMessageRow, EmailThreadRow } from "./types";

// Client-side inbox state. `threads` is seeded server-side (admin read) and kept
// live by the route's store-seeder (Realtime → router.refresh). Per-thread
// messages are fetched lazily on select and appended via a Realtime subscription
// — mirrors the support live-chat store.
interface EmailState {
  threads: EmailThreadRow[];
  messagesByThread: Record<string, EmailMessageRow[]>;
  setThreads: (rows: EmailThreadRow[]) => void;
  setMessages: (threadId: string, rows: EmailMessageRow[]) => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  threads: [],
  messagesByThread: {},
  setThreads: (threads) => set({ threads }),
  setMessages: (threadId, rows) =>
    set((s) => ({ messagesByThread: { ...s.messagesByThread, [threadId]: rows } })),
}));
