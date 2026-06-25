"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, Toggle, FormRow, Spinner, fInput } from "@/components/ui";
import {
  getAiSettingsAction,
  saveAiSettings,
  fetchAiModels,
} from "@/app/d/settings/ai-server-action";
import type { AiSettings } from "@/app/d/settings/ai-server-data";

// Settings → AI Server Settings. Controls the global `ai_settings` row read by the
// support bot (blink-server): provider, model, sampling, reasoning, system-prompt
// addendum, plus per-provider credentials (OpenRouter API key + local URLs). The
// API key is stored encrypted-at-rest in the DB and used by the server bot; it is
// never shown in full here — only its set/last-4 state is surfaced.

const PROVIDERS: AiSettings["provider"][] = ["openrouter", "ollama", "lmstudio"];

const DEFAULTS: AiSettings = {
  provider: "openrouter",
  model: null,
  temperature: 0.3,
  max_tokens: 600,
  reasoning: false,
  bot_enabled: true,
  system_prompt_extra: null,
  openrouter_key_set: false,
  openrouter_key_last4: null,
  ollama_url: null,
  lmstudio_url: null,
};

export function AiServerSettings() {
  const t = useTranslations("settings.ai_server");

  // Local editable copy of the settings, hydrated from the server on mount.
  const [form, setForm] = useState<AiSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // The new OpenRouter key is held separately — it is write-only (blank = keep the
  // existing key). The masked set/last4 state lives in `form`.
  const [newKey, setNewKey] = useState("");

  // Model dropdown: server-provided list for the chosen provider + a free-text
  // field so any model id can be entered (OpenRouter ids, local model names, …).
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const set = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Hydrate current settings.
  useEffect(() => {
    let alive = true;
    getAiSettingsAction().then(({ settings }) => {
      if (alive) {
        setForm(settings);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Load the model list on mount and whenever the provider changes. State is set
  // only after awaits (never synchronously in the effect body) so the effect just
  // synchronizes with the server, not with prior React state.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) setModelsLoading(true);
      const { models: list } = await fetchAiModels(form.provider);
      if (alive) {
        setModels(list);
        setModelsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form.provider]);

  async function onSave() {
    setSaving(true);
    setResult(null);
    const trimmedKey = newKey.trim();
    const { error } = await saveAiSettings({
      provider: form.provider,
      model: form.model && form.model.trim() ? form.model.trim() : null,
      temperature: form.temperature,
      max_tokens: form.max_tokens,
      reasoning: form.reasoning,
      bot_enabled: form.bot_enabled,
      system_prompt_extra:
        form.system_prompt_extra && form.system_prompt_extra.trim()
          ? form.system_prompt_extra
          : null,
      ollama_url: form.ollama_url && form.ollama_url.trim() ? form.ollama_url.trim() : null,
      lmstudio_url:
        form.lmstudio_url && form.lmstudio_url.trim() ? form.lmstudio_url.trim() : null,
      // Only include the key in the patch when the admin typed one — otherwise omit
      // it so the existing key is preserved.
      ...(trimmedKey ? { openrouter_api_key: trimmedKey } : {}),
    });
    setSaving(false);
    if (!error) {
      // A new key was just saved — reflect it locally and clear the input.
      if (trimmedKey) {
        set("openrouter_key_set", true);
        set("openrouter_key_last4", trimmedKey.slice(-4));
        setNewKey("");
      }
      setResult({ ok: true, msg: t("saved") });
    } else {
      setResult({ ok: false, msg: error });
    }
  }

  return (
    <div className="max-w-[680px]">
      <Card
        title={t("title")}
        description={t("creds_note")}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-text">{t("enabled")}</span>
            <Toggle on={form.bot_enabled} onClick={() => set("bot_enabled", !form.bot_enabled)} />
          </div>
        }
      >
        {!loaded ? (
          <div className="flex items-center gap-2 py-8 text-subtext text-sm">
            <Spinner /> {t("loading_models")}
          </div>
        ) : (
          <>
            {/* Provider */}
            <FormRow label={t("provider")}>
              <select
                className={fInput}
                value={form.provider}
                onChange={(e) => {
                  set("provider", e.target.value as AiSettings["provider"]);
                }}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Model — dropdown (server list) + free-text override */}
            <FormRow
              label={t("model")}
              hint={modelsLoading ? t("loading_models") : undefined}
            >
              {models.length > 0 && (
                <select
                  className={`${fInput} mb-2`}
                  value={models.includes(form.model ?? "") ? (form.model ?? "") : ""}
                  onChange={(e) => set("model", e.target.value || null)}
                  disabled={modelsLoading}
                >
                  <option value="">{t("model_ph")}</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
              <input
                className={fInput}
                style={{ direction: "ltr" }}
                value={form.model ?? ""}
                onChange={(e) => set("model", e.target.value)}
                placeholder={t("model_ph")}
              />
            </FormRow>

            {/* Temperature */}
            <FormRow label={t("temperature")} hint={form.temperature.toFixed(1)}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={form.temperature}
                onChange={(e) => set("temperature", Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </FormRow>

            {/* Max tokens */}
            <FormRow label={t("max_tokens")}>
              <input
                type="number"
                min={1}
                step={1}
                className={fInput}
                value={form.max_tokens}
                onChange={(e) => set("max_tokens", Math.max(1, Math.round(Number(e.target.value) || 0)))}
              />
            </FormRow>

            {/* Reasoning */}
            <FormRow label={t("reasoning")}>
              <Toggle on={form.reasoning} onClick={() => set("reasoning", !form.reasoning)} />
            </FormRow>

            {/* System prompt addendum */}
            <FormRow label={t("prompt_extra")}>
              <textarea
                className={`${fInput} min-h-[120px] resize-y`}
                value={form.system_prompt_extra ?? ""}
                onChange={(e) => set("system_prompt_extra", e.target.value)}
                placeholder={t("prompt_extra_ph")}
              />
            </FormRow>

            {/* ── Provider credentials ──────────────────────────────────────── */}
            <div className="mt-6 mb-3 border-t border-border pt-5">
              <h4 className="text-[13px] font-bold text-text">{t("creds")}</h4>
              <p className="mt-1 text-[12px] text-subtext">{t("creds_note")}</p>
            </div>

            {/* OpenRouter API key — write-only; shows masked current state */}
            <FormRow
              label={t("openrouter_key")}
              hint={
                form.openrouter_key_set
                  ? `${t("key_set")} (…${form.openrouter_key_last4})`
                  : t("key_not_set")
              }
            >
              <input
                type="password"
                className={fInput}
                style={{ direction: "ltr" }}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={t("key_keep_ph")}
                autoComplete="new-password"
              />
            </FormRow>

            {/* Ollama URL */}
            <FormRow label={t("ollama_url")}>
              <input
                className={fInput}
                style={{ direction: "ltr" }}
                value={form.ollama_url ?? ""}
                onChange={(e) => set("ollama_url", e.target.value)}
                placeholder="http://localhost:11434"
              />
            </FormRow>

            {/* LM Studio URL */}
            <FormRow label={t("lmstudio_url")}>
              <input
                className={fInput}
                style={{ direction: "ltr" }}
                value={form.lmstudio_url ?? ""}
                onChange={(e) => set("lmstudio_url", e.target.value)}
                placeholder="http://localhost:1234"
              />
            </FormRow>

            <div className="flex items-center gap-3 pt-1">
              <Button loading={saving} onClick={onSave}>
                {t("save")}
              </Button>
              {result && (
                <span
                  className={`text-[13px] font-semibold ${result.ok ? "text-success" : "text-danger"}`}
                >
                  {result.msg}
                </span>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
