#!/usr/bin/env node

/**
 * lm-gen — Local LLM code generator using LM Studio.
 *
 * Uses your local LM Studio server as parallel "subagents" to generate
 * boilerplate code (pages, components, locales, mock data, sections).
 *
 * Usage:
 *   node scripts/lm-gen.mjs <command> [options]
 *
 * Commands:
 *   ask       "<prompt>"                    — Single prompt, prints response
 *   page      <route-name>                 — Generate a full dashboard page triad
 *   section   <name> "<description>"       — Generate a Card section (JSX fragment)
 *   sections  <name1> "<desc1>" ...        — Generate multiple sections in parallel
 *   component <name> "<description>"       — Generate a single component
 *   locales   <namespace> [keys...]        — Generate locale files with custom keys
 *   mock      <name> "<description>"       — Generate mock data array
 *   parallel  "<prompt1>" "<prompt2>" ...  — Run N prompts in parallel
 *   chat      "<prompt>"                   — Multi-turn conversation mode
 *   models                                 — List available models
 *   health                                 — Check server status
 *
 * Environment:
 *   LM_HOST   — LM Studio server URL  (default: http://172.27.37.94:1234)
 *   LM_MODEL  — Model ID              (default: gemma4-coding-agent)
 *   LM_TEMP   — Temperature           (default: 0.3)
 *   LM_TOKENS — Max tokens            (default: 2000)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { createInterface } from "node:readline";

const LM_HOST = process.env.LM_HOST || "http://172.27.37.94:1234";
const LM_MODEL = process.env.LM_MODEL || "gemma4-coding-agent";
const LM_TEMP = parseFloat(process.env.LM_TEMP || "0.3");
const LM_TOKENS = parseInt(process.env.LM_TOKENS || "2000");
const API = `${LM_HOST}/v1/chat/completions`;

const SYSTEM_PROMPT = `You are a senior React/Next.js developer for the Blink dashboard. Rules:
- Output ONLY raw TypeScript/TSX code. No markdown fences, no explanations.
- Use "className" not "class" for JSX.
- Use RTL-safe Tailwind: me-/ms-/ps-/pe-/start/end instead of ml-/mr-/pl-/pr-/left/right.
- Use gap-N instead of space-x-N for flex containers (RTL safe).
- Import UI components from "@/components/ui" (barrel), never deep paths.
- Available UI: PageHeader, Card, Badge, StatCard, StatGrid, DataTable, Column, SearchBox, Toolbar, FilterPills, Button, Toggle, Modal, EmptyState, Avatar, Segmented, SubTabs.
- Badge variants: "success" | "danger" | "warning" | "info".
- StatCard props: label (string), value (string|number), icon (string).
- Card props: title? (string), children.
- Design tokens: text-text, text-subtext, bg-card, bg-card-hover, border-border, bg-muted, bg-primary, text-primary.
- "use client" only when the component uses hooks.
- Default export, PascalCase component names.
- Extract data arrays as typed constants above the component.`;

const SECTION_PROMPT = `You are a React/TSX expert. Output ONLY a raw JSX fragment (no imports, no component wrapper, no markdown fences).
- Use className not class.
- Use RTL-safe classes: me-/ms-/gap- instead of mr-/ml-/space-x-.
- Design tokens: text-text, text-subtext, bg-card, bg-card-hover, border-border, bg-muted, bg-primary.
- Card and Badge components are already imported and available.
- Card accepts: title? (string), children. Badge accepts: variant ("success"|"danger"|"warning"|"info"), children.`;

const JSON_PROMPT = `Output ONLY valid JSON. No markdown fences, no explanation, no comments.`;

// ─── Timing helper ──────────────────────────────────────────────────────────

function timer() {
  const start = performance.now();
  return () => ((performance.now() - start) / 1000).toFixed(1) + "s";
}

// ─── Core API call ──────────────────────────────────────────────────────────

async function ask(prompt, { system = SYSTEM_PROMPT, maxTokens = LM_TOKENS, temperature = LM_TEMP, messages } = {}) {
  const elapsed = timer();
  const body = {
    model: LM_MODEL,
    messages: messages || [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature,
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LM Studio error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage ?? {};
  const finish = data.choices?.[0]?.finish_reason;
  return { content, usage, finish, time: elapsed() };
}

// Run N prompts in parallel
async function parallel(prompts, opts) {
  const results = await Promise.allSettled(prompts.map((p) =>
    typeof p === "string" ? ask(p, opts) : ask(p.prompt, { ...opts, ...p.opts })
  ));
  return results.map((r) => (r.status === "fulfilled" ? r.value : { content: "", error: r.reason.message }));
}

// ─── Post-processing ────────────────────────────────────────────────────────

function cleanCode(code) {
  // Strip markdown fences if Gemma wraps them anyway
  code = code.replace(/^```(?:tsx?|jsx?|typescript|javascript)?\n/gm, "").replace(/\n```$/gm, "");
  // Fix common Gemma mistakes
  code = code.replace(/\bclass=/g, "className=");
  code = code.replace(/\bspace-x-/g, "gap-");
  code = code.replace(/\bmr-/g, "me-");
  code = code.replace(/\bml-/g, "ms-");
  code = code.replace(/\bpr-/g, "pe-");
  code = code.replace(/\bpl-/g, "ps-");
  return code.trim();
}

function cleanJson(text) {
  // Extract JSON from potential markdown wrapping
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

// ─── Code generators ────────────────────────────────────────────────────────

function pagePrompt(name, description) {
  const pascal = name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  const camel = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const desc = description || `Manage and monitor ${name.replace(/-/g, " ")}`;
  return {
    page: `Generate a Next.js App Router page.tsx (server component) for a dashboard route "${name}".
Follow this EXACT pattern — output only this code, nothing else:

import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("${camel}");
}

export default function Page() {
  return <Client />;
}`,

    client: `Generate a "use client" component for a Blink super-app admin dashboard page called "${pascal}".
Import { useState } from "react".
Import { useTranslations } from "next-intl" with namespace "${camel}".
Import { PageHeader, Card, Badge, StatCard, StatGrid } from "@/components/ui".

The page is about: ${desc}

Include:
1. A PageHeader using t("title") and t("description")
2. A StatGrid with 4 relevant StatCards with mock data and icons
3. A Card with title showing a relevant data list (6-8 items with Badges)
4. A second Card with a different visualization (grid of items, progress bars, or key-value pairs)

Name the component ${pascal}Client. Export default.
Extract all mock data as typed constants above the component.
Output ONLY the TSX code.`,

    locales_en: `Generate a JSON locale file for an English dashboard page called "${camel}".
The page is about: ${desc}
Format: { "${camel}": { "title": "...", "description": "..." } }
The title should be a proper English title. Description should be one sentence.
Output ONLY valid JSON.`,

    locales_fr: `Translate this to French. Output ONLY valid JSON:
{ "${camel}": { "title": "[French title for ${name}]", "description": "[French: ${desc}]" } }`,

    locales_ar: `Translate this to Arabic. Output ONLY valid JSON:
{ "${camel}": { "title": "[Arabic title for ${name}]", "description": "[Arabic: ${desc}]" } }`,
  };
}

// ─── File helpers ───────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeFile(path, content) {
  writeFileSync(path, content, "utf-8");
  console.log(`  ✓ ${path}`);
}

function printStats(results) {
  const totalTokens = results.reduce((s, r) => s + (r.usage?.total_tokens || 0), 0);
  const avgTime = results.reduce((s, r) => s + parseFloat(r.time || "0"), 0) / results.length;
  const errors = results.filter((r) => r.error).length;
  const truncated = results.filter((r) => r.finish === "length").length;
  console.log(`\n  Tokens: ${totalTokens} (local, free) | Avg time: ${avgTime.toFixed(1)}s | Errors: ${errors} | Truncated: ${truncated}`);
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const [, , cmd, ...args] = process.argv;

function usage() {
  console.log(`
lm-gen — Local LLM code generator (LM Studio)

Commands:
  ask       "<prompt>"                    Single prompt → stdout
  page      <route-name> ["description"]  Full dashboard page (page+client+locales)
  section   <name> "<description>"       Generate a Card section JSX fragment
  sections  "<desc1>" "<desc2>" ...      Multiple sections in parallel
  component <name> "<description>"       Single component → stdout
  mock      <name> "<description>"       Generate typed mock data array
  locales   <namespace> [keys...]        Locale JSON files (en/fr/ar)
  parallel  "<p1>" "<p2>" ...            Run N prompts in parallel
  chat                                   Interactive multi-turn chat
  models                                 List available models
  health                                 Check server connectivity

Config (env vars):
  LM_HOST   = ${LM_HOST}
  LM_MODEL  = ${LM_MODEL}
  LM_TEMP   = ${LM_TEMP}
  LM_TOKENS = ${LM_TOKENS}
`);
}

async function main() {
  if (!cmd) { usage(); process.exit(0); }

  switch (cmd) {
    // ── ask ──────────────────────────────────────────────────────────────
    case "ask": {
      const prompt = args.join(" ");
      if (!prompt) { console.error("Usage: lm-gen ask \"<prompt>\""); process.exit(1); }
      console.log(`→ Asking ${LM_MODEL}...\n`);
      const result = await ask(prompt);
      console.log(cleanCode(result.content));
      console.log(`\n[${result.usage.total_tokens} tokens | ${result.time}]`);
      break;
    }

    // ── models ──────────────────────────────────────────────────────────
    case "models": {
      const res = await fetch(`${LM_HOST}/v1/models`);
      const data = await res.json();
      console.log("Available models:");
      for (const m of data.data) {
        const active = m.id === LM_MODEL ? " ← active" : "";
        console.log(`  - ${m.id}${active}`);
      }
      break;
    }

    // ── health ──────────────────────────────────────────────────────────
    case "health": {
      console.log(`→ Checking ${LM_HOST}...`);
      try {
        const elapsed = timer();
        const res = await fetch(`${LM_HOST}/v1/models`);
        const data = await res.json();
        console.log(`  ✓ Server online (${elapsed()})`);
        console.log(`  Models: ${data.data.length}`);
        // Quick inference test
        const test = await ask("Say OK", { maxTokens: 10, system: "Reply with just OK." });
        console.log(`  ✓ Inference working: "${test.content.trim()}" (${test.time})`);
      } catch (e) {
        console.error(`  ✗ Server unreachable: ${e.message}`);
        process.exit(1);
      }
      break;
    }

    // ── parallel ────────────────────────────────────────────────────────
    case "parallel": {
      if (args.length < 2) { console.error("Usage: lm-gen parallel \"<p1>\" \"<p2>\" ..."); process.exit(1); }
      console.log(`→ Running ${args.length} prompts in parallel on ${LM_MODEL}...\n`);
      const results = await parallel(args);
      results.forEach((r, i) => {
        console.log(`━━━ Result ${i + 1} ━━━`);
        console.log(r.error ? `ERROR: ${r.error}` : cleanCode(r.content));
        if (r.usage) console.log(`[${r.usage.total_tokens} tokens | ${r.time}]`);
        console.log();
      });
      printStats(results);
      break;
    }

    // ── section ─────────────────────────────────────────────────────────
    case "section": {
      const name = args[0];
      const desc = args.slice(1).join(" ");
      if (!name || !desc) { console.error("Usage: lm-gen section <name> \"<description>\""); process.exit(1); }
      console.log(`→ Generating section "${name}"...\n`);
      const result = await ask(desc, { system: SECTION_PROMPT, maxTokens: 1500 });
      console.log(cleanCode(result.content));
      console.log(`\n[${result.usage.total_tokens} tokens | ${result.time}]`);
      break;
    }

    // ── sections (parallel) ─────────────────────────────────────────────
    case "sections": {
      if (args.length < 2) { console.error("Usage: lm-gen sections \"<desc1>\" \"<desc2>\" ..."); process.exit(1); }
      console.log(`→ Generating ${args.length} sections in parallel...\n`);
      const results = await parallel(args, { system: SECTION_PROMPT, maxTokens: 1500 });
      results.forEach((r, i) => {
        console.log(`━━━ Section ${i + 1} ━━━`);
        console.log(r.error ? `ERROR: ${r.error}` : cleanCode(r.content));
        console.log();
      });
      printStats(results);
      break;
    }

    // ── page ────────────────────────────────────────────────────────────
    case "page": {
      const name = args[0];
      const description = args.slice(1).join(" ") || undefined;
      if (!name) { console.error("Usage: lm-gen page <route-name> [\"description\"]"); process.exit(1); }

      const root = join(process.cwd(), "src/app/d", name);
      const locDir = join(root, "locales");

      if (existsSync(root)) {
        console.error(`Error: ${root} already exists. Delete it first or use a different name.`);
        process.exit(1);
      }

      const prompts = pagePrompt(name, description);
      console.log(`→ Generating page "${name}" with 5 parallel subagents...\n`);
      const elapsed = timer();

      const results = await parallel(
        [prompts.page, prompts.client, prompts.locales_en, prompts.locales_fr, prompts.locales_ar],
        { maxTokens: 3000 }
      );

      const [pageRes, clientRes, enRes, frRes, arRes] = results;

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length) {
        console.error("Some subagents failed:");
        errors.forEach((e) => console.error(`  - ${e.error}`));
        process.exit(1);
      }

      // Warn about truncation
      results.forEach((r, i) => {
        if (r.finish === "length") {
          const names = ["page.tsx", "client.tsx", "en.json", "fr.json", "ar.json"];
          console.warn(`  ⚠ ${names[i]} was truncated — may need manual completion`);
        }
      });

      // Write files with auto-cleanup
      ensureDir(locDir);
      writeFile(join(root, "page.tsx"), cleanCode(pageRes.content) + "\n");
      writeFile(join(root, "client.tsx"), cleanCode(clientRes.content) + "\n");
      writeFile(join(locDir, "en.json"), cleanJson(enRes.content) + "\n");
      writeFile(join(locDir, "fr.json"), cleanJson(frRes.content) + "\n");
      writeFile(join(locDir, "ar.json"), cleanJson(arRes.content) + "\n");

      printStats(results);
      console.log(`  Total time: ${elapsed()}`);
      console.log(`\n✓ Page "${name}" generated (0 Claude tokens spent)`);
      console.log(`\nNext steps:`);
      console.log(`  1. Review & fix the generated code (check imports, prop names)`);
      console.log(`  2. Register locales in src/i18n/messages.ts`);
      console.log(`  3. Add nav entry in src/components/sidebar.tsx (if needed)`);
      break;
    }

    // ── component ───────────────────────────────────────────────────────
    case "component": {
      const name = args[0];
      const desc = args.slice(1).join(" ");
      if (!name || !desc) { console.error("Usage: lm-gen component <name> \"<description>\""); process.exit(1); }

      console.log(`→ Generating component "${name}"...\n`);
      const result = await ask(
        `Generate a React component called "${name}". Description: ${desc}. Use TypeScript, Tailwind, and import from "@/components/ui" as needed. Extract data as typed constants above the component.`
      );
      console.log(cleanCode(result.content));
      console.log(`\n[${result.usage.total_tokens} tokens | ${result.time}]`);
      break;
    }

    // ── mock ────────────────────────────────────────────────────────────
    case "mock": {
      const name = args[0];
      const desc = args.slice(1).join(" ");
      if (!name || !desc) { console.error("Usage: lm-gen mock <name> \"<description>\""); process.exit(1); }

      console.log(`→ Generating mock data "${name}"...\n`);
      const result = await ask(
        `Generate a TypeScript typed mock data array called MOCK_${name.toUpperCase().replace(/-/g, "_")}. Description: ${desc}. Include a type definition above the array. Use realistic data for an Algerian delivery super-app (DZD currency, Algerian cities, Arabic/French names). Generate 8-10 items. Output ONLY the TypeScript code.`
      );
      console.log(cleanCode(result.content));
      console.log(`\n[${result.usage.total_tokens} tokens | ${result.time}]`);
      break;
    }

    // ── locales ─────────────────────────────────────────────────────────
    case "locales": {
      const ns = args[0];
      if (!ns) { console.error("Usage: lm-gen locales <namespace> [key1 key2 ...]"); process.exit(1); }

      const keys = args.slice(1);
      const keysHint = keys.length
        ? `Include these keys: ${keys.join(", ")}.`
        : `Include keys: title, description, and 4-6 other relevant keys.`;

      console.log(`→ Generating locales for "${ns}" in parallel...\n`);
      const results = await parallel([
        `Generate English locale JSON for namespace "${ns}" in a delivery super-app dashboard. ${keysHint} Format: { "${ns}": { ... } }. Output ONLY valid JSON.`,
        `Generate French locale JSON for namespace "${ns}" in a delivery super-app dashboard. ${keysHint} Format: { "${ns}": { ... } }. Output ONLY valid JSON.`,
        `Generate Arabic locale JSON for namespace "${ns}" in a delivery super-app dashboard. ${keysHint} Format: { "${ns}": { ... } }. Output ONLY valid JSON.`,
      ], { system: JSON_PROMPT });

      console.log("─── en.json ───");
      console.log(cleanJson(results[0].content));
      console.log("\n─── fr.json ───");
      console.log(cleanJson(results[1].content));
      console.log("\n─── ar.json ───");
      console.log(cleanJson(results[2].content));
      printStats(results);
      break;
    }

    // ── chat ────────────────────────────────────────────────────────────
    case "chat": {
      console.log(`→ Chat mode with ${LM_MODEL} (type "exit" to quit)\n`);
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const history = [{ role: "system", content: SYSTEM_PROMPT }];

      const prompt = () => {
        rl.question("you> ", async (input) => {
          input = input.trim();
          if (!input || input === "exit") { rl.close(); return; }
          history.push({ role: "user", content: input });
          try {
            const result = await ask("", { messages: history });
            history.push({ role: "assistant", content: result.content });
            console.log(`\n${cleanCode(result.content)}`);
            console.log(`[${result.usage.total_tokens} tokens | ${result.time}]\n`);
          } catch (e) {
            console.error(`Error: ${e.message}\n`);
          }
          prompt();
        });
      };
      prompt();
      return; // Don't exit main — readline keeps process alive
    }

    default:
      console.error(`Unknown command: ${cmd}`);
      usage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
