"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard, InputField, ToggleField } from "./settings-field";
import { createClient } from "@/lib/supabase/client";

export function SecuritySettings() {
  const ts = useTranslations("settings.security");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [require2fa, setRequire2fa] = useState(false);

  async function handlePasswordChange() {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(ts("password_mismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(ts("password_updated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

      <SectionCard title={ts("title")} description={ts("description")}>
        <div className="max-w-md space-y-4">
          <InputField label={ts("session_timeout")} value={sessionTimeout} onChange={setSessionTimeout} type="number" />
          <ToggleField label={ts("require_2fa")} checked={require2fa} onChange={setRequire2fa} />
        </div>
      </SectionCard>
    </div>
  );
}
