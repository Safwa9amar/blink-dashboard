"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, FormRow, Segmented, Toggle, fInput } from "@/components/ui";
import {
  getAssistantSettings,
  listAssistantModels,
  saveAssistantSettings,
} from "@/app/d/assistant/action";
import { ASSISTANT_DEFAULT_MODEL, ASSISTANT_PROVIDERS, ASSISTANT_SETTINGS_DEFAULTS } from "../settings";
import type { AssistantProvider, AssistantSettings } from "../types";

const PROVIDER_LABELS: Record<AssistantProvider, string> = { openrouter: "OpenRouter", ollama: "Ollama", lmstudio: "LM Studio" };

/** Settings → AI Server → "Staff AI assistant" (super_admin only; the page gates it). */
export function AssistantSettingsCard() {
  const t = useTranslations("assistant.settings");
  const [form, setForm] = useState<AssistantSettings>(ASSISTANT_SETTINGS_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    getAssistantSettings()
      .catch(() => null)
      .then((r) => {
        if (!alive) return;
        if (r && r.error === null) {
          setForm(r.data.settings);
          setPending(r.data.migrationPending);
        } else if (r) setMsg({ kind: "err", text: r.error });
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadModels = useCallback(async (provider: AssistantProvider) => {
    const r = await listAssistantModels(provider).catch(() => null);
    setModels(r && r.error === null ? r.data : []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch suggestions for the selected provider
    if (loaded) void loadModels(form.assistant_provider);
  }, [loaded, form.assistant_provider, loadModels]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const r = await saveAssistantSettings(form).catch((e: Error) => ({ error: e.message }));
    setSaving(false);
    setMsg(r.error ? { kind: "err", text: r.error } : { kind: "ok", text: t("saved") });
  };

  return (
    <Card
      className="mt-4"
      title={t("title")}
      description={t("description")}
      action={pending ? <Badge variant="warning">{t("migration_pending")}</Badge> : undefined}
    >
      <div className="max-w-xl">
        <FormRow label={t("enabled")} hint={t("enabled_hint")}>
          <Toggle on={form.assistant_enabled} onClick={() => setForm((f) => ({ ...f, assistant_enabled: !f.assistant_enabled }))} />
        </FormRow>
        <FormRow label={t("provider")}>
          <Segmented
            value={form.assistant_provider}
            onChange={(v) => setForm((f) => ({ ...f, assistant_provider: v }))}
            options={ASSISTANT_PROVIDERS.map((p): [AssistantProvider, string] => [p, PROVIDER_LABELS[p]])}
          />
        </FormRow>
        <FormRow label={t("model")} hint={t("model_hint")}>
          <input
            dir="ltr"
            list="assistant-model-suggestions"
            className={fInput}
            value={form.assistant_model ?? ""}
            maxLength={200}
            placeholder={t("model_placeholder", { model: ASSISTANT_DEFAULT_MODEL })}
            onChange={(e) => setForm((f) => ({ ...f, assistant_model: e.target.value }))}
          />
          <datalist id="assistant-model-suggestions">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </FormRow>
        <div className="flex items-center gap-3">
          <Button onClick={save} loading={saving} disabled={!loaded}>
            {t("save")}
          </Button>
          {msg && (
            <span role="status" className={`text-xs ${msg.kind === "ok" ? "text-success" : "text-danger"}`}>
              {msg.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
