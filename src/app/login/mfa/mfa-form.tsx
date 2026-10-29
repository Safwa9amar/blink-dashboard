"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth/redirect";
import { CodeInput, isCompleteCode, mfaErrorKey, verifiedTotp } from "@/features/account-security";

type Factor = { id: string; friendly_name?: string };

export function MfaForm() {
  const t = useTranslations("accountSecurity");
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [supabase] = useState(() => createClient());

  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const proceed = useCallback(
    async (mustChange: boolean) => {
      router.replace(mustChange ? "/login/password" : safeNext(next));
      router.refresh();
    },
    [router, next],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      const mustChange = user.app_metadata?.must_change_password === true;
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (aal?.currentLevel === "aal2" || aal?.nextLevel !== "aal2") {
        await proceed(mustChange);
        return;
      }
      const { data } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      const list = verifiedTotp(data?.all ?? []);
      setFactors(list);
      setFactorId(list[0]?.id ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, proceed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !isCompleteCode(code)) return;
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (err) {
      setError(t(`errors.${mfaErrorKey(err)}` as never));
      setCode("");
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await proceed(user?.app_metadata?.must_change_password === true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (factors === null) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 p-8 bg-card rounded-2xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/blink-logo.png" alt="Blink" width={98} height={27} className="mb-2" />
          <h1 className="text-text text-lg font-semibold">{t("challenge.title")}</h1>
          <p className="text-subtext text-sm text-center">{t("challenge.subtitle")}</p>
        </div>

        {factors.length === 0 ? (
          <p className="text-sm text-subtext text-center">{t("challenge.no_factor")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {factors.length > 1 && (
              <div>
                <label htmlFor="factor" className="block text-sm font-medium text-subtext mb-1.5">
                  {t("challenge.factor")}
                </label>
                <select
                  id="factor"
                  value={factorId}
                  onChange={(e) => setFactorId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {factors.map((f, i) => (
                    <option key={f.id} value={f.id}>
                      {f.friendly_name || `${t("mfa.factor_name")} ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <CodeInput id="code" label={t("challenge.code_label")} value={code} onChange={setCode} autoFocus />

            {error && (
              <div className="px-4 py-3 bg-danger-light border border-danger/20 rounded-xl">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} disabled={!isCompleteCode(code)} className="w-full">
              {loading ? t("challenge.verifying") : t("challenge.submit")}
            </Button>
          </form>
        )}

        <p className="text-xs text-subtext text-center">{t("challenge.lost")}</p>

        <div className="flex items-center justify-between">
          <button type="button" onClick={handleSignOut} className="text-sm text-subtext hover:text-text cursor-pointer">
            {t("challenge.sign_out")}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
