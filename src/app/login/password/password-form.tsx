"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { changeOwnPassword } from "@/app/d/access/action";

const INPUT =
  "w-full px-4 py-3 bg-background border border-border rounded-xl text-text placeholder-subtext/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
const KNOWN_ERRORS = ["wrong_password", "weak_password", "same_password", "not_signed_in"];

export function PasswordForm() {
  const t = useTranslations("auth.password");
  const router = useRouter();
  // null until the session is read; forced = signed in with a temporary password.
  const [forced, setForced] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (!user) {
          router.replace("/login");
          return;
        }
        setForced(user.app_metadata?.must_change_password === true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError(t("mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await changeOwnPassword({
        currentPassword: current,
        newPassword: next,
      });
      if (res.error) {
        setError(KNOWN_ERRORS.includes(res.error) ? t(`errors.${res.error}` as never) : t("errors.generic"));
        setLoading(false);
        return;
      }
      // Refresh the session so the new app_metadata (flag cleared) reaches the layout.
      await createClient().auth.refreshSession();
      router.replace("/");
      router.refresh();
    } catch {
      setError(t("errors.generic"));
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (forced === null) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 p-8 bg-card rounded-2xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/blink-logo.png" alt="Blink" width={98} height={27} className="mb-2" />
          <h1 className="text-text text-lg font-semibold">{forced ? t("forced_title") : t("title")}</h1>
          <p className="text-subtext text-sm text-center">{forced ? t("forced_subtitle") : t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="current" className="block text-sm font-medium text-subtext mb-1.5">
              {forced ? t("temporary") : t("current")}
            </label>
            <input
              id="current"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="new" className="block text-sm font-medium text-subtext mb-1.5">
              {t("new")}
            </label>
            <input
              id="new"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={10}
              className={INPUT}
            />
            <p className="text-xs text-subtext mt-1.5">{t("hint")}</p>
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-subtext mb-1.5">
              {t("confirm")}
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={INPUT}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger-light border border-danger/20 rounded-xl">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? t("saving") : t("submit")}
          </Button>
        </form>

        <div className="flex items-center justify-between">
          {forced ? (
            <button type="button" onClick={handleSignOut} className="text-sm text-subtext hover:text-text cursor-pointer">
              {t("sign_out")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-subtext hover:text-text cursor-pointer"
            >
              {t("back")}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
