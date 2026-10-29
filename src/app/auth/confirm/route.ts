import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/auth/origin";
import { safeNext } from "@/lib/auth/redirect";

const TYPES: readonly EmailOtpType[] = ["recovery", "magiclink", "email", "signup", "invite", "email_change"];

// Landing point of the links in our auth emails: exchanges token_hash for a session (cookies)
// and forwards to `next`. Anything missing/expired goes back to /login with a localized error.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = TYPES.find((t) => t === params.get("type"));
  const origin = await requestOrigin();
  const fail = () => NextResponse.redirect(`${origin}/login?error=link_expired`);

  if (!tokenHash || !type) return fail();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return fail();

  // A recovery link can only ever lead to the reset form.
  const target = type === "recovery" ? "/login/reset" : safeNext(params.get("next"));
  const res = NextResponse.redirect(`${origin}${target}`);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
