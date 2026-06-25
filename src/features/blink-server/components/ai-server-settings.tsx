"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  Badge,
  Toggle,
  Segmented,
  FormRow,
  Spinner,
  fInput,
} from "@/components/ui";
import {
  getAiServerSettingsAction,
  saveAiServer,
  fetchAiModels,
  type ProviderConfigPatch,
} from "@/app/d/blink-server/ai-server-action";
import {
  PROVIDERS,
  defaultProviderConfig,
  AI_ACTIVE_DEFAULTS,
  type Provider,
  type AiActiveSettings,
  type AiProviderConfig,
  type AiServerSettings,
} from "@/app/d/blink-server/ai-server-shared";

// Settings → AI Server Settings. Bot-level config + the ACTIVE provider live in the
// `ai_settings` singleton; each provider's model / sampling / reasoning / credential
// lives in its own `ai_provider_configs` row. The panel edits all of them and saves
// in one shot via `saveAiServer`. Provider API keys are write-only here — blank
// keeps the existing key; only the masked set/last-4 state is ever shown.

const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: "OpenRouter",
  ollama: "Ollama",
  lmstudio: "LM Studio",
};

const URL_PLACEHOLDER: Record<Provider, string> = {
  openrouter: "",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234",
};

const DEFAULTS: AiServerSettings = {
  active: AI_ACTIVE_DEFAULTS,
  providers: {
    openrouter: defaultProviderConfig("openrouter"),
    ollama: defaultProviderConfig("ollama"),
    lmstudio: defaultProviderConfig("lmstudio"),
  },
};

export function AiServerSettings() {
  const t = useTranslations("blink_server.ai_server");

  // Local editable copy, hydrated from the server on mount.
  const [active, setActive] = useState<AiActiveSettings>(DEFAULTS.active);
  const [providers, setProviders] = useState<Record<Provider, AiProviderConfig>>(
    DEFAULTS.providers
  );
  const [loaded, setLoaded] = useState(false);

  // New API keys are held separately — write-only (blank = keep the existing key).
  // The masked set/last4 state lives in `providers[*]`.
  const [newKeys, setNewKeys] = useState<Record<Provider, string>>({
    openrouter: "",
    ollama: "",
    lmstudio: "",
  });

  // Which provider's config block is visible (defaults to the active one).
  const [tab, setTab] = useState<Provider>("openrouter");

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const setProvider = <K extends keyof AiProviderConfig>(
    provider: Provider,
    key: K,
    value: AiProviderConfig[K]
  ) =>
    setProviders((p) => ({ ...p, [provider]: { ...p[provider], [key]: value } }));

  // Hydrate current settings.
  useEffect(() => {
    let alive = true;
    getAiServerSettingsAction().then(({ settings }) => {
      if (!alive) return;
      setActive(settings.active);
      setProviders(settings.providers);
      setTab(settings.active.provider);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    setSaving(true);
    setResult(null);

    const providerPatches: ProviderConfigPatch[] = PROVIDERS.map((provider) => {
      const cfg = providers[provider];
      const trimmedKey = newKeys[provider].trim();
      const patch: ProviderConfigPatch = {
        provider,
        model: cfg.model && cfg.model.trim() ? cfg.model.trim() : null,
        temperature: cfg.temperature,
        max_tokens: cfg.max_tokens,
        reasoning: cfg.reasoning,
        base_url:
          provider === "openrouter"
            ? null
            : cfg.base_url && cfg.base_url.trim()
              ? cfg.base_url.trim()
              : null,
      };
      // Only OpenRouter carries an API key, and only when a new one was typed.
      if (provider === "openrouter" && trimmedKey) patch.api_key = trimmedKey;
      return patch;
    });

    // This panel owns only the ENGINE columns: the active provider + each
    // provider's config. The bot's on/off + instructions are edited in
    // Support → AI (saveSupportBot), so they're not sent here.
    const { error } = await saveAiServer({
      active: { provider: active.provider },
      providers: providerPatches,
    });

    setSaving(false);
    if (!error) {
      // Reflect any newly-saved key locally (masked) and clear the input.
      const orKey = newKeys.openrouter.trim();
      if (orKey) {
        setProvider("openrouter", "api_key_set", true);
        setProvider("openrouter", "api_key_last4", orKey.slice(-4));
        setNewKeys((k) => ({ ...k, openrouter: "" }));
      }
      setResult({ ok: true, msg: t("saved") });
    } else {
      setResult({ ok: false, msg: error });
    }
  }

  return (
    <div className="max-w-[680px]">
      <Card title={t("title")} description={t("creds_note")}>
        {!loaded ? (
          <div className="flex items-center gap-2 py-8 text-subtext text-sm">
            <Spinner /> {t("loading_models")}
          </div>
        ) : (
          <>
            {/* Active provider — the one the bot actually uses. The bot on/off
                toggle + instructions live in Support → AI. */}
            <FormRow label={t("active_provider")} hint={t("active_provider_note")}>
              <select
                className={fInput}
                value={active.provider}
                onChange={(e) =>
                  setActive((a) => ({ ...a, provider: e.target.value as Provider }))
                }
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* ── Per-provider section ──────────────────────────────────────── */}
            <div className="mt-6 mb-3 border-t border-border pt-5">
              <h4 className="text-[13px] font-bold text-text">{t("providers_section")}</h4>
              <p className="mt-1 text-[12px] text-subtext">{t("providers_note")}</p>
            </div>

            {/* Provider tabs — switch which provider's config block is visible. */}
            <Segmented
              className="mb-5"
              options={PROVIDERS.map((p) => [
                p,
                p === active.provider
                  ? `${PROVIDER_LABELS[p]} · ${t("active_badge")}`
                  : PROVIDER_LABELS[p],
              ])}
              value={tab}
              onChange={setTab}
            />

            {PROVIDERS.map((provider) =>
              provider === tab ? (
                <ProviderBlock
                  key={provider}
                  provider={provider}
                  config={providers[provider]}
                  isActive={provider === active.provider}
                  newKey={newKeys[provider]}
                  onNewKey={(v) => setNewKeys((k) => ({ ...k, [provider]: v }))}
                  onChange={(key, value) => setProvider(provider, key, value)}
                />
              ) : null
            )}

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

// A single provider's config: model (server-list dropdown + free-text override),
// temperature, max tokens, reasoning, and the credential (OpenRouter → masked API
// key; Ollama/LM Studio → base URL). Loads its own model list on mount.
function ProviderBlock({
  provider,
  config,
  isActive,
  newKey,
  onNewKey,
  onChange,
}: {
  provider: Provider;
  config: AiProviderConfig;
  isActive: boolean;
  newKey: string;
  onNewKey: (v: string) => void;
  onChange: <K extends keyof AiProviderConfig>(key: K, value: AiProviderConfig[K]) => void;
}) {
  const t = useTranslations("blink_server.ai_server");
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load the model list for this provider on mount. State is set only after the
  // await, so the effect just synchronizes with the server.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) setModelsLoading(true);
      const { models: list } = await fetchAiModels(provider);
      if (alive) {
        setModels(list);
        setModelsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [provider]);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[13px] font-bold text-text">{PROVIDER_LABELS[provider]}</span>
        {isActive && <Badge variant="primary">{t("active_badge")}</Badge>}
      </div>

      {/* Model — dropdown (server list) + free-text override */}
      <FormRow label={t("model")} hint={modelsLoading ? t("loading_models") : undefined}>
        {models.length > 0 && (
          <select
            className={`${fInput} mb-2`}
            value={models.includes(config.model ?? "") ? (config.model ?? "") : ""}
            onChange={(e) => onChange("model", e.target.value || null)}
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
          value={config.model ?? ""}
          onChange={(e) => onChange("model", e.target.value)}
          placeholder={t("model_ph")}
        />
      </FormRow>

      {/* Temperature */}
      <FormRow label={t("temperature")} hint={config.temperature.toFixed(1)}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.temperature}
          onChange={(e) => onChange("temperature", Number(e.target.value))}
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
          value={config.max_tokens}
          onChange={(e) =>
            onChange("max_tokens", Math.max(1, Math.round(Number(e.target.value) || 0)))
          }
        />
      </FormRow>

      {/* Reasoning */}
      <FormRow label={t("reasoning")}>
        <Toggle on={config.reasoning} onClick={() => onChange("reasoning", !config.reasoning)} />
      </FormRow>

      {/* Credential — OpenRouter → masked API key; others → base URL. */}
      {provider === "openrouter" ? (
        <FormRow
          label={t("openrouter_key")}
          hint={
            config.api_key_set
              ? `${t("key_set")} (…${config.api_key_last4})`
              : t("key_not_set")
          }
          className="mb-0"
        >
          <input
            type="password"
            className={fInput}
            style={{ direction: "ltr" }}
            value={newKey}
            onChange={(e) => onNewKey(e.target.value)}
            placeholder={t("key_keep_ph")}
            autoComplete="new-password"
          />
        </FormRow>
      ) : (
        <FormRow label={t("base_url")} className="mb-0">
          <input
            className={fInput}
            style={{ direction: "ltr" }}
            value={config.base_url ?? ""}
            onChange={(e) => onChange("base_url", e.target.value)}
            placeholder={URL_PLACEHOLDER[provider]}
          />
        </FormRow>
      )}
    </div>
  );
}
