"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Badge, Button, Modal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { recordMfaChange } from "@/app/d/settings/security/action";
import { isCompleteCode, mfaErrorKey, staleUnverifiedTotp, verifiedTotp } from "../helpers";
import { CodeInput } from "./code-input";

type Enrollment = { factorId: string; qr: string; secret: string };
type Verified = { id: string; friendly_name?: string; created_at: string };

export function TwoFactorCard() {
  const t = useTranslations("accountSecurity");
  const locale = useLocale();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [factor, setFactor] = useState<Verified | null | undefined>(undefined);
  const [notice, setNotice] = useState("");

  // Enroll modal
  const [setupOpen, setSetupOpen] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [copied, setCopied] = useState(false);
  const pending = useRef<string | null>(null);

  // Turn-off modal
  const [offOpen, setOffOpen] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [offCode, setOffCode] = useState("");
  const [offError, setOffError] = useState("");

  const errText = (e: Parameters<typeof mfaErrorKey>[0]) => t(`errors.${mfaErrorKey(e)}` as never);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const first = verifiedTotp(data?.all ?? [])[0];
    setFactor(first ?? null);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const dropPending = useCallback(async () => {
    const id = pending.current;
    pending.current = null;
    if (id) await supabase.auth.mfa.unenroll({ factorId: id });
  }, [supabase]);

  async function openSetup() {
    setNotice("");
    setSetupError("");
    setCode("");
    setEnrollment(null);
    setSetupOpen(true);
    setBusy(true);
    // Stale unverified factors would make enroll fail on a duplicate friendly name.
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of staleUnverifiedTotp(list?.all ?? [])) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: t("mfa.friendly_name"),
      issuer: "Blink Admin",
    });
    setBusy(false);
    if (err || !data) {
      setSetupError(errText(err));
      return;
    }
    pending.current = data.id;
    setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function closeSetup() {
    setSetupOpen(false);
    setEnrollment(null);
    await dropPending();
  }

  async function verifySetup(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment || !isCompleteCode(code)) return;
    setBusy(true);
    setSetupError("");
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code });
    if (err) {
      setBusy(false);
      setSetupError(errText(err));
      return;
    }
    pending.current = null; // verified: keep the factor
    await supabase.auth.refreshSession();
    await recordMfaChange("added");
    setBusy(false);
    setSetupOpen(false);
    setEnrollment(null);
    setNotice(t("mfa.enabled_toast"));
    await load();
    router.refresh();
  }

  async function copySecret() {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function openOff() {
    setNotice("");
    setOffError("");
    setOffCode("");
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setNeedsCode(data?.currentLevel !== "aal2");
    setOffOpen(true);
  }

  async function confirmOff(e: React.FormEvent) {
    e.preventDefault();
    if (!factor) return;
    if (needsCode && !isCompleteCode(offCode)) return;
    setBusy(true);
    setOffError("");
    if (needsCode) {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: offCode });
      if (err) {
        setBusy(false);
        setOffError(errText(err));
        return;
      }
    }
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (err) {
      setBusy(false);
      setOffError(errText(err));
      return;
    }
    await supabase.auth.refreshSession();
    await recordMfaChange("removed");
    setBusy(false);
    setOffOpen(false);
    setNotice(t("mfa.disabled_toast"));
    await load();
    router.refresh();
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-text">{t("mfa.title")}</h3>
          <p className="text-sm text-subtext mt-1">{t("mfa.description")}</p>
        </div>
        {factor !== undefined && (
          <Badge variant={factor ? "success" : "default"}>{factor ? t("mfa.status_on") : t("mfa.status_off")}</Badge>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-subtext">
          {factor
            ? `${factor.friendly_name || t("mfa.factor_name")} · ${t("mfa.added_on", { date: date(factor.created_at) })}`
            : factor === null
              ? t("mfa.off_hint")
              : ""}
        </p>
        {factor === null && (
          <Button size="sm" onClick={openSetup}>
            {t("mfa.set_up")}
          </Button>
        )}
        {factor && (
          <Button size="sm" variant="danger" onClick={openOff}>
            {t("mfa.turn_off")}
          </Button>
        )}
      </div>
      {notice && <p className="mt-3 text-sm text-success">{notice}</p>}

      <Modal open={setupOpen} onClose={closeSetup} title={t("mfa.setup_title")}>
        <form onSubmit={verifySetup} className="space-y-4">
          {!enrollment && busy && <p className="text-sm text-subtext">{t("mfa.preparing")}</p>}
          {enrollment && (
            <>
              <p className="text-sm text-text">{t("mfa.step_scan")}</p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enrollment.qr} alt={t("mfa.qr_alt")} className="w-44 h-44 bg-white rounded-lg p-2" />
              </div>
              <p className="text-xs text-subtext">{t("mfa.step_manual")}</p>
              <div className="flex items-center gap-2">
                <code dir="ltr" className="flex-1 min-w-0 break-all px-3 py-2 rounded-lg bg-muted text-xs text-text">
                  {enrollment.secret}
                </code>
                <Button type="button" size="sm" variant="secondary" onClick={copySecret}>
                  {copied ? t("mfa.copied") : t("mfa.copy")}
                </Button>
              </div>
              <p className="text-sm text-text">{t("mfa.step_code")}</p>
              <CodeInput id="mfa-setup-code" label={t("mfa.code_label")} value={code} onChange={setCode} autoFocus />
            </>
          )}
          {setupError && <p className="text-sm text-danger">{setupError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeSetup}>
              {t("mfa.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={busy && !!enrollment} disabled={!enrollment || !isCompleteCode(code)}>
              {t("mfa.verify")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={offOpen} onClose={() => setOffOpen(false)} title={t("mfa.off_title")}>
        <form onSubmit={confirmOff} className="space-y-4">
          <p className="text-sm text-subtext">{t("mfa.off_body")}</p>
          {needsCode && (
            <>
              <p className="text-sm text-text">{t("mfa.off_code_body")}</p>
              <CodeInput id="mfa-off-code" label={t("mfa.code_label")} value={offCode} onChange={setOffCode} autoFocus />
            </>
          )}
          {offError && <p className="text-sm text-danger">{offError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOffOpen(false)}>
              {t("mfa.keep_on")}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="danger"
              loading={busy}
              disabled={needsCode && !isCompleteCode(offCode)}
            >
              {t("mfa.confirm_off")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
