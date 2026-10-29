// Server-only: sends the dashboard's auth emails (password reset, sign-in code) itself.
// generateLink mints the token without Supabase mailing anything, we build the
// /auth/confirm link and send it over our SMTP — so no built-in mailer cap (2/hour, team
// members only) and no dependence on the project's Site URL or email templates.
// Without SMTP env (local dev) it falls back to Supabase's own mailer.
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonAuthClient } from "@/lib/supabase/anon";
import { requestOrigin } from "@/lib/auth/origin";
import { renderAuthEmail, type AuthEmailType, type AuthLang } from "@/lib/email/auth-templates";
import { sendMail, smtpConfigured } from "@/lib/email/smtp";

export type AuthEmailResult = { ok: true } | { ok: false; reason: "rate_limited" | "failed" };

// Supabase's own per-account cooldown; generateLink has none, so we apply it here.
const COOLDOWN_MS = 60_000;
const NEXT: Record<AuthEmailType, string> = { recovery: "/login/reset", magiclink: "/" };

export function toAuthLang(locale: string): AuthLang {
  return locale === "fr" || locale === "ar" ? locale : "en";
}

/** The emailed link: /auth/confirm verifies token_hash and forwards to `next`. */
export function confirmLink(origin: string, type: AuthEmailType, lang: AuthLang, tokenHash?: string): string {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("next", NEXT[type]);
  url.searchParams.set("lang", lang);
  if (tokenHash) {
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", type);
  }
  return url.toString();
}

export async function sendAuthEmail(opts: {
  userId: string;
  email: string;
  type: AuthEmailType;
  lang: AuthLang;
}): Promise<AuthEmailResult> {
  const origin = await requestOrigin();
  if (!smtpConfigured()) return viaSupabase(opts.type, opts.email, confirmLink(origin, opts.type, opts.lang));

  const admin = await createAdminClient();
  const { data: current } = await admin.auth.admin.getUserById(opts.userId);
  const sentAt = current.user?.recovery_sent_at ? Date.parse(current.user.recovery_sent_at) : 0;
  if (Date.now() - sentAt < COOLDOWN_MS) return { ok: false, reason: "rate_limited" };

  const { data, error } = await admin.auth.admin.generateLink({ type: opts.type, email: opts.email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[auth] generateLink failed:", error?.code ?? error?.message ?? "no token");
    return { ok: false, reason: "failed" };
  }

  const mail = renderAuthEmail({
    type: opts.type,
    lang: opts.lang,
    code: data.properties.email_otp,
    link: confirmLink(origin, opts.type, opts.lang, tokenHash),
  });
  try {
    await sendMail({ to: opts.email, ...mail });
    return { ok: true };
  } catch (e) {
    console.error("[auth] SMTP send failed:", e instanceof Error ? e.message : e);
    return { ok: false, reason: "failed" };
  }
}

async function viaSupabase(type: AuthEmailType, email: string, redirectTo: string): Promise<AuthEmailResult> {
  const auth = createAnonAuthClient().auth;
  const { error } =
    type === "recovery"
      ? await auth.resetPasswordForEmail(email, { redirectTo })
      : await auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
  if (!error) return { ok: true };
  console.error("[auth] Supabase email not sent:", error.code ?? error.message);
  return { ok: false, reason: /rate|seconds|limit/i.test(error.message) ? "rate_limited" : "failed" };
}
