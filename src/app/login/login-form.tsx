"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Segmented } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, ErrorBox, INPUT } from "./auth-shell";
import { CodeField } from "./code-field";
import { PasswordField } from "./password-field";
import { requestSignInCode } from "./action";
import { finishSignIn } from "./finish";
import { mapAuthError, type AuthErrorKey } from "./errors";

type Method = "password" | "code";
const RESEND_SECONDS = 60;
const noopSubscribe = () => () => {};

export function LoginForm({ urlError, next }: { urlError: AuthErrorKey | null; next: string | null }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [method, setMethod] = useState<Method>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(urlError);
  const [loading, setLoading] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  // false on the server / first paint, then the real answer (no hydration mismatch).
  const passkeySupported = useSyncExternalStore(
    noopSubscribe,
    () => typeof window.PublicKeyCredential !== "undefined",
    () => false,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const busy = loading || passkeyBusy;

  function switchMethod(m: Method) {
    setMethod(m);
    setErrorKey(null);
  }

  async function complete() {
    const key = await finishSignIn(createClient(), router, next);
    if (key) {
      setErrorKey(key);
      setLoading(false);
      setPasskeyBusy(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorKey(null);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setErrorKey(mapAuthError(error) ?? "generic");
        setLoading(false);
        return;
      }
      await complete();
    } catch {
      setErrorKey("generic");
      setLoading(false);
    }
  }

  async function sendCode() {
    setLoading(true);
    setErrorKey(null);
    try {
      const res = await requestSignInCode(email, locale);
      if (!res.ok) {
        setErrorKey(res.error);
      } else {
        setCodeSent(true);
        setCode("");
        setCooldown(RESEND_SECONDS);
      }
    } catch {
      setErrorKey("generic");
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorKey(null);
    try {
      const { error } = await createClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "email" });
      if (error) {
        setErrorKey(mapAuthError(error) ?? "generic");
        setLoading(false);
        return;
      }
      await complete();
    } catch {
      setErrorKey("generic");
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyBusy(true);
    setErrorKey(null);
    try {
      const { error } = await createClient().auth.signInWithPasskey();
      if (error) {
        // Dismissing the browser prompt maps to null: stay quiet.
        setErrorKey(mapAuthError(error));
        setPasskeyBusy(false);
        return;
      }
      await complete();
    } catch (e) {
      setErrorKey(mapAuthError(e as Error) ?? "generic");
      setPasskeyBusy(false);
    }
  }

  return (
    <AuthShell subtitle={t("subtitle")}>
      <div className="flex justify-center">
        <Segmented<Method>
          options={[
            ["password", t("method_password")],
            ["code", t("method_code")],
          ]}
          value={method}
          onChange={switchMethod}
        />
      </div>

      {method === "password" && (
        <form onSubmit={handlePassword} className="space-y-5">
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-subtext">
                {tc("password")}
              </label>
              <Link href="/login/forgot" className="text-xs text-primary hover:underline">
                {t("forgot_link")}
              </Link>
            </div>
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder={t("password_placeholder")}
            />
          </div>
          {errorKey && <ErrorBox>{t(`errors.${errorKey}`)}</ErrorBox>}
          <Button type="submit" loading={loading} disabled={busy} className="w-full">
            {loading ? tc("signing_in") : tc("sign_in")}
          </Button>
        </form>
      )}

      {method === "code" && !codeSent && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="code-email" className="block text-sm font-medium text-subtext mb-1.5">
              {tc("email")}
            </label>
            <input
              id="code-email"
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
          <Button type="submit" loading={loading} disabled={busy} className="w-full">
            {loading ? t("sending") : t("send_code")}
          </Button>
        </form>
      )}

      {method === "code" && codeSent && (
        <form onSubmit={handleVerify} className="space-y-5">
          <p className="text-sm text-subtext text-center">{t("code_sent", { email: email.trim() })}</p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-subtext mb-1.5">
              {t("code_label")}
            </label>
            <CodeField id="code" value={code} onChange={setCode} />
          </div>
          {errorKey && <ErrorBox>{t(`errors.${errorKey}`)}</ErrorBox>}
          <Button type="submit" loading={loading} disabled={busy || code.length !== 6} className="w-full">
            {loading ? t("verifying") : t("verify")}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy || cooldown > 0}
              className="text-primary hover:underline disabled:text-subtext disabled:no-underline cursor-pointer disabled:cursor-default"
            >
              {cooldown > 0 ? t("resend_in", { seconds: cooldown }) : t("resend")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setErrorKey(null);
              }}
              className="text-subtext hover:text-text cursor-pointer"
            >
              {t("different_email")}
            </button>
          </div>
        </form>
      )}

      {passkeySupported && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-subtext">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="secondary" loading={passkeyBusy} disabled={busy} onClick={handlePasskey} className="w-full">
            {passkeyBusy ? t("passkey_waiting") : t("passkey_button")}
          </Button>
          <p className="text-xs text-subtext text-center">{t("passkey_hint")}</p>
        </div>
      )}
    </AuthShell>
  );
}
