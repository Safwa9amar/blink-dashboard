// Server-side loaders for the coupons pages (service-role reads). Never import from a client component.
import { createAdminClient } from "@/lib/supabase/admin";
import {
  couponStatus,
  type CouponDiscountType,
  type CouponKpis,
  type CouponListRow,
  type CouponSource,
  type PromotionOption,
} from "@/features/coupons";

const n = (v: unknown): number => (v == null ? 0 : Number(v));
const DAY = 24 * 60 * 60 * 1000;
const LIMIT = 1000;

interface CouponDb {
  id: string;
  code: string;
  user_id: string;
  promotion_id: string | null;
  title: string;
  discount_type: CouponDiscountType;
  discount_value: unknown;
  min_order: unknown;
  max_discount: unknown;
  expires_at: string | null;
  used_at: string | null;
  revoked_at: string | null;
  order_id: string | null;
  source: CouponSource | null;
  issued_by: string | null;
  note: string | null;
  created_at: string;
}

interface UserDb {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
}

export interface CouponsData {
  rows: CouponListRow[];
  kpis: CouponKpis;
  promotions: PromotionOption[];
  promotionFilter: string;
  truncated: boolean;
  error?: string;
}

const fullName = (u?: UserDb) => (u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : "");

export async function loadPromotionOptions(): Promise<PromotionOption[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("promotions")
    .select("id, title, kind, archived_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  return ((data ?? []) as { id: string; title: string; kind: "promo" | "deal"; archived_at: string | null }[]).map((p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    archived: !!p.archived_at,
  }));
}

export async function loadCoupons(promotionFilter: string): Promise<CouponsData> {
  const supabase = await createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const d30 = new Date(now.getTime() - 30 * DAY).toISOString();
  const d7 = new Date(now.getTime() + 7 * DAY).toISOString();

  const count = () => supabase.from("customer_coupons").select("id", { count: "exact", head: true });
  const activeQ = () => count().is("used_at", null).is("revoked_at", null);

  let listQ = supabase
    .from("customer_coupons")
    .select(
      "id, code, user_id, promotion_id, title, discount_type, discount_value, min_order, max_discount, expires_at, used_at, revoked_at, order_id, source, issued_by, note, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (promotionFilter) listQ = listQ.eq("promotion_id", promotionFilter);

  const [list, active, used30, expiring7, revoked, promotions] = await Promise.all([
    listQ,
    activeQ().or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    count().gte("used_at", d30),
    activeQ().gt("expires_at", nowIso).lte("expires_at", d7),
    count().not("revoked_at", "is", null),
    loadPromotionOptions(),
  ]);

  const rows = (list.data ?? []) as CouponDb[];
  const userIds = [...new Set(rows.flatMap((r) => [r.user_id, r.issued_by].filter((x): x is string => !!x)))];
  const users = new Map<string, UserDb>();
  if (userIds.length) {
    // Chunked: PostgREST puts `in (...)` in the URL.
    for (let i = 0; i < userIds.length; i += 150) {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, phone_number")
        .in("id", userIds.slice(i, i + 150));
      for (const u of (data ?? []) as UserDb[]) users.set(u.id, u);
    }
  }
  const titles = new Map(promotions.map((p) => [p.id, p.title]));

  const out: CouponListRow[] = rows.map((r) => {
    const cust = users.get(r.user_id);
    const issuer = r.issued_by ? users.get(r.issued_by) : undefined;
    return {
      id: r.id,
      code: r.code,
      user_id: r.user_id,
      customer_name: fullName(cust),
      customer_phone: cust?.phone_number ?? "",
      promotion_id: r.promotion_id,
      promotion_title: r.promotion_id ? (titles.get(r.promotion_id) ?? null) : null,
      title: r.title,
      discount_type: r.discount_type,
      discount_value: n(r.discount_value),
      min_order: n(r.min_order),
      max_discount: r.max_discount == null ? null : n(r.max_discount),
      status: couponStatus(r, now),
      expires_at: r.expires_at,
      used_at: r.used_at,
      revoked_at: r.revoked_at,
      order_id: r.order_id,
      source: r.source ?? "promotion",
      issued_by_name: issuer ? fullName(issuer) || issuer.phone_number || null : null,
      note: r.note,
      created_at: r.created_at,
    };
  });

  return {
    rows: out,
    kpis: {
      active: active.count ?? 0,
      used30: used30.count ?? 0,
      expiring7: expiring7.count ?? 0,
      revoked: revoked.count ?? 0,
    },
    promotions,
    promotionFilter,
    truncated: rows.length >= LIMIT,
    error: list.error?.message ?? active.error?.message,
  };
}
