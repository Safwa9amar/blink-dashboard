import { create } from "zustand";
import { createNews, deleteNews, togglePin as togglePinAction, updateNews } from "@/app/d/news/action";
import { localToIso, postToInsert, primaryOf, rand, rowToPost, shortDate } from "./data";
import type { NewPostInput, NewsInsert, NewsRow, Post } from "./types";

// Posts are persisted in Supabase (the `news` table). This store holds the
// client-side copy: it's hydrated from the server fetch (see NewsClient) and each
// mutation updates locally for snappy UX while a server action writes through.
// NOTE: covers / inline body images are still data-URLs in the compose form —
// uploading them to Supabase Storage / Vercel Blob and persisting only URLs is a
// follow-up. The trilingual content (en/fr/ar title + summary + body) IS persisted
// in the row's `content` JSONB.

type MutationResult = { error: string | null };

interface NewsState {
  posts: Post[];
  createPost: (input: NewPostInput) => Promise<MutationResult>;
  updatePost: (id: string, patch: Partial<Post>) => Promise<MutationResult>;
  deletePost: (id: string) => void;
  duplicatePost: (id: string) => void;
  togglePin: (id: string) => void;
}

// Seeding uses the built-in `useNewsStore.setState({ posts })` (see NewsClient) —
// no custom `hydrate` action, so it can't go missing across an HMR reload.
export const useNewsStore = create<NewsState>((set, get) => ({
  posts: [],

  createPost: (input) => {
    // Optimistic insert with a temp id, reconciled with the real row on success.
    const primary = primaryOf(input.content);
    const tempId = `temp-${rand()}`;
    const optimistic: Post = {
      id: tempId,
      title: primary.title,
      sum: primary.sum,
      cat: input.cat,
      cover: input.cover,
      roles: input.roles,
      status: input.status,
      pin: input.pin,
      views: 0,
      ctr: "—",
      date: input.status === "scheduled" ? shortDate(input.scheduledAt) : "now",
      content: input.content,
      cta: input.cta,
      push: input.push,
      scheduledAt: input.scheduledAt,
      expiresAt: input.expiresAt,
    };
    set((s) => ({ posts: [optimistic, ...s.posts] }));

    return createNews(postToInsert(input)).then((res) => {
      if (res.row) {
        const real = rowToPost(res.row as NewsRow);
        set((s) => ({ posts: s.posts.map((p) => (p.id === tempId ? real : p)) }));
        return { error: null };
      }
      set((s) => ({ posts: s.posts.filter((p) => p.id !== tempId) })); // revert
      if (res.error) console.error("createNews failed:", res.error);
      return { error: res.error ?? "Failed to create post" };
    });
  },

  updatePost: (id, patch) => {
    const prev = get().posts;
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

    // Map the UI patch → DB columns (title/sum live inside `content`, so skip them).
    const dbPatch: Partial<NewsInsert> = {};
    if (patch.pin !== undefined) dbPatch.pinned = patch.pin;
    if (patch.cat !== undefined) dbPatch.category = patch.cat;
    if (patch.cover !== undefined) dbPatch.cover_url = patch.cover;
    if (patch.roles !== undefined) dbPatch.target_roles = patch.roles;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.content !== undefined) {
      dbPatch.content_eng = patch.content.en ?? null;
      dbPatch.content_fr = patch.content.fr ?? null;
      dbPatch.content_ar = patch.content.ar ?? null;
    }
    if (patch.push !== undefined) dbPatch.push = patch.push;
    if (patch.cta !== undefined) dbPatch.cta_label = patch.cta;
    if (patch.scheduledAt !== undefined) dbPatch.scheduled_at = localToIso(patch.scheduledAt);
    if (patch.expiresAt !== undefined) dbPatch.expires_at = localToIso(patch.expiresAt);
    if (Object.keys(dbPatch).length === 0) return Promise.resolve({ error: null });

    return updateNews(id, dbPatch).then((res) => {
      if (res.error) {
        set({ posts: prev }); // revert
        console.error("updateNews failed:", res.error);
        return { error: res.error };
      }
      return { error: null };
    });
  },

  deletePost: (id) => {
    const prev = get().posts;
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
    deleteNews(id).then((res) => {
      if (res.error) {
        set({ posts: prev }); // revert
        console.error("deleteNews failed:", res.error);
      }
    });
  },

  duplicatePost: (id) => {
    const src = get().posts.find((p) => p.id === id);
    if (!src) return;
    // Start a clean draft; tag the primary-language title with "(copy)".
    const base = src.content ?? { en: { title: src.title, sum: src.sum, body: "" } };
    const content = structuredClone(base);
    const first = (["en", "fr", "ar"] as const).find((l) => content[l]?.title.trim());
    if (first && content[first]) content[first] = { ...content[first]!, title: `${content[first]!.title} (copy)` };

    get().createPost({
      content,
      cat: src.cat,
      cover: src.cover,
      roles: src.roles,
      status: "draft",
      pin: false,
      push: src.push ?? false,
      cta: src.cta ?? "",
    });
  },

  togglePin: (id) => {
    const cur = get().posts.find((p) => p.id === id);
    const next = !cur?.pin;
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, pin: next } : p)) }));
    togglePinAction(id, next).then((res) => {
      if (res.error) {
        set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, pin: !next } : p)) }));
        console.error("togglePin failed:", res.error);
      }
    });
  },
}));
