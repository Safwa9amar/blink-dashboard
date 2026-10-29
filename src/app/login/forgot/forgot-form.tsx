"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, ErrorBox, INPUT } from "../auth-shell";
import { CodeField } from "../code-field";
import { requestPasswordReset } from "../action";
import { mapAuthError, type AuthErrorKey } from "../errors";

export function ForgotForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorKey(null);
    try {
      const res = await requestPasswordReset(email, locale);
      if (res.ok) setSent(true);
      else setErrorKey(res.error);
    } catch {
      setErrorKey("generic");
    }
    setLoading(false);
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorKey(null);
    try {
      const { error } = await createClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "recovery" });
      if (error) {
        setErrorKey(mapAuthError(error) ?? "generic");
        setLoading(false);
        return;
      }
      router.push("/login/reset");
      router.refresh();
    } catch {
      setErrorKey("generic");
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("forgot.title")} subtitle={sent ? undefined : t("forgot.subtitle")}>
      {!sent ? (
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-subtext mb-1.5">
              {tc("email")}
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={INPUT}
              placeholder={t("email_placeholder")}
            />
          </div>
          {errorKey && <ErrorBox>{t(`errors.${errorKey}`)}</ErrorBox>}
          <Button type="submit" loading={loading} className="w-full">
            {loading ? t("sending") : t("forgot.send")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleCode} className="space-y-5">
          <p role="status" className="text-sm text-text text-center">
            {t("forgot.sent")}
          </p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-subtext mb-1.5">
              {t("forgot.or_code")}
            </label>
            <CodeField id="code" value={code} onChange={setCode} />
          </div>
          {errorKey && <ErrorBox>{t(`errors.${errorKey}`)}</ErrorBox>}
          <Button type="submit" loading={loading} disabled={code.length !== 6} className="w-full">
            {loading ? t("verifying") : t("verify")}
          </Button>
        </form>
      )}
      <div className="text-center">
        <Link href="/login" className="text-sm text-subtext hover:text-text">
          {t("forgot.back")}
        </Link>
      </div>
    </AuthShell>
  );
}
