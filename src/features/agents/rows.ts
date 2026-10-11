import { hoursGroups } from "@/features/verification";
import type { Agent, AgentShop, ShopReviewStatus } from "./types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
// PostgREST returns a to-one embed as an object, or a one-element array.
const one = (v: unknown): Rec | null => (Array.isArray(v) ? (isRec(v[0]) ? v[0] : null) : isRec(v) ? v : null);

const REVIEW: readonly ShopReviewStatus[] = ["under_review", "active", "rejected"];
// `time` columns come back as "08:00:00": show HH:MM.
const hhmm = (v: unknown): string => (typeof v === "string" ? v.slice(0, 5) : "");

function toShop(row: unknown): AgentShop | null {
  if (!isRec(row) || typeof row.id !== "string") return null;
  const rating = typeof row.rating === "number" ? row.rating : Number(row.rating);
  return {
    id: row.id,
    name: typeof row.shop_name === "string" ? row.shop_name : "",
    phone: strOrNull(row.phone_number),
    address: strOrNull(row.address),
    description: strOrNull(row.description),
    open: row.status === "open",
    openTime: hhmm(row.open_time),
    closeTime: hhmm(row.close_time),
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    isPrimary: row.is_primary === true,
    review: REVIEW.find((s) => s === row.review_status) ?? "under_review",
    hours: hoursGroups(row.hours),
  };
}

/** users row with `agent_profiles(agent_id)` and `agent_shops(...)` embedded. */
export function toAgent(row: unknown): Agent | null {
  if (!isRec(row) || typeof row.id !== "string") return null;
  const shops = (Array.isArray(row.agent_shops) ? row.agent_shops : [])
    .map(toShop)
    .filter((s): s is AgentShop => s !== null)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return {
    id: row.id,
    agent_id: strOrNull(one(row.agent_profiles)?.agent_id),
    first_name: strOrNull(row.first_name),
    last_name: strOrNull(row.last_name),
    email: strOrNull(row.email),
    phone_number: strOrNull(row.phone_number),
    gender: strOrNull(row.gender),
    wilaya: strOrNull(row.wilaya),
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    shops,
  };
}

/** Case-insensitive match on name, phone, agent id and shop name. */
export function matchesAgent(a: Agent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ");
  return [name, a.phone_number ?? "", a.agent_id ?? "", ...a.shops.map((s) => s.name)].some((f) => f.toLowerCase().includes(q));
}
