"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard, InputField } from "./settings-field";
import { createClient } from "@/lib/supabase/client";
import { changeOwnPassword } from "@/app/d/access/action";
import { TwoFactorCard, PasskeysCard } from "@/features/account-security";

const KNOWN_ERRORS = ["wrong_password", "weak_password", "same_password", "not_signed_in"];

export function SecuritySettings() {
  const ts = useTranslations("settings.security");
  const tp = useTranslations("accountSecurity.password");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");

  async function handlePasswordChange() {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(ts("password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await changeOwnPassword({ currentPassword, newPassword });
      if (res.error) {
        setError(KNOWN_ERRORS.includes(res.error) ? tp(res.error as never) : tp("change_failed"));
      } else {
        await createClient().auth.refreshSession();
        setSuccess(ts("password_updated"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError(tp("change_failed"));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={ts("change_password")}
        description={ts("title")}
        footer={
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
            {success && <span className="text-sm text-[var(--success)]">{success}</span>}
            <Button variant="primary" size="sm" loading={loading} onClick={handlePasswordChange}>
              {loading ? ts("updating") : ts("update_password")}
            </Button>
          </div>
        }
      >
        <div className="max-w-md space-y-4">
          <InputField label={ts("current_password")} value={currentPassword} onChange={setCurrentPassword} type="password" />
          <InputField label={ts("new_password")} value={newPassword} onChange={setNewPassword} type="password" />
          <InputField label={ts("confirm_password")} value={confirmPassword} onChange={setConfirmPassword} type="password" />
        </div>
      </SectionCard>

      <TwoFactorCard />
      <PasskeysCard />

      <SectionCard title={ts("title")} description={ts("description")}>
        <div className="max-w-md space-y-4">
          <InputField label={ts("session_timeout")} value={sessionTimeout} onChange={setSessionTimeout} type="number" />
        </div>
      </SectionCard>
    </div>
  );
}
