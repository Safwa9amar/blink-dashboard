"use client";

import { create } from "zustand";
import type { SupportConversationRow, SupportMessageRow } from "./types";

interface SupportState {
  // Active inbox (waiting + assigned).
  conversations: SupportConversationRow[];
  // Resolved conversations kept for the History tab.
  historyConversations: SupportConversationRow[];
  messagesByConversation: Record<string, SupportMessageRow[]>;
  setConversations: (rows: SupportConversationRow[]) => void;
  setHistory: (rows: SupportConversationRow[]) => void;
  setMessages: (conversationId: string, rows: SupportMessageRow[]) => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  conversations: [],
  historyConversations: [],
  messagesByConversation: {},
  setConversations: (conversations) => set({ conversations }),
  setHistory: (historyConversations) => set({ historyConversations }),
  setMessages: (conversationId, rows) =>
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [conversationId]: rows } })),
}));
