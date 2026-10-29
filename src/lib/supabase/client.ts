import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Passkeys (WebAuthn) are experimental in auth-js; the server answers
    // `passkey_disabled` until an admin turns them on.
    { auth: { experimental: { passkey: true } } },
  );
}
