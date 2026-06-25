import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getAiServerSettings } from "@/app/d/settings/ai-server-data";
import { AiTab } from "@/features/support";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "tab_ai");
}

// Support → AI. Server-fetches the bot's current config from the shared
// `ai_settings` singleton (reusing the AI Server data reader) and hands the
// bot-level fields to the client panel. The active provider/model are passed as
// read-only context — they're edited in Settings → AI Server.
export default async function Page() {
  const { settings, error } = await getAiServerSettings();
  const activeModel = settings.providers[settings.active.provider]?.model ?? null;
  return (
    <AiTab
      initial={{
        bot_enabled: settings.active.bot_enabled,
        system_prompt_extra: settings.active.system_prompt_extra,
        active_provider: settings.active.provider,
        active_model: activeModel,
      }}
      loadError={error}
    />
  );
}
