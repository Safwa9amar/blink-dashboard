"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card } from "./card";
import { Button } from "./button";
import { DashIcon } from "./icons";
import { fInput } from "./primitives";

// Incremental tokens reported during streaming generation.
export interface AIStreamChunk {
  content?: string;
  reasoning?: string;
}

interface AIGenerateProps {
  /** Card heading, e.g. "Generate with AI". */
  title: string;
  /** Sub-heading under the title. */
  description?: string;
  /** Prompt textarea placeholder. */
  placeholder?: string;
  /** Generate button label. */
  buttonLabel: string;
  /**
   * Performs the generation. Call `report` with streamed tokens to show them live;
   * pass `signal` to the underlying request so Stop can abort it; resolve when the
   * form has been filled. Throw to surface an error.
   */
  onGenerate: (
    prompt: string,
    report: (chunk: AIStreamChunk) => void,
    signal: AbortSignal
  ) => Promise<void>;
  /** Header shown above the live reasoning ("thinking") stream. */
  reasoningLabel?: string;
  /** Header shown above the live draft (content) stream. */
  draftingLabel?: string;
  /** Button label while generating (click to abort). Defaults to "Stop". */
  stopLabel?: string;
  /** Button label once a result exists (re-run). Defaults to buttonLabel. */
  regenerateLabel?: string;
  /** Optional extra controls (selects, toggles) rendered above the action row. */
  children?: ReactNode;
  /** Text direction for the prompt input (default "ltr"). */
  dir?: "ltr" | "rtl";
  /** Disable the whole panel (e.g. while the parent is busy). */
  disabled?: boolean;
  className?: string;
}

// Reusable "describe it, generate it" card for any LM Studio-backed feature.
// Owns its prompt/loading/error state and renders the live token stream (a
// reasoning model's thinking + the draft). The parent supplies `onGenerate`,
// reports streamed chunks via the callback, and applies the final result.
export function AIGenerate({
  title,
  description,
  placeholder,
  buttonLabel,
  onGenerate,
  reasoningLabel = "Thinking…",
  draftingLabel = "Writing draft…",
  stopLabel = "Stop",
  regenerateLabel,
  children,
  dir = "ltr",
  disabled = false,
  className = "",
}: AIGenerateProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [content, setContent] = useState("");
  const [mounted, setMounted] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Render client-only. This card is purely interactive (textarea + button), and
  // browser extensions (Grammarly, autofill, translators) routinely mutate
  // textareas before React hydrates — shifting the tree and causing hydration
  // mismatches. Deferring to after mount sidesteps SSR entirely.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client-only mount gate
    setMounted(true);
  }, []);

  // Keep the live stream scrolled to the newest tokens.
  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [reasoning, content]);

  async function run() {
    const value = prompt.trim();
    if (!value || loading) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setReasoning("");
    setContent("");
    setLoading(true);
    try {
      await onGenerate(
        value,
        (chunk) => {
          if (chunk.reasoning) setReasoning((r) => r + chunk.reasoning);
          if (chunk.content) setContent((c) => c + chunk.content);
        },
        controller.signal
      );
    } catch (e) {
      // A user-initiated Stop isn't an error — leave the partial stream visible.
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  const action = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
      <DashIcon name="sparkles" className="h-3.5 w-3.5" />
      AI
    </span>
  );

  const showStream = loading || !!reasoning || !!content;

  if (!mounted) return null;

  return (
    <Card title={title} description={description} action={action} className={className}>
      <textarea
        className={`${fInput} min-h-[84px] resize-y`}
        dir={dir}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        onKeyDown={(e) => {
          // ⌘/Ctrl + Enter generates without leaving the textarea.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void run();
          }
        }}
      />
      {children}

      {showStream && (
        <div
          ref={streamRef}
          className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-border bg-background p-3 space-y-2"
        >
          {reasoning && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-subtext">
                <DashIcon name="sparkles" className="h-3 w-3 animate-pulse" />
                {reasoningLabel}
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-subtext">
                {reasoning}
              </pre>
            </div>
          )}
          {content && (
            <div>
              {reasoning && (
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-subtext">
                  {draftingLabel}
                </div>
              )}
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-text">
                {content}
              </pre>
            </div>
          )}
          {loading && !reasoning && !content && (
            <p className="text-xs text-subtext">{draftingLabel}</p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {loading ? (
        <Button icon="x" variant="secondary" onClick={stop} className="mt-3 w-full">
          {stopLabel}
        </Button>
      ) : (
        <Button
          icon="sparkles"
          onClick={run}
          disabled={disabled || !prompt.trim()}
          className="mt-3 w-full"
        >
          {reasoning || content ? regenerateLabel ?? buttonLabel : buttonLabel}
        </Button>
      )}
    </Card>
  );
}
