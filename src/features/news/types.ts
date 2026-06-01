// Domain types for the news feature.
import type { Lang } from "@/components/ui";

export type PostStatus = "published" | "scheduled" | "draft";

// Full per-language content for a post. `body` is HTML (authored in the rich
// editor). The flat `title`/`sum` on Post are the admin-list display strings.
export interface PostContent {
  title: string;
  sum: string;
  body: string;
}

export interface Post {
  id: string;
  title: string;
  sum: string;
  cat: string;
  cover: string; // image URL or uploaded data-URL (was a numeric index)
  roles: string[];
  status: PostStatus;
  pin: boolean;
  views: number;
  ctr: string;
  date: string;
  // Rich authoring fields (optional on legacy seeds).
  content?: Partial<Record<Lang, PostContent>>;
  cta?: string;
  push?: boolean;
  scheduledAt?: string; // datetime-local string
  expiresAt?: string; // datetime-local string (auto-unpublish)
  images?: string[];
}

// ─── DB shapes for the `news` table ──────────────────────────────────
// The dashboard queries via @supabase/supabase-js, so it declares the row shape
// here. Source of truth is blink-server's Drizzle schema (src/db/schema/news.ts)
// — keep these in sync with it. `content` is the per-language copy; the flat
// `title`/`sum` on Post are derived from it (see primaryOf in ./data).
export interface NewsRow {
  id: string;
  slug: string;
  category: string;
  cover_url: string | null;
  target_roles: string[];
  status: PostStatus;
  pinned: boolean;
  push: boolean;
  cta_label: string | null;
  // One column per language ({ title, sum, body }), null until composed.
  content_eng: PostContent | null;
  content_fr: PostContent | null;
  content_ar: PostContent | null;
  views: number;
  clicks: number;
  author_id: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Payload for inserts/updates via supabase-js (columns with DB defaults optional).
export interface NewsInsert {
  slug: string;
  category: string;
  cover_url?: string | null;
  target_roles?: string[];
  status?: PostStatus;
  pinned?: boolean;
  push?: boolean;
  cta_label?: string | null;
  content_eng?: PostContent | null;
  content_fr?: PostContent | null;
  content_ar?: PostContent | null;
  published_at?: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
}

// What the compose form hands to the store when creating a post.
export interface NewPostInput {
  content: Partial<Record<Lang, PostContent>>;
  cat: string;
  cover: string;
  roles: string[];
  status: PostStatus;
  pin: boolean;
  push: boolean;
  cta: string;
  scheduledAt?: string;
  expiresAt?: string;
}
