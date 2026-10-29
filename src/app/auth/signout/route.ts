import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/auth/origin";

const REASONS = ["no_access", "session_expired"];

// GET so a server redirect (e.g. the staff layout rejecting a non-staff account) can land here.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reason = request.nextUrl.searchParams.get("reason") ?? request.nextUrl.searchParams.get("error");
  const qs = reason && REASONS.includes(reason) ? `?error=${reason}` : "";
  const res = NextResponse.redirect(`${await requestOrigin()}/login${qs}`);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
