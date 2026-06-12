"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { DashIcon } from "./icons";
import { fInput } from "./primitives";
import type { AIStreamChunk } from "./ai-generate";

interface AIGenerateModalProps<TResult> {
  open: boolean;
  onClose: () => void;
  /** Modal heading. */
  title: string;
  /** Sub-heading under the prompt. */
  description?: string;
  placeholder?: string;
  /** Generate button label. */
  buttonLabel: string;
  /** Apply (commit result to the form) button label. */
  applyLabel: string;
  stopLabel?: string;
  regenerateLabel?: string;
  reasoningLabel?: string;
  draftingLabel?: string;
  /**
   * Runs the generation. Report streamed tokens for the live view, pass `signal`
   * to the request so Stop aborts it, and resolve with the parsed result.
   */
  onGenerate: (
    prompt: string,
    report: (chunk: AIStreamChunk) => void,
    signal: AbortSignal
  ) => Promise<TResult>;
  /** Renders a preview of the finished result for review before applying. */
  renderResult: (result: TResult) => ReactNode;
  /** Commits the reviewed result (e.g. fills the form). The modal then closes. */
  onApply: (result: TResult) => void;
  dir?: "ltr" | "rtl";
}

// A modal "describe it → watch it generate → review → apply" flow for any
// streaming generator. Unlike <AIGenerate> (which fills the form as it resolves),
// this holds the result so the operator reviews it and explicitly applies or
// regenerates. Generic over the parsed result type.
export function AIGenerateModal<TResult>({
  open,
  onClose,
  title,
  description,
  placeholder,
  buttonLabel,
  applyLabel,
  stopLabel = "Stop generating",
  regenerateLabel,
  reasoningLabel = "Thinking…",
  draftingLabel = "Writing draft…",
  onGenerate,
  renderResult,
  onApply,
  dir = "ltr",
}: AIGenerateModalProps<TResult>) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<TResult | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    setResult(null);
    setLoading(true);
    try {
      const r = await onGenerate(
        value,
        (chunk) => {
          if (chunk.reasoning) setReasoning((s) => s + chunk.reasoning);
          if (chunk.content) setContent((s) => s + chunk.content);
        },
        controller.signal
      );
      setResult(r);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function close() {
    abortRef.current?.abort();
    setPrompt("");
    setReasoning("");
    setContent("");
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  }

  function apply() {
    if (result === null) return;
    onApply(result);
    close();
  }

  const showStream = loading || (!result && (!!reasoning || !!content));

  return (
    <Modal open={open} onClose={close} title={title} widthClassName="max-w-2xl">
      <textarea
        className={`${fInput} min-h-[90px] resize-y`}
        dir={dir}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void run();
          }
        }}
      />
      {description && <p className="mt-2 text-xs text-subtext">{description}</p>}

      {showStream && (
        <div
          ref={streamRef}
          className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border bg-background p-3 space-y-2"
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
          {loading && !reasoning && !content && <p className="text-xs text-subtext">{draftingLabel}</p>}
        </div>
      )}

      {result !== null && !loading && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-border bg-background p-3">
          {renderResult(result)}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        {loading ? (
          <Button icon="x" variant="secondary" onClick={() => abortRef.current?.abort()} className="flex-1">
            {stopLabel}
          </Button>
        ) : result !== null ? (
          <>
            <Button icon="sparkles" variant="secondary" onClick={run} className="flex-1">
              {regenerateLabel ?? buttonLabel}
            </Button>
            <Button onClick={apply} className="flex-1">
              {applyLabel}
            </Button>
          </>
        ) : (
          <Button icon="sparkles" onClick={run} disabled={!prompt.trim()} className="w-full">
            {buttonLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
}
