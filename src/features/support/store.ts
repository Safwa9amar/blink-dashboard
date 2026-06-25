"use client";

import { create } from "zustand";
import type { SupportConversationRow, SupportMessageRow } from "./types";

interface SupportState {
  conversations: SupportConversationRow[];
  messagesByConversation: Record<string, SupportMessageRow[]>;
  setConversations: (rows: SupportConversationRow[]) => void;
  setMessages: (conversationId: string, rows: SupportMessageRow[]) => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  setConversations: (conversations) => set({ conversations }),
  setMessages: (conversationId, rows) =>
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [conversationId]: rows } })),
}));
