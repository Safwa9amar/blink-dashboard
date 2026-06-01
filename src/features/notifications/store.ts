import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SEED_CAMPAIGNS,
  SEED_TEMPLATES,
  SEED_SEGMENTS,
  SEED_INBOX,
  deriveMetrics,
  type Campaign,
  type Template,
  type Segment,
  type InboxItem,
} from "./data";
import type { ComposeDraft, NewCampaignInput } from "./types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "campaign";

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;


interface NotificationsState {
  campaigns: Campaign[];
  templates: Template[];
  segments: Segment[];
  inbox: InboxItem[];

  createCampaign: (input: NewCampaignInput) => Campaign;
  deleteCampaign: (id: string) => void;

  addTemplate: (t: Omit<Template, "id">) => void;
  updateTemplate: (id: string, patch: Partial<Omit<Template, "id">>) => void;
  deleteTemplate: (id: string) => void;

  addSegment: (s: Omit<Segment, "id">) => void;
  deleteSegment: (id: string) => void;

  pushInbox: (item: Omit<InboxItem, "id" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearInbox: () => void;

  // Transient one-shot handoff from Templates/Campaigns → the /compose route.
  // Set just before navigating, read-and-cleared once when the composer mounts.
  // Deliberately excluded from `partialize` so it never persists to localStorage.
  composeDraft: ComposeDraft | null;
  setComposeDraft: (d: ComposeDraft | null) => void;
  consumeComposeDraft: () => ComposeDraft | null;

  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      campaigns: SEED_CAMPAIGNS,
      templates: SEED_TEMPLATES,
      segments: SEED_SEGMENTS,
      inbox: SEED_INBOX,

      createCampaign: (input) => {
        const opens = input.status === "sent" ? `${Math.floor(28 + Math.random() * 44)}%` : "—";
        const campaign: Campaign = {
          id: `${slugify(input.title)}-${Math.random().toString(36).slice(2, 6)}`,
          ...input,
          opens,
          createdAt: Date.now(),
          metrics: deriveMetrics(input.reach, opens, input.status),
        };
        set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
        if (input.status === "sent") {
          get().pushInbox({
            type: input.type,
            title: "Campaign sent",
            message: `“${campaign.title}” reached ${campaign.reach.toLocaleString()} users.`,
            time: "now",
            link: `/notifications/${campaign.id}`,
          });
        }
        return campaign;
      },
      deleteCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),

      addTemplate: (t) => set((s) => ({ templates: [{ id: uid("tpl"), ...t }, ...s.templates] })),
      updateTemplate: (id, patch) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addSegment: (sg) => set((s) => ({ segments: [{ id: uid("seg"), ...sg }, ...s.segments] })),
      deleteSegment: (id) => set((s) => ({ segments: s.segments.filter((sg) => sg.id !== id) })),

      pushInbox: (item) => set((s) => ({ inbox: [{ id: uid("in"), read: false, ...item }, ...s.inbox] })),
      markRead: (id) => set((s) => ({ inbox: s.inbox.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      markAllRead: () => set((s) => ({ inbox: s.inbox.map((i) => ({ ...i, read: true })) })),
      clearInbox: () => set({ inbox: [] }),

      composeDraft: null,
      setComposeDraft: (d) => set({ composeDraft: d }),
      consumeComposeDraft: () => {
        const d = get().composeDraft;
        if (d) set({ composeDraft: null });
        return d;
      },

      reset: () =>
        set({ campaigns: SEED_CAMPAIGNS, templates: SEED_TEMPLATES, segments: SEED_SEGMENTS, inbox: SEED_INBOX }),
    }),
    {
      name: "blink-notifications",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        campaigns: s.campaigns,
        templates: s.templates,
        segments: s.segments,
        inbox: s.inbox,
      }),
    }
  )
);

// Manual, post-mount rehydration so the SSR/first client render matches the
// in-memory seed (avoids hydration mismatch); localStorage is read in an effect.
let rehydrated = false;
export function useHydrateNotifications() {
  useEffect(() => {
    if (!rehydrated) {
      rehydrated = true;
      void useNotificationsStore.persist.rehydrate();
    }
  }, []);
}

export const selectUnreadCount = (s: NotificationsState) => s.inbox.filter((i) => !i.read).length;
