// Pure JSON-extraction helper — no network/server deps, so it's safe to import
// from client components (e.g. to parse streamed draft content in the browser).

import { AIError } from "./types";

// Parses a JSON object out of a model's raw text: strips reasoning `<think>…</think>`
// blocks and code fences, then takes the outermost { … }.
export function parseDraftJSON<T>(text: string): T {
  const stripped = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "") // drop chain-of-thought
    .replace(/```(?:json)?/gi, "")
    .trim();
  // Fall back to the outermost { … } if the model wrapped JSON in prose.
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  const candidate = start !== -1 && end > start ? stripped.slice(start, end + 1) : stripped;
  try {
    return JSON.parse(candidate) as T;
  } catch (cause) {
    throw new AIError("Couldn't parse the model's JSON output.", { cause });
  }
}
