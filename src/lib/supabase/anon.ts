import { createClient } from "@supabase/supabase-js";

// Server-only, throwaway anon client for auth calls that must not touch the viewer's
// cookies: sending sign-in codes and reset emails, or verifying a password. Implicit
// flow so emailed links carry a token_hash instead of a PKCE code bound to this request.
export function createAnonAuthClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
