"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";
import type { ScheduledNotification } from "@/features/notifications";

// Broadcasting a campaign writes ONE shared notification content row plus a
// per-user notification_recipients row for every targeted user, via the
// service-role client (bypasses the notifications_select_recipient RLS — gated
// here by staff role) and, when the "push" channel is on, delivers an Expo push
// to each recipient's registered devices. Mirrors blink-server's
// broadcastNotification + push helper (shared-content + per-user archive model,
// migration 00019); the dashboard stays self-contained (Supabase + a public Expo
// POST) rather than calling the blink-server API. Email/SMS channels are not
// delivered yet — the row + push are the supported paths.

type Lang = "en" | "fr" | "ar";
type LangMap = Record<Lang, string>;

interface Copy {
  title: string;
  description: string;
}

export interface SendCampaignInput {
  type: string; // notification_type enum value
  title: LangMap;
  message: LangMap;
  roles: string[]; // dashboard labels: ["All"] | ["Customer","Rider",...]
  channels: string[]; // includes "push" / "inapp" / "email" / "sms"
  link?: string; // deep-link routePath → notifications.href
}

export interface SendCampaignResult {
  error: string | null;
  recipients: number;
  pushed: number;
}

const ROLE_LABEL_TO_ENUM: Record<string, string> = {
  Customer: "customer",
  Rider: "rider",
  Merchant: "merchant",
  Agent: "agent",
};
const ALL_ROLES = ["customer", "rider", "merchant", "agent"];

function targetRoles(roles: string[]): string[] {
  if (roles.includes("All")) return ALL_ROLES;
  return [...new Set(roles.map((r) => ROLE_LABEL_TO_ENUM[r]).filter(Boolean))];
}

// Detail-page deep link for typed notifications — mirrors the app's
// utils/notification-nav.ts and blink-server's detailHref(). Used as the push
// `data.href` so a tapped push opens the right screen (with the real row id).
function detailHref(role: string, type: string, id: string): string | null {
  const base = `/(${role})/notifications`;
  switch (type) {
    case "offer":
      return `${base}/offers/${id}`;
    case "benefit":
      return `${base}/benefits/${id}`;
    case "deposit":
      return `${base}/bonuses/${id}`;
    case "alert":
    case "security":
      return `${base}/${id}`;
    default:
      return null;
  }
}

/** Build a per-language copy block, or null when that language is empty. */
function copyFor(title: string, message: string): Copy | null {
  if (!title && !message) return null;
  return { title, description: message };
}

const ENUM_TO_LABEL: Record<string, string> = {
  customer: "Customer",
  rider: "Rider",
  merchant: "Merchant",
  agent: "Agent",
};

/** Lowercase enum roles → a single display label for the audience badge. */
function audienceLabel(roles: string[]): string {
  if (!roles || roles.length === 0) return "All";
  if (roles.length >= ALL_ROLES.length) return "All";
  if (roles.length === 1) return ENUM_TO_LABEL[roles[0]] ?? roles[0];
  return roles.map((r) => ENUM_TO_LABEL[r] ?? r).join(", ");
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface ScheduleCampaignInput extends SendCampaignInput {
  scheduledAt: string; // ISO timestamp (UTC)
}

export interface ScheduleCampaignResult {
  error: string | null;
  id: string | null;
}

// Queue a broadcast to fire later. Unlike sendCampaign (which delivers
// immediately), this inserts ONE row into scheduled_notifications; the
// blink-server cron (POST /cron/scheduled-notifications, every minute) claims it
// when due and runs the real broadcast. Audience is resolved at fire time.
export async function scheduleCampaign(
  input: ScheduleCampaignInput
): Promise<ScheduleCampaignResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", id: null };
  }

  const roles = targetRoles(input.roles);
  if (roles.length === 0) return { error: "No valid target roles", id: null };

  const when = new Date(input.scheduledAt);
  if (Number.isNaN(when.getTime()))
    return { error: "Invalid schedule time", id: null };
  if (when.getTime() <= Date.now())
    return { error: "Schedule time must be in the future", id: null };

  const titleEn = input.title.en || input.title.fr || input.title.ar || "";
  const descEn = input.message.en || input.message.fr || input.message.ar || "";
  if (!titleEn) return { error: "A title is required.", id: null };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("scheduled_notifications")
    .insert({
      type: input.type,
      title: titleEn,
      description: descEn,
      href: input.link || null,
      content_eng: copyFor(input.title.en, input.message.en),
      content_fr: copyFor(input.title.fr, input.message.fr),
      content_ar: copyFor(input.title.ar, input.message.ar),
      target_roles: roles,
      channels: input.channels,
      scheduled_at: when.toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed", id: null };

  revalidatePath("/d/notifications");
  return { error: null, id: data.id as string };
}

// Cancel a still-pending scheduled broadcast. No-op if it already fired (the
// status filter only matches pending rows), so there's no cancel-vs-send race.
export async function cancelScheduled(
  id: string
): Promise<{ error: string | null }> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized" };
  }
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("scheduled_notifications")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath("/d/notifications");
  return { error: null };
}

interface ScheduledRow {
  id: string;
  type: string;
  title: string;
  target_roles: string[] | null;
  channels: string[] | null;
  scheduled_at: string;
  status: string;
  recipients: number | null;
}

// Read the scheduled-broadcast queue for the Campaigns table (server-only).
// Hides canceled rows; newest schedule first.
export async function listScheduledCampaigns(): Promise<ScheduledNotification[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("scheduled_notifications")
    .select("id, type, title, target_roles, channels, scheduled_at, status, recipients")
    .neq("status", "canceled")
    .order("scheduled_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as ScheduledRow[]).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    audience: audienceLabel(r.target_roles ?? []),
    channels: r.channels ?? [],
    scheduledAt: r.scheduled_at,
    status: r.status as ScheduledNotification["status"],
    recipients: r.recipients ?? 0,
  }));
}

export async function sendCampaign(
  input: SendCampaignInput
): Promise<SendCampaignResult> {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return { error: "Not authorized", recipients: 0, pushed: 0 };
  }

  const roles = targetRoles(input.roles);
  if (roles.length === 0) {
    return { error: "No valid target roles", recipients: 0, pushed: 0 };
  }

  // Sender stamped on the shared content row (notifications.created_by). Read
  // from the session-bound SSR client — the admin client below is session-less.
  const ssr = await createClient();
  const {
    data: { user: sender },
  } = await ssr.auth.getUser();

  const supabase = await createAdminClient();

  // Recipients.
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, role")
    .in("role", roles);
  if (usersErr) return { error: usersErr.message, recipients: 0, pushed: 0 };
  if (!users || users.length === 0) {
    return { error: null, recipients: 0, pushed: 0 };
  }

  // Canonical (English) fallback strings + per-language copy blocks.
  const titleEn = input.title.en || input.title.fr || input.title.ar || "";
  const descEn = input.message.en || input.message.fr || input.message.ar || "";
  const contentEng = copyFor(input.title.en, input.message.en);
  const contentFr = copyFor(input.title.fr, input.message.fr);
  const contentAr = copyFor(input.title.ar, input.message.ar);

  // 1. One SHARED content row (no per-user duplication).
  const { data: notif, error: insErr } = await supabase
    .from("notifications")
    .insert({
      type: input.type,
      title: titleEn,
      description: descEn,
      href: input.link || null,
      content_eng: contentEng,
      content_fr: contentFr,
      content_ar: contentAr,
      target_roles: roles,
      created_by: sender?.id ?? null,
    })
    .select("id")
    .single();
  if (insErr || !notif)
    return { error: insErr?.message ?? "insert failed", recipients: 0, pushed: 0 };

  // 2. One recipient row per targeted user, all pointing at the shared content.
  const recipientRows = users.map((u) => ({
    notification_id: notif.id as string,
    user_id: u.id as string,
  }));
  const { error: recErr } = await supabase
    .from("notification_recipients")
    .insert(recipientRows);
  if (recErr) return { error: recErr.message, recipients: 0, pushed: 0 };

  // deliverPush keys by (id, user_id) — the id is the shared notification id for
  // every recipient now.
  const inserted = users.map((u) => ({
    id: notif.id as string,
    user_id: u.id as string,
  }));

  let pushed = 0;
  if (input.channels.includes("push") && inserted.length > 0) {
    pushed = await deliverPush(
      supabase,
      inserted,
      users as { id: string; role: string }[],
      input,
      titleEn,
      descEn
    );
  }

  revalidatePath("/d/notifications");
  return { error: null, recipients: recipientRows.length, pushed };
}

// Fan out an Expo push to every registered device of the recipients. Best-effort:
// a failed Expo request is logged and counted as 0, never throwing — the in-app
// notifications are already persisted.
async function deliverPush(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  inserted: { id: string; user_id: string }[],
  users: { id: string; role: string }[],
  input: SendCampaignInput,
  title: string,
  body: string
): Promise<number> {
  const userIds = inserted.map((r) => r.user_id);
  const { data: tokens, error } = await supabase
    .from("device_tokens")
    .select("user_id, token")
    .in("user_id", userIds);
  if (error || !tokens || tokens.length === 0) return 0;

  const rowByUser = new Map(inserted.map((r) => [r.user_id, r.id]));
  const roleByUser = new Map(users.map((u) => [u.id, u.role]));

  const messages = tokens.map((tk) => {
    const userId = tk.user_id as string;
    const id = rowByUser.get(userId)!;
    const role = roleByUser.get(userId) ?? "customer";
    const href = input.link || detailHref(role, input.type, id);
    return {
      to: tk.token as string,
      sound: "default",
      title,
      body,
      data: {
        type: input.type,
        notificationId: id,
        ...(href ? { href } : {}),
      },
    };
  });

  // Expo accepts up to 100 messages per request.
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
      else console.error("[notifications] Expo push failed", res.status);
    } catch (e) {
      console.error("[notifications] Expo push error", (e as Error).message);
    }
  }
  return sent;
}
