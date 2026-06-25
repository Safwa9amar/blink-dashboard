"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, Button, Toggle, FormRow, fInput } from "@/components/ui";
import { saveSupportBot, type SupportBotConfig } from "@/app/d/support/ai-config-action";

// Support → AI. Configures the support BOT (product-level): is it on, and what
// extra instructions does it follow. The provider / model / API keys that power it
// are read-only here (a summary + a link to Settings → AI Server, which owns them).
// The initial config is server-fetched by the page and passed in as `initial`.

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  ollama: "Ollama",
  lmstudio: "LM Studio",
};

export function AiTab({
  initial,
  loadError,
}: {
  initial: SupportBotConfig;
  loadError?: string | null;
}) {
  const t = useTranslations("support.bot");
  const [enabled, setEnabled] = useState(initial.bot_enabled);
  const [systemPrompt, setSystemPrompt] = useState(initial.system_prompt ?? "");
  const [extra, setExtra] = useState(initial.system_prompt_extra ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function onSave() {
    setSaving(true);
    setResult(null);
    const { error } = await saveSupportBot({
      bot_enabled: enabled,
      system_prompt: systemPrompt.trim() ? systemPrompt : null,
      system_prompt_extra: extra.trim() ? extra : null,
    });
    setSaving(false);
    setResult(error ? { ok: false, msg: error } : { ok: true, msg: t("saved") });
  }

  const engineLabel = `${
    PROVIDER_LABELS[initial.active_provider] ?? initial.active_provider
  }${initial.active_model ? ` · ${initial.active_model}` : ""}`;

  return (
    <div className="max-w-[680px]">
      <Card
        title={t("title")}
        description={t("desc")}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-text">{t("enabled")}</span>
            <Toggle on={enabled} onClick={() => setEnabled((v) => !v)} />
          </div>
        }
      >
        {loadError && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
            {loadError}
          </div>
        )}

        <p className="mb-5 text-[12.5px] text-subtext">{t("enabled_hint")}</p>

        {/* Full base system prompt — the bot's entire instruction set. The
            {{role}} / {{lang}} / {{kb}} placeholders are filled in by the server;
            blank falls back to the built-in default. */}
        <FormRow label={t("system_prompt")} hint={t("system_prompt_hint")}>
          <textarea
            className={`${fInput} min-h-[300px] resize-y font-mono text-[12px] leading-relaxed`}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={t("system_prompt_ph")}
          />
        </FormRow>

        {/* Additional instructions — appended AFTER the base prompt above. */}
        <FormRow label={t("prompt")} hint={t("prompt_hint")}>
          <textarea
            className={`${fInput} min-h-[120px] resize-y`}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={t("prompt_ph")}
          />
        </FormRow>

        {/* Read-only engine summary — configured in Settings → AI Server. */}
        <FormRow label={t("engine")} hint={t("engine_hint")} className="mb-0">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <span className="text-[13px] font-semibold text-text" style={{ direction: "ltr" }}>
              {engineLabel}
            </span>
            <Link
              href="/settings/ai-server"
              className="whitespace-nowrap text-[12.5px] font-semibold text-primary hover:underline"
            >
              {t("configure")}
            </Link>
          </div>
        </FormRow>

        <div className="mt-6 flex items-center gap-3">
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
      </Card>
    </div>
  );
}
