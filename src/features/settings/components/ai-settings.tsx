"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Badge } from "@/components/ui";
import { PROVIDERS, PROVIDER_LIST, type Provider } from "@/lib/ai/providers";
import type { LMModel } from "@/lib/ai";
import { aiStatus, aiLoadModel, aiUnloadModel } from "@/app/d/settings/ai/action";
import { useAISettingsStore, activeBaseUrl } from "../ai-store";
import { SectionCard, InputField, SelectField } from "./settings-field";

// Settings → AI. Picks the local inference provider (LM Studio or Ollama) and its
// base URL, lists that provider's models with load state, loads/unloads (stops)
// them, and stores the generation defaults the compose form forwards on each run.
export function AISettings() {
  const t = useTranslations("settings");
  const ta = useTranslations("settings.ai");
  const store = useAISettingsStore();
  const baseUrl = activeBaseUrl(store);

  // Local editable copies — committed to the store on Save (mirrors NewsSettings).
  const [model, setModel] = useState(store.model);
  const [temperature, setTemperature] = useState(String(store.temperature));
  const [maxTokens, setMaxTokens] = useState(String(store.maxTokens));
  const [contextLength, setContextLength] = useState(String(store.contextLength));
  const [ttl, setTtl] = useState(String(store.ttl));

  const [models, setModels] = useState<LMModel[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<null | "test" | "load" | "unload">(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Awaits before touching state so it's safe to call from the mount effect.
  const refresh = useCallback(async (provider: Provider, url: string) => {
    const res = await aiStatus({ provider, baseUrl: url });
    setOk(res.ok);
    setModels(res.models);
    setError(res.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch on mount; refresh() awaits before any setState
    void refresh(store.provider, baseUrl);
  }, [refresh, store.provider, baseUrl]);

  async function handleTest() {
    setBusy("test");
    await refresh(store.provider, baseUrl);
    setBusy(null);
  }

  function changeProvider(v: string) {
    store.setProvider(v as Provider);
    setModel(""); // ids don't carry across providers
  }

  // Build the model dropdown: an "auto-detect" entry, then every known model with
  // its load state. Keep a stored-but-missing model selectable so it isn't lost.
  const known = new Set(models.map((m) => m.id));
  const modelOptions = [
    { value: "", label: ta("auto") },
    ...models.map((m) => ({
      value: m.id,
      label: m.state === "loaded" ? `${m.id} • ${ta("loaded")}` : m.id,
    })),
    ...(model && !known.has(model) ? [{ value: model, label: model }] : []),
  ];

  const conn = { provider: store.provider, baseUrl };

  async function handleLoad() {
    if (!model) {
      setError(ta("pick_model"));
      return;
    }
    setBusy("load");
    setError(null);
    const res = await aiLoadModel(conn, model, Number(contextLength) || 0);
    if (res.error) setError(res.error);
    setBusy(null);
    await refresh(store.provider, baseUrl);
  }

  async function handleUnload() {
    const target = model || models.find((m) => m.state === "loaded")?.id || "";
    if (!target) {
      setError(ta("no_loaded"));
      return;
    }
    setBusy("unload");
    setError(null);
    const res = await aiUnloadModel(conn, target);
    if (res.error) setError(res.error);
    setBusy(null);
    await refresh(store.provider, baseUrl);
  }

  function handleSave() {
    store.setModel(model);
    store.setTemperature(Number(temperature));
    store.setMaxTokens(Number(maxTokens));
    store.setContextLength(Number(contextLength) || 0);
    store.setTtl(Number(ttl) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const providerOptions = PROVIDER_LIST.map((p) => ({ value: p, label: PROVIDERS[p].label }));

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <SectionCard
        title={ta("connection")}
        description={ta("connection_desc")}
        footer={
          <Button variant="secondary" size="sm" onClick={handleTest} loading={busy === "test"}>
            {ta("test")}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label={ta("provider")}
            value={store.provider}
            onChange={changeProvider}
            options={providerOptions}
          />
          <InputField
            label={ta("base_url")}
            value={baseUrl}
            onChange={store.setBaseUrl}
            placeholder={PROVIDERS[store.provider].defaultBaseUrl}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          {ok !== null && (
            <Badge variant={ok ? "success" : "danger"}>{ok ? ta("connected") : ta("offline")}</Badge>
          )}
          <span className="text-xs text-[var(--subtext)]">{ta("base_url_hint")}</span>
        </div>
      </SectionCard>

      <SectionCard title={ta("model")} description={ta("model_desc")}>
        <SelectField label={ta("model_label")} value={model} onChange={setModel} options={modelOptions} />
        {store.provider === "lmstudio" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={ta("context_length")}
              value={contextLength}
              onChange={setContextLength}
              type="number"
              placeholder="0"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button variant="secondary" size="sm" icon="download" onClick={handleLoad} loading={busy === "load"} disabled={!model}>
            {ta("load")}
          </Button>
          <Button variant="secondary" size="sm" icon="x" onClick={handleUnload} loading={busy === "unload"}>
            {ta("unload")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--subtext)]">
          {store.provider === "ollama" ? ta("model_hint_ollama") : ta("model_hint")}
        </p>
      </SectionCard>

      <SectionCard
        title={ta("generation")}
        description={ta("generation_desc")}
        footer={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-[var(--success)]">{t("saved")}</span>}
            <Button variant="primary" size="sm" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label={ta("temperature")} value={temperature} onChange={setTemperature} type="number" />
          <InputField label={ta("max_tokens")} value={maxTokens} onChange={setMaxTokens} type="number" />
          <InputField label={ta("ttl")} value={ttl} onChange={setTtl} type="number" />
        </div>
        <p className="mt-3 text-xs text-[var(--subtext)]">{ta("generation_hint")}</p>
      </SectionCard>
    </div>
  );
}
