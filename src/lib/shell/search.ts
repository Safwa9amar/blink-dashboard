// Server-side record search + peek loaders. Called only from actions.ts, which
// re-resolves the staff role first.
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { refToRange } from "@/lib/nav/ref-range";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecordDetail, RecordKind, SearchGroup, SearchHit } from "./search-types";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const LIMIT = 5;

export const LIST_HREF: Record<RecordKind, string> = {
  order: "/orders",
  transaction: "/blink-cash",
  person: "/users",
  store: "/merchants",
};

const GROUP_ORDER: RecordKind[] = ["order", "transaction", "person", "store"];

const ref = (id: string) => id.slice(0, 8).toUpperCase();

/** Escape LIKE wildcards and the characters that are structural inside a PostgREST `.or()` filter. */
export function escapeIlike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()"]/g, " ");
}

const fullName = (u: { first_name?: string | null; last_name?: string | null }) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ");

const money = (n: number | string | null | undefined) => (n == null ? "" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }));
/** ISO timestamp passed through for the client to format in Africa/Algiers; "" renders as "—". */
const when = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString() : "");

async function searchIdTable(
  db: Admin,
  table: "orders" | "transactions",
  q: string
): Promise<SearchHit[]> {
  const range = refToRange(q);
  if (!range) return [];
  const cols = table === "orders" ? "id, store_name, status, total, created_at" : "id, type, status, total, created_at";
  let query = db.from(table).select(cols);
  query = "exact" in range ? query.eq("id", range.exact) : query.gte("id", range.gte).lte("id", range.lte);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(LIMIT);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Record<string, string | number | null>[];
  return rows.map((r) => ({
    kind: table === "orders" ? ("order" as const) : ("transaction" as const),
    id: String(r.id),
    ref: ref(String(r.id)),
    title: table === "orders" ? String(r.store_name ?? "") : String(r.type ?? "").replace(/_/g, " "),
    subtitle: [String(r.status ?? "").replace(/_/g, " "), money(r.total as number)].filter(Boolean).join(" · "),
    raw: { status: String(r.status ?? ""), ...(table === "transactions" ? { type: String(r.type ?? "") } : {}) },
    detail: money(r.total as number),
  }));
}

async function searchPeople(db: Admin, q: string): Promise<SearchHit[]> {
  const p = `%${escapeIlike(q.trim())}%`;
  const { data, error } = await db
    .from("users")
    .select("id, first_name, last_name, phone_number, email, role")
    .or(`first_name.ilike.${p},last_name.ilike.${p},phone_number.ilike.${p},email.ilike.${p}`)
    .limit(LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []).map((u) => ({
    kind: "person" as const,
    id: u.id as string,
    title: fullName(u) || (u.email as string) || (u.phone_number as string) || ref(u.id as string),
    subtitle: [u.role, u.phone_number ?? u.email].filter(Boolean).join(" · "),
    raw: { role: String(u.role ?? "") },
    detail: String(u.phone_number ?? u.email ?? ""),
  }));
}

async function searchStores(db: Admin, q: string): Promise<SearchHit[]> {
  const { data, error } = await db
    .from("stores")
    .select("id, name, status, location")
    .ilike("name", `%${escapeIlike(q.trim())}%`)
    .limit(LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    kind: "store" as const,
    id: s.id as string,
    title: s.name as string,
    subtitle: [String(s.status ?? "").replace(/_/g, " "), s.location].filter(Boolean).join(" · "),
    raw: { status: String(s.status ?? "") },
    detail: String(s.location ?? ""),
  }));
}

export async function searchAll(role: StaffRole, q: string): Promise<SearchGroup[]> {
  if (q.trim().length < 2) return [];
  const db = await createAdminClient();
  const runners: Record<RecordKind, () => Promise<SearchHit[]>> = {
    order: () => searchIdTable(db, "orders", q),
    transaction: () => searchIdTable(db, "transactions", q),
    person: () => searchPeople(db, q),
    store: () => searchStores(db, q),
  };
  const kinds = GROUP_ORDER.filter((k) => canAccessPath(role, LIST_HREF[k]));
  const settled = await Promise.allSettled(kinds.map((k) => runners[k]()));
  const groups: SearchGroup[] = [];
  settled.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[search] ${kinds[i]} failed:`, r.reason);
    else if (r.value.length) groups.push({ kind: kinds[i], hits: r.value });
  });
  return groups;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadRecord(role: StaffRole, kind: RecordKind, id: string): Promise<RecordDetail | null> {
  if (!UUID.test(id) || !canAccessPath(role, LIST_HREF[kind])) return null;
  const db = await createAdminClient();
  const listHref = LIST_HREF[kind];
  const f = (label: string, value: string | null | undefined) => ({ label, value: value || "—" });

  if (kind === "order") {
    const { data: o } = await db
      .from("orders")
      .select("id, status, type, store_name, customer_id, total, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (!o) return null;
    const { data: c } = await db.from("users").select("first_name, last_name, phone_number").eq("id", o.customer_id).maybeSingle();
    return {
      kind, id, listHref, title: `#${ref(id)}`,
      fields: [
        f("status", String(o.status)), f("type", String(o.type)), f("store", o.store_name),
        f("customer", c ? fullName(c) || c.phone_number : null), f("total", money(o.total)),
        f("created", when(o.created_at)), f("updated", when(o.updated_at)),
      ],
    };
  }
  if (kind === "transaction") {
    const { data: t } = await db
      .from("transactions")
      .select("id, type, status, amount, fees, total, agent_id, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!t) return null;
    let agent: string | null = null;
    if (t.agent_id) {
      const { data: a } = await db.from("users").select("first_name, last_name, phone_number").eq("id", t.agent_id).maybeSingle();
      agent = a ? fullName(a) || a.phone_number : null;
    }
    return {
      kind, id, listHref, title: `#${ref(id)}`,
      fields: [
        f("type", String(t.type)), f("status", String(t.status)),
        f("amount", `${money(t.amount)} (+${money(t.fees)})`), f("total", money(t.total)),
        f("agent", agent), f("created", when(t.created_at)),
      ],
    };
  }
  if (kind === "person") {
    const { data: u } = await db
      .from("users")
      .select("id, first_name, last_name, phone_number, email, role, is_active, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!u) return null;
    // A rider opens on their own page (when staff may see /riders), not the users list.
    const ownPage = u.role === "rider" && canAccessPath(role, "/riders");
    return {
      kind, id, listHref: ownPage ? `/riders/${id}` : listHref, ...(ownPage ? { openAs: "rider" as const } : {}), title: fullName(u) || u.email || u.phone_number || ref(id),
      fields: [f("role", u.role), f("status", u.is_active === false ? "inactive" : "active"), f("phone", u.phone_number), f("email", u.email), f("joined", when(u.created_at))],
    };
  }
  const { data: s } = await db.from("stores").select("id, name, status, owner_id, location, created_at").eq("id", id).maybeSingle();
  if (!s) return null;
  let owner: string | null = null;
  if (s.owner_id) {
    const { data: ow } = await db.from("users").select("first_name, last_name, phone_number").eq("id", s.owner_id).maybeSingle();
    owner = ow ? fullName(ow) || ow.phone_number : null;
  }
  const { count } = await db.from("store_products").select("id", { count: "exact", head: true }).eq("store_id", id);
  return {
    kind, id, listHref, title: s.name,
    fields: [
      f("status", String(s.status)), f("owner", owner), f("products", String(count ?? 0)),
      f("location", s.location), f("created", when(s.created_at)),
    ],
  };
}
