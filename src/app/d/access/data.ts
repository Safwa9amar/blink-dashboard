import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffRole, type StaffRole } from "@/lib/auth/access";
import type { AccessEventAction, StaffStatus } from "@/features/access/types";

export interface StaffMemberRow {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  staffRole: StaffRole;
  status: StaffStatus;
  lastSignInAt: string | null;
  createdAt: string;
}

export interface AccessEventRow {
  id: string;
  action: AccessEventAction;
  actorName: string | null;
  targetName: string | null;
  targetEmail: string | null;
  fromRole: StaffRole | null;
  toRole: StaffRole | null;
  note: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  staff_role: string | null;
  created_at?: string | null;
}

const fullName = (u: { first_name?: string | null; last_name?: string | null; email?: string | null }) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || (u.email ? u.email.split("@")[0] : "");

export async function loadStaff(): Promise<StaffMemberRow[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, phone_number, staff_role")
    .not("staff_role", "is", null);
  if (error || !data) return [];

  const rows = await Promise.all(
    (data as UserRow[]).map(async (u): Promise<StaffMemberRow | null> => {
      if (!isStaffRole(u.staff_role)) return null;
      const { data: res } = await supabase.auth.admin.getUserById(u.id);
      const au = res?.user;
      const email = u.email || au?.email || "";
      const bannedUntil = (au as { banned_until?: string | null } | undefined)?.banned_until;
      const banned = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
      const lastSignInAt = au?.last_sign_in_at ?? null;
      const status: StaffStatus = banned
        ? "suspended"
        : au?.app_metadata?.must_change_password === true
          ? "must_change"
          : !lastSignInAt
            ? "never_signed_in"
            : "active";
      return {
        id: u.id,
        firstName: u.first_name ?? "",
        lastName: u.last_name ?? "",
        name: fullName({ ...u, email }),
        email,
        phone: u.phone_number,
        staffRole: u.staff_role,
        status,
        lastSignInAt,
        createdAt: au?.created_at ?? u.created_at ?? "",
      };
    }),
  );
  return rows.filter((r): r is StaffMemberRow => r !== null).sort((a, b) => a.name.localeCompare(b.name));
}

interface EventDbRow {
  id: string;
  actor_id: string | null;
  target_id: string | null;
  action: AccessEventAction;
  from_role: string | null;
  to_role: string | null;
  note: string | null;
  created_at: string;
}

export async function loadAccessEvents(
  opts: { limit?: number; action?: AccessEventAction; targetId?: string } = {},
): Promise<AccessEventRow[]> {
  const supabase = await createAdminClient();
  let q = supabase
    .from("staff_access_events")
    .select("id, actor_id, target_id, action, from_role, to_role, note, created_at")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.action) q = q.eq("action", opts.action);
  if (opts.targetId) q = q.eq("target_id", opts.targetId);

  const { data, error } = await q;
  if (error) {
    if (error.code !== "42P01") console.error("[access] loadAccessEvents:", error.message);
    return [];
  }
  const events = (data ?? []) as EventDbRow[];
  const ids = [...new Set(events.flatMap((e) => [e.actor_id, e.target_id]).filter((x): x is string => !!x))];
  const people = new Map<string, UserRow>();
  if (ids.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .in("id", ids);
    for (const u of (users ?? []) as UserRow[]) people.set(u.id, u);
  }
  const nameOf = (id: string | null) => {
    const u = id ? people.get(id) : undefined;
    return u ? fullName(u) || null : null;
  };
  return events.map((e) => ({
    id: e.id,
    action: e.action,
    actorName: nameOf(e.actor_id),
    targetName: nameOf(e.target_id),
    targetEmail: (e.target_id && people.get(e.target_id)?.email) || null,
    fromRole: isStaffRole(e.from_role) ? e.from_role : null,
    toRole: isStaffRole(e.to_role) ? e.to_role : null,
    note: e.note,
    createdAt: e.created_at,
  }));
}
