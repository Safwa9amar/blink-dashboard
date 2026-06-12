import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PROVIDERS, type Provider } from "@/lib/ai/providers";

// Operator-tunable AI generation settings, set from Settings → AI and persisted to
// localStorage. The compose form reads these and forwards them (provider + base URL
// + model + sampling) to the generation route on each run, so the admin can switch
// between LM Studio and Ollama and pick a model without a redeploy.
export interface AISettingsState {
  provider: Provider; // "lmstudio" | "ollama"
  lmstudioUrl: string;
  ollamaUrl: string;
  model: string; // "" = auto-detect the first available model
  temperature: number; // 0–1
  maxTokens: number; // -1 = unlimited
  contextLength: number; // 0 = model default (LM Studio load only)
  ttl: number; // idle seconds before auto-unload; 0 = no TTL
  setProvider: (v: Provider) => void;
  setBaseUrl: (v: string) => void; // sets the URL for the active provider
  setModel: (v: string) => void;
  setTemperature: (v: number) => void;
  setMaxTokens: (v: number) => void;
  setContextLength: (v: number) => void;
  setTtl: (v: number) => void;
}

export const DEFAULT_AI_SETTINGS = {
  provider: "lmstudio" as Provider,
  lmstudioUrl: PROVIDERS.lmstudio.defaultBaseUrl,
  ollamaUrl: PROVIDERS.ollama.defaultBaseUrl,
  model: "",
  temperature: 0.7,
  maxTokens: -1,
  contextLength: 0,
  ttl: 0,
};

// The base URL of whichever provider is active.
export function activeBaseUrl(s: Pick<AISettingsState, "provider" | "lmstudioUrl" | "ollamaUrl">) {
  return s.provider === "ollama" ? s.ollamaUrl : s.lmstudioUrl;
}

const clampTemp = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.7));
const intOr = (v: number, fallback: number) => (Number.isFinite(v) ? Math.floor(v) : fallback);

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_AI_SETTINGS,
      // Switching provider clears the model — ids don't carry across providers.
      setProvider: (v) => set({ provider: v, model: "" }),
      setBaseUrl: (v) =>
        set((s) => (s.provider === "ollama" ? { ollamaUrl: v } : { lmstudioUrl: v })),
      setModel: (v) => set({ model: v }),
      setTemperature: (v) => set({ temperature: clampTemp(v) }),
      setMaxTokens: (v) => set({ maxTokens: Math.max(-1, intOr(v, -1)) }),
      setContextLength: (v) => set({ contextLength: Math.max(0, intOr(v, 0)) }),
      setTtl: (v) => set({ ttl: Math.max(0, intOr(v, 0)) }),
    }),
    { name: "blink-ai-settings", version: 2 }
  )
);
