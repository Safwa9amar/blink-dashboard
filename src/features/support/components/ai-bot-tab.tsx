"use client";

import { useEffect, useState } from "react";
import { Card, Button, Toggle, FormRow, Spinner, fInput } from "@/components/ui";
import {
  getAiSettingsAction,
  saveAiSettings,
  fetchAiModels,
} from "@/app/d/support/action";
import type { AiSettings } from "@/app/d/support/ai-data";
import type { TFn } from "../types";

const PROVIDERS: AiSettings["provider"][] = ["openrouter", "ollama", "lmstudio"];

const DEFAULTS: AiSettings = {
  provider: "openrouter",
  model: null,
  temperature: 0.3,
  max_tokens: 600,
  reasoning: false,
  bot_enabled: true,
  system_prompt_extra: null,
};

export function AiBotTab({ t }: { t: TFn }) {
  // Local editable copy of the settings, hydrated from the server on mount.
  const [form, setForm] = useState<AiSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

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
    });
    setSaving(false);
    setResult(error ? { ok: false, msg: error } : { ok: true, msg: t("ai.saved") });
  }

  return (
    <div className="max-w-[680px]">
      <Card
        title={t("ai.title")}
        description={t("ai.keys_note")}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-text">{t("ai.enabled")}</span>
            <Toggle on={form.bot_enabled} onClick={() => set("bot_enabled", !form.bot_enabled)} />
          </div>
        }
      >
        {!loaded ? (
          <div className="flex items-center gap-2 py-8 text-subtext text-sm">
            <Spinner /> {t("ai.loading_models")}
          </div>
        ) : (
          <>
            {/* Provider */}
            <FormRow label={t("ai.provider")}>
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
              label={t("ai.model")}
              hint={modelsLoading ? t("ai.loading_models") : undefined}
            >
              {models.length > 0 && (
                <select
                  className={`${fInput} mb-2`}
                  value={models.includes(form.model ?? "") ? (form.model ?? "") : ""}
                  onChange={(e) => set("model", e.target.value || null)}
                  disabled={modelsLoading}
                >
                  <option value="">{t("ai.model_ph")}</option>
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
                placeholder={t("ai.model_ph")}
              />
            </FormRow>

            {/* Temperature */}
            <FormRow label={t("ai.temperature")} hint={form.temperature.toFixed(1)}>
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
            <FormRow label={t("ai.max_tokens")}>
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
            <FormRow label={t("ai.reasoning")}>
              <Toggle on={form.reasoning} onClick={() => set("reasoning", !form.reasoning)} />
            </FormRow>

            {/* System prompt addendum */}
            <FormRow label={t("ai.prompt_extra")}>
              <textarea
                className={`${fInput} min-h-[120px] resize-y`}
                value={form.system_prompt_extra ?? ""}
                onChange={(e) => set("system_prompt_extra", e.target.value)}
                placeholder={t("ai.prompt_extra_ph")}
              />
            </FormRow>

            <div className="flex items-center gap-3 pt-1">
              <Button loading={saving} onClick={onSave}>
                {t("ai.save")}
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
