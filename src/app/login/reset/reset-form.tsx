"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH } from "@/features/access/password-policy";
import { AuthShell, ErrorBox } from "../auth-shell";
import { PasswordField } from "../password-field";
import { completePasswordReset } from "../action";
import { finishSignIn } from "../finish";
import type { AuthErrorKey } from "../errors";

export function ResetForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorKey, setErrorKey] = useState<AuthErrorKey | "mismatch" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    if (password !== confirm) {
      setErrorKey("mismatch");
      return;
    }
    setLoading(true);
    try {
      const res = await completePasswordReset(password);
      if (!res.ok) {
        setErrorKey(res.error);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      // Pick up the cleared must_change_password flag, then run the usual MFA / landing steps.
      await supabase.auth.refreshSession();
      const key = await finishSignIn(supabase, router, "/");
      if (key) {
        setErrorKey(key);
        setLoading(false);
      }
    } catch {
      setErrorKey("generic");
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new" className="block text-sm font-medium text-subtext mb-1.5">
            {t("reset.new")}
          </label>
          <PasswordField id="new" value={password} onChange={setPassword} autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
          <p className="text-xs text-subtext mt-1.5">{t("reset.hint", { min: MIN_PASSWORD_LENGTH })}</p>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-subtext mb-1.5">
            {t("reset.confirm")}
          </label>
          <PasswordField id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>
        {errorKey && <ErrorBox>{errorKey === "mismatch" ? t("reset.mismatch") : t(`errors.${errorKey}`)}</ErrorBox>}
        <Button type="submit" loading={loading} className="w-full">
          {loading ? t("reset.saving") : t("reset.submit")}
        </Button>
      </form>
      <div className="text-center">
        <Link href="/auth/signout" className="text-sm text-subtext hover:text-text">
          {t("forgot.back")}
        </Link>
      </div>
    </AuthShell>
  );
}
