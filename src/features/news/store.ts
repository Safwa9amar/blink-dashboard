import { create } from "zustand";
import type { Lang } from "@/components/ui";
import { POSTS } from "./data";
import type { Post, PostContent, NewPostInput } from "./types";

// NOTE: this store is intentionally in-memory (no `persist`, unlike the
// notifications store). Covers and inline body images are stored as data-URLs,
// which would quickly exceed the ~5MB localStorage quota. A production build
// would upload media to Supabase Storage / Vercel Blob and persist only URLs.

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "post";

const rand = () => Math.random().toString(36).slice(2, 6);

const LANG_ORDER: Lang[] = ["en", "fr", "ar"];

// Pick the primary (admin-list) content: first language that has a title.
function primaryOf(content: Partial<Record<Lang, PostContent>>): PostContent {
  for (const l of LANG_ORDER) {
    const c = content[l];
    if (c && c.title.trim()) return c;
  }
  return { title: "Untitled post", sum: "", body: "" };
}

// Short date label (e.g. "Jun 1") from a datetime-local string.
function shortDate(iso?: string): string {
  if (!iso) return "now";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "now";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NewsState {
  posts: Post[];
  createPost: (input: NewPostInput) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  duplicatePost: (id: string) => void;
  togglePin: (id: string) => void;
  reset: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  posts: POSTS,

  createPost: (input) => {
    const primary = primaryOf(input.content);
    const post: Post = {
      id: `${slugify(primary.title)}-${rand()}`,
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
    set((s) => ({ posts: [post, ...s.posts] }));
    return post;
  },

  updatePost: (id, patch) =>
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

  duplicatePost: (id) => {
    const src = get().posts.find((p) => p.id === id);
    if (!src) return;
    const copy: Post = {
      ...src,
      id: `${slugify(src.title)}-${rand()}`,
      title: `${src.title} (copy)`,
      status: "draft",
      pin: false,
      views: 0,
      ctr: "—",
      date: "now",
      // A duplicate starts as a clean draft — don't carry over the source's schedule.
      scheduledAt: undefined,
      expiresAt: undefined,
    };
    set((s) => ({ posts: [copy, ...s.posts] }));
  },

  togglePin: (id) =>
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, pin: !p.pin } : p)) })),

  reset: () => set({ posts: POSTS }),
}));
