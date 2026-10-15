import { createAdminClient } from "@/lib/supabase/admin";
import { requirePathAccess } from "@/lib/auth/staff";
import {
  DEFAULT_SLA_POLICIES,
  asPriority,
  buildCases,
  type Priority,
  type SlaPolicy,
  type SupportCase,
  type MetricMessage,
} from "@/features/support/metrics";

export type DeskStatus = "bot" | "waiting" | "assigned" | "resolved";

export interface DeskConversation {
  id: string;
  user_id: string;
  user_role: string;
  status: DeskStatus;
  assigned_agent_id: string | null;
  subject: string | null;
  locale: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_for_staff: number;
  created_at: string;
  priority: Priority;
  csat_rating: number | null;
  csat_comment: string | null;
  csat_at: string | null;
  /** Display names resolved from `users` (null when unknown). */
  ownerName: string | null;
  assigneeName: string | null;
}

export interface DeskStaff {
  id: string;
  name: string;
  staff_role: string;
}

/** A case plus the denormalised fields every tab needs. */
export interface DeskCase extends SupportCase {
  resolvedByName: string | null;
  assignedToName: string | null;
}

export interface DeskData {
  /** ISO time the data was read (use instead of `new Date()` during render). */
  generatedAt: string;
  days: number;
  conversations: DeskConversation[];
  cases: DeskCase[];
  policies: SlaPolicy[];
  staff: DeskStaff[];
  /** user id -> display name, for owners + staff. */
  names: Record<string, string>;
  /** staff id -> ISO time of their latest agent message in the window. */
  lastAgentMessageAt: Record<string, string>;
  /** True when the support-desk migration (priority/csat columns, SLA table) is missing. */
  migrationPending: boolean;
  error: string | null;
}

interface PgErr {
  code?: string;
  message?: string;
}

/** Missing column (42703) / table (42P01) — directly or via PostgREST's schema-cache codes. */
function isMissing(e: PgErr | null | undefined): boolean {
  if (!e) return false;
  if (e.code && ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code)) return true;
  return /does not exist|schema cache/i.test(e.message ?? "");
}

const BASE_COLS =
  "id, user_id, user_role, status, assigned_agent_id, subject, locale, last_message_at, last_message_preview, unread_for_staff, created_at";
const NEW_COLS = "priority, csat_rating, csat_comment, csat_at";
const CHUNK = 100;
const PAGE = 1000;

type Raw = Record<string, unknown>;

function userName(u: { first_name: string | null; last_name: string | null; email: string | null }): string {
  return (
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    (u.email ? u.email.split("@")[0] : "")
  );
}

export async function loadDesk({ days = 30 }: { days?: number } = {}): Promise<DeskData> {
  await requirePathAccess("/support");
  const supabase = await createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - days * 86400000).toISOString();
  let migrationPending = false;
  let error: string | null = null;

  // Conversations active in the window, plus anything still open.
  const filter = `last_message_at.gte.${since},status.in.(waiting,assigned)`;
  const readConvs = (cols: string) =>
    supabase
      .from("support_conversations")
      .select(cols)
      .or(filter)
      .order("last_message_at", { ascending: false })
      .limit(5000);
  let convRes = await readConvs(`${BASE_COLS}, ${NEW_COLS}`);
  if (isMissing(convRes.error)) {
    migrationPending = true;
    convRes = await readConvs(BASE_COLS);
  }
  if (convRes.error) error = convRes.error.message;
  const rawConvs = ((convRes.data as unknown as Raw[] | null) ?? []) as Raw[];

  // Staff roster.
  const staffRes = await supabase
    .from("users")
    .select("id, first_name, last_name, email, staff_role")
    .in("staff_role", ["super_admin", "support_admin"]);
  if (staffRes.error && !error) error = staffRes.error.message;
  const staff: DeskStaff[] = (
    (staffRes.data as { id: string; first_name: string | null; last_name: string | null; email: string | null; staff_role: string }[] | null) ?? []
  ).map((u) => ({ id: u.id, name: userName(u) || u.id.slice(0, 8), staff_role: u.staff_role }));

  // Names for owners.
  const names: Record<string, string> = Object.fromEntries(staff.map((s) => [s.id, s.name]));
  const ownerIds = [...new Set(rawConvs.map((c) => c.user_id as string))].filter((id) => !names[id]);
  const chunks: string[][] = [];
  for (let i = 0; i < ownerIds.length; i += CHUNK) chunks.push(ownerIds.slice(i, i + CHUNK));
  await Promise.all(
    chunks.map(async (ids) => {
      const { data } = await supabase.from("users").select("id, first_name, last_name, email").in("id", ids);
      for (const u of (data as { id: string; first_name: string | null; last_name: string | null; email: string | null }[] | null) ?? []) {
        const n = userName(u);
        if (n) names[u.id] = n;
      }
    })
  );

  // Escalation / assignment / resolution events and agent replies (no bodies).
  const convIds = rawConvs.map((c) => c.id as string);
  const msgChunks: string[][] = [];
  for (let i = 0; i < convIds.length; i += CHUNK) msgChunks.push(convIds.slice(i, i + CHUNK));
  const byConv = new Map<string, MetricMessage[]>();
  const lastAgentMessageAt: Record<string, string> = {};
  await Promise.all(
    msgChunks.map(async (ids) => {
      for (let from = 0; ; from += PAGE) {
        const { data, error: e } = await supabase
          .from("support_messages")
          .select("conversation_id, sender, sender_id, meta, created_at")
          .in("conversation_id", ids)
          .in("sender", ["agent", "system"])
          .order("created_at", { ascending: true })
          .range(from, from + PAGE - 1);
        if (e) {
          error ??= e.message;
          break;
        }
        const rows = (data as (MetricMessage & { conversation_id: string })[] | null) ?? [];
        for (const m of rows) {
          const list = byConv.get(m.conversation_id) ?? [];
          list.push(m);
          byConv.set(m.conversation_id, list);
          if (m.sender === "agent" && m.sender_id) {
            const prev = lastAgentMessageAt[m.sender_id];
            if (!prev || prev < m.created_at) lastAgentMessageAt[m.sender_id] = m.created_at;
          }
        }
        if (rows.length < PAGE) break;
      }
    })
  );

  // SLA policies.
  let policies = DEFAULT_SLA_POLICIES;
  const polRes = await supabase
    .from("support_sla_policies")
    .select("priority, first_response_minutes, resolution_minutes");
  if (isMissing(polRes.error)) migrationPending = true;
  else if (polRes.error) error ??= polRes.error.message;
  else if (polRes.data?.length) {
    const rows = polRes.data as SlaPolicy[];
    policies = DEFAULT_SLA_POLICIES.map((d) => rows.find((r) => r.priority === d.priority) ?? d);
  }

  const conversations: DeskConversation[] = rawConvs.map((c) => ({
    id: c.id as string,
    user_id: c.user_id as string,
    user_role: c.user_role as string,
    status: c.status as DeskStatus,
    assigned_agent_id: (c.assigned_agent_id as string | null) ?? null,
    subject: (c.subject as string | null) ?? null,
    locale: (c.locale as string) ?? "en",
    last_message_at: c.last_message_at as string,
    last_message_preview: (c.last_message_preview as string | null) ?? null,
    unread_for_staff: (c.unread_for_staff as number) ?? 0,
    created_at: c.created_at as string,
    priority: asPriority(c.priority),
    csat_rating: (c.csat_rating as number | null) ?? null,
    csat_comment: (c.csat_comment as string | null) ?? null,
    csat_at: (c.csat_at as string | null) ?? null,
    ownerName: names[c.user_id as string] ?? null,
    assigneeName: c.assigned_agent_id ? (names[c.assigned_agent_id as string] ?? null) : null,
  }));

  const cases: DeskCase[] = conversations.flatMap((c) =>
    buildCases(byConv.get(c.id) ?? [], c).map((k) => ({
      ...k,
      resolvedByName: k.resolvedBy ? (names[k.resolvedBy] ?? null) : null,
      assignedToName: k.assignedTo ? (names[k.assignedTo] ?? null) : null,
    }))
  );

  return {
    generatedAt: now.toISOString(),
    days,
    conversations,
    cases,
    policies,
    staff,
    names,
    lastAgentMessageAt,
    migrationPending,
    error,
  };
}
