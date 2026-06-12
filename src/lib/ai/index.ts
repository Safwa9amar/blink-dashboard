// Blink dashboard AI library — a thin, server-only client for the local LM Studio
// (OpenAI-compatible) server, plus shared types. Import from "@/lib/ai".
//
// Usage (inside a Server Action):
//   import { chatJSON } from "@/lib/ai";
//   const draft = await chatJSON<MyShape>({ messages, schema });
//
// Pair with the reusable <AIGenerate> card from "@/components/ui" for the UI.

export { chat, chatJSON, chatStream, listModels, loadModel, unloadModel } from "./client";
export { parseDraftJSON } from "./parse";
export { AIError } from "./types";
export type { ChatMessage, ChatRole, ChatOptions, JSONSchemaSpec, LMModel } from "./types";
export { PROVIDERS, PROVIDER_LIST, isProvider, type Provider } from "./providers";
export { AI_BASE_URL } from "./config";
