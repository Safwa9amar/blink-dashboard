import type { SupabaseClient } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth/redirect";
import { checkDashboardAccess } from "./action";
import type { AuthErrorKey } from "./errors";

type Router = { push: (href: string) => void; refresh: () => void };

/**
 * Shared step after any successful sign-in (password, email code, passkey, reset):
 * staff check -> MFA challenge -> forced password change -> original page.
 * Returns an error key when the user must stay on the form; otherwise navigates.
 */
export async function finishSignIn(
  supabase: SupabaseClient,
  router: Router,
  next: string | null | undefined,
): Promise<AuthErrorKey | null> {
  const access = await checkDashboardAccess();
  if (!access.ok) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return access.error;
  }

  const target = safeNext(next);
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
    router.push(`/login/mfa?next=${encodeURIComponent(target)}`);
    router.refresh();
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  router.push(user?.app_metadata?.must_change_password ? "/login/password" : target);
  router.refresh();
  return null;
}
