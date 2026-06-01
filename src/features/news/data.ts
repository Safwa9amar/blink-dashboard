// Mock data for the Blink News CMS — from the Blink Design System handoff (news.jsx).
import type { Lang } from "@/components/ui";
import type { Variant } from "@/components/ui";

import type { NewPostInput, NewsInsert, NewsRow, Post, PostContent } from "./types";
export type { Post, PostStatus, PostContent, NewPostInput, NewsRow, NewsInsert } from "./types";

export const N_CATS = [
  { name: "Network", color: "#3B82F6", count: 14 },
  { name: "Offer", color: "#EE335F", count: 22 },
  { name: "Policy", color: "#FAAD14", count: 9 },
  { name: "Update", color: "#10B981", count: 17 },
  { name: "Announcement", color: "#8B5CF6", count: 6 },
];
export const N_CAT_NAMES = N_CATS.map((c) => c.name);

export const N_ROLES = ["All", "Customer", "Rider", "Merchant", "Agent"];
export const N_ROLE_VARIANT: Record<string, Variant> = {
  Customer: "info",
  Rider: "success",
  Merchant: "primary",
  Agent: "warning",
  All: "default",
};

// Preset cover options (copied into /public/images from the design handoff assets).
// Authors can also upload a custom cover (stored as a data-URL) — see CoverPick.
export const COVERS = ["/images/news-warehouse.png", "/images/news-fuel.png", "/images/news-policy.png"];

export const N_STATUS: Record<string, Variant> = {
  published: "success",
  scheduled: "info",
  draft: "warning",
};

export const POSTS: Post[] = [
  {
    id: "expanding-network",
    title: "Expanding Network: 15 new delivery hubs",
    sum: "New hubs across the northern region cut delivery times.",
    cat: "Network",
    cover: COVERS[0],
    roles: ["All"],
    status: "published",
    pin: true,
    views: 48200,
    ctr: "6.4%",
    date: "May 30",
    cta: "Learn more",
    push: true,
    content: {
      en: {
        title: "Expanding Network: 15 new delivery hubs",
        sum: "New hubs across the northern region cut delivery times.",
        body: "<p>We're thrilled to announce <strong>15 new delivery hubs</strong> opening across the northern region this month.</p><h2>Faster than ever</h2><p>Average delivery time in covered zones drops by up to <strong>22%</strong>, with same-day windows now available in Algiers, Oran and Constantine.</p><ul><li>Wider same-day coverage</li><li>Shorter rider trips</li><li>Lower fees on short routes</li></ul>",
      },
    },
  },
  {
    id: "fuel-cashback",
    title: "Fuel cashback for riders this month",
    sum: "Registered riders earn diesel cashback on every 50 trips.",
    cat: "Offer",
    cover: COVERS[1],
    roles: ["Rider"],
    status: "published",
    pin: false,
    views: 12400,
    ctr: "11.2%",
    date: "May 28",
    cta: "See the offer",
    push: true,
    content: {
      en: {
        title: "Fuel cashback for riders this month",
        sum: "Registered riders earn diesel cashback on every 50 trips.",
        body: "<p>Every <strong>50 completed trips</strong> this month earns you diesel cashback paid straight into your Blink Cash wallet.</p><blockquote>The more you ride, the more you save.</blockquote>",
      },
    },
  },
  {
    id: "settlement-policy",
    title: "Updated settlement & dues policy",
    sum: "How monthly dues are calculated — now clearer for merchants.",
    cat: "Policy",
    cover: COVERS[2],
    roles: ["Merchant", "Agent"],
    status: "published",
    pin: false,
    views: 8900,
    ctr: "4.1%",
    date: "May 25",
    cta: "Read policy",
    push: false,
    content: {
      en: {
        title: "Updated settlement & dues policy",
        sum: "How monthly dues are calculated — now clearer for merchants.",
        body: "<p>We've rewritten the settlement policy to make monthly dues easier to follow.</p><h3>What changed</h3><ol><li>Dues are now itemised per order.</li><li>Payouts move to a weekly cycle.</li></ol>",
      },
    },
  },
  {
    id: "weekend-rides-promo",
    title: "30% off all rides — weekend drop",
    sum: "A limited weekend promo for all customers in Algiers.",
    cat: "Offer",
    cover: COVERS[0],
    roles: ["Customer"],
    status: "scheduled",
    pin: false,
    views: 0,
    ctr: "—",
    date: "Jun 1",
    cta: "Grab the code",
    push: true,
    scheduledAt: "2026-06-01T09:00",
  },
  {
    id: "wallet-topup",
    title: "New in-app wallet top-up methods",
    sum: "CIB and Edahabia cards now supported for Blink Cash.",
    cat: "Update",
    cover: COVERS[1],
    roles: ["All"],
    status: "draft",
    pin: false,
    views: 0,
    ctr: "—",
    date: "2h ago",
    cta: "Learn more",
    push: false,
  },
];

// ─── Helpers (shared by the store + the DB mappers) ──────────────────
const LANG_ORDER: Lang[] = ["en", "fr", "ar"];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "post";

export const rand = () => Math.random().toString(36).slice(2, 6);

// Primary (admin-list) content: first language that has a title.
export function primaryOf(content: Partial<Record<Lang, PostContent>>): PostContent {
  for (const l of LANG_ORDER) {
    const c = content[l];
    if (c && c.title.trim()) return c;
  }
  return { title: "Untitled post", sum: "", body: "" };
}

// Short date label (e.g. "Jun 1") from an ISO / datetime-local string.
export function shortDate(iso?: string | null): string {
  if (!iso) return "now";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "now";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// CTR display string from views/clicks (derived, not stored).
function ctrOf(views: number, clicks: number): string {
  if (!views) return "—";
  return `${((clicks / views) * 100).toFixed(1)}%`;
}

// ─── DB ⇄ UI mappers ─────────────────────────────────────────────────
// A `news` row → the admin-list `Post` view model.
export function rowToPost(row: NewsRow): Post {
  // Recombine the per-language columns into the UI's content record.
  const content: Partial<Record<Lang, PostContent>> = {};
  if (row.content_eng) content.en = row.content_eng;
  if (row.content_fr) content.fr = row.content_fr;
  if (row.content_ar) content.ar = row.content_ar;
  const primary = primaryOf(content);
  const dateSrc = row.status === "scheduled" ? row.scheduled_at : row.published_at ?? row.created_at;
  return {
    id: row.id,
    title: primary.title,
    sum: primary.sum,
    cat: row.category,
    cover: row.cover_url ?? COVERS[0],
    roles: row.target_roles ?? ["All"],
    status: row.status,
    pin: row.pinned,
    views: row.views,
    ctr: ctrOf(row.views, row.clicks),
    date: shortDate(dateSrc),
    content,
    cta: row.cta_label ?? undefined,
    push: row.push,
    scheduledAt: row.scheduled_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  };
}

// The compose form's input → a `news` insert payload.
export function postToInsert(input: NewPostInput): NewsInsert {
  const primary = primaryOf(input.content);
  return {
    slug: `${slugify(primary.title)}-${rand()}`,
    category: input.cat,
    cover_url: input.cover || null,
    target_roles: input.roles,
    status: input.status,
    pinned: input.pin,
    push: input.push,
    cta_label: input.cta || null,
    content_eng: input.content.en ?? null,
    content_fr: input.content.fr ?? null,
    content_ar: input.content.ar ?? null,
    published_at: input.status === "published" ? new Date().toISOString() : null,
    scheduled_at: input.scheduledAt || null,
    expires_at: input.expiresAt || null,
  };
}
