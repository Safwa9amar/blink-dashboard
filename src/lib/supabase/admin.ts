import { createServerClient } from "@supabase/ssr";
import { createClient as createSsrClient } from "./server";

// Privileged, SERVER-ONLY Supabase client for the admin console.
//
// When SUPABASE_SERVICE_ROLE_KEY is set it returns a service-role client that
// bypasses RLS — needed so the news console can read drafts/scheduled posts and
// write them, while the `news_select_published` policy keeps the mobile app
// scoped to published posts. Without the key it falls back to the RLS-respecting
// SSR client, so nothing breaks — the console just sees what RLS allows.
//
// Built with the same @supabase/ssr factory as the SSR client (just with the
// service key + no-op cookies, so it never reads a user session) to avoid any
// runtime quirks. NEVER import this from a client component.
export async function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }
  return createSsrClient();
}

export const hasServiceRole = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;
