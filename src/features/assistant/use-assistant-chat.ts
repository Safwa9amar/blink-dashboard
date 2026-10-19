"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAssistantThread,
  deleteAssistantThread,
  getAssistantBases,
  getAssistantConfig,
  getAssistantMessages,
  listAssistantThreads,
  renameAssistantThread,
} from "@/app/d/assistant/action";
import { createClient } from "@/lib/supabase/client";
import { AssistantStreamError, streamAssistantChat } from "./stream";
import { useAssistantStore } from "./store";
import type {
  AssistantConfig,
  AssistantErrorCode,
  AssistantThread,
  ChatMessage,
  PersistedMessage,
  StreamEvent,
  ToolRun,
} from "./types";

export const MAX_MESSAGE_LENGTH = 4000;

export type ConfigState =
  | { state: "loading" }
  | { state: "unavailable" }
  | { state: "ready"; config: AssistantConfig };

export interface ChatError {
  code: AssistantErrorCode;
  /** The user text that failed, for Retry. */
  text: string;
}

let seq = 0;
const localId = (p: string) => `${p}-${Date.now()}-${seq++}`;

function fromPersisted(m: PersistedMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    tools: (m.tools ?? []).map<ToolRun>((t) => ({
      name: t.name,
      title: t.title,
      status: t.ok ? "done" : "error",
      rowCount: t.row_count,
    })),
  };
}

function applyEvent(msg: ChatMessage, ev: StreamEvent): ChatMessage {
  if (ev.type === "delta") return { ...msg, content: msg.content + ev.text };
  if (ev.type === "tool") {
    const status: ToolRun["status"] = ev.status === "start" ? "running" : ev.status;
    const run: ToolRun = { id: ev.id, name: ev.name, title: ev.title, status, rowCount: ev.rowCount };
    const i = msg.tools.findIndex((t) => t.id === ev.id);
    const tools = i === -1 ? [...msg.tools, run] : msg.tools.map((t, j) => (j === i ? { ...t, ...run } : t));
    return { ...msg, tools };
  }
  return msg;
}

export function useAssistantChat(locale: string) {
  const threadId = useAssistantStore((s) => s.threadId);
  const setThreadId = useAssistantStore((s) => s.setThreadId);
  const open = useAssistantStore((s) => s.open);

  const [configState, setConfigState] = useState<ConfigState>({ state: "loading" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [threads, setThreads] = useState<AssistantThread[] | null>(null);
  const [threadsError, setThreadsError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const basesRef = useRef<string[] | null>(null);
  const loadedFor = useRef<string | null>(null);
  const openRef = useRef(open);
  const streamingRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
    streamingRef.current = streaming;
  }, [open, streaming]);

  const loadConfig = useCallback(async () => {
    setConfigState({ state: "loading" });
    const r = await getAssistantConfig().catch(() => null);
    if (r && r.error === null && r.data) setConfigState({ state: "ready", config: r.data });
    else setConfigState({ state: "unavailable" });
  }, []);

  useEffect(() => {
    useAssistantStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void loadConfig();
    return () => abortRef.current?.abort();
  }, [loadConfig]);

  const refreshThreads = useCallback(async () => {
    const r = await listAssistantThreads().catch(() => null);
    if (r && r.error === null) {
      setThreads(r.data);
      setThreadsError(false);
    } else setThreadsError(true);
  }, []);

  // Load the remembered / selected thread's messages when the panel is open.
  useEffect(() => {
    if (!open || !threadId || loadedFor.current === threadId || streamingRef.current) return;
    loadedFor.current = threadId;
    let cancelled = false;
    setLoadingMessages(true);
    getAssistantMessages(threadId)
      .catch(() => null)
      .then((r) => {
        if (cancelled) {
          if (loadedFor.current === threadId) loadedFor.current = null;
          return;
        }
        setLoadingMessages(false);
        if (r && r.error === null) setMessages(r.data.map(fromPersisted));
        else if (r?.status === 404) {
          setThreadId(null);
          setMessages([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, threadId, setThreadId]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!text || streaming) return;
      setError(null);
      const userMsg: ChatMessage = { id: localId("u"), role: "user", content: text, tools: [] };
      const asstId = localId("a");
      setMessages((m) => [...m, userMsg, { id: asstId, role: "assistant", content: "", tools: [], streaming: true }]);
      setStreaming(true);

      const fail = (code: AssistantErrorCode) => {
        setError({ code, text });
        setMessages((m) => m.flatMap((x) => (x.id === asstId && !x.content && x.tools.length === 0 ? [] : [x.id === asstId ? { ...x, streaming: false } : x])));
      };

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        let id = useAssistantStore.getState().threadId;
        if (!id) {
          const t = await createAssistantThread(text.slice(0, 60));
          if (t.error !== null) {
            fail(t.status === 403 ? "disabled" : "unavailable");
            return;
          }
          id = t.data.id;
          loadedFor.current = id; // messages are already local
          setThreadId(id);
        }
        if (!basesRef.current) {
          const b = await getAssistantBases();
          if (b.error !== null) {
            fail("unavailable");
            return;
          }
          basesRef.current = b.data;
        }
        const {
          data: { session },
        } = await createClient().auth.getSession();
        if (!session?.access_token) {
          fail("unavailable");
          return;
        }

        let sawError: AssistantErrorCode | null = null;
        await streamAssistantChat({
          bases: basesRef.current,
          token: session.access_token,
          threadId: id,
          message: text,
          locale,
          signal: ctrl.signal,
          onEvent: (ev) => {
            if (ev.type === "error") sawError = ev.code;
            else setMessages((m) => m.map((x) => (x.id === asstId ? applyEvent(x, ev) : x)));
          },
        });
        if (sawError) fail(sawError);
        else setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, streaming: false } : x)));
        if (!openRef.current) useAssistantStore.getState().setUnread(true);
      } catch (e) {
        if (ctrl.signal.aborted) {
          // Stopped by the user: keep whatever streamed so far.
          setMessages((m) => m.flatMap((x) => (x.id === asstId ? (x.content || x.tools.length ? [{ ...x, streaming: false }] : []) : [x])));
        } else {
          fail(e instanceof AssistantStreamError ? e.code : "provider_error");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        void refreshThreads();
      }
    },
    [streaming, locale, setThreadId, refreshThreads]
  );

  const retry = useCallback(() => {
    if (!error) return;
    const { text } = error;
    // Drop the failed turn's user bubble so Retry doesn't show it twice.
    setMessages((m) => {
      const last = m[m.length - 1];
      return last?.role === "user" && last.content === text ? m.slice(0, -1) : m;
    });
    setError(null);
    void send(text);
  }, [error, send]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    loadedFor.current = null;
    setThreadId(null);
    setMessages([]);
    setError(null);
    useAssistantStore.getState().setHistoryOpen(false);
  }, [setThreadId]);

  const openThread = useCallback(
    (id: string) => {
      if (id !== useAssistantStore.getState().threadId) {
        abortRef.current?.abort();
        loadedFor.current = null;
        setMessages([]);
        setError(null);
        setThreadId(id);
      }
      useAssistantStore.getState().setHistoryOpen(false);
    },
    [setThreadId]
  );

  const renameThread = useCallback(async (id: string, title: string) => {
    const r = await renameAssistantThread(id, title).catch(() => null);
    if (r && r.error === null) setThreads((ts) => ts?.map((t) => (t.id === id ? r.data : t)) ?? ts);
    return !!r && r.error === null;
  }, []);

  const removeThread = useCallback(
    async (id: string) => {
      const r = await deleteAssistantThread(id).catch(() => null);
      if (!r || r.error !== null) return false;
      setThreads((ts) => ts?.filter((t) => t.id !== id) ?? ts);
      if (useAssistantStore.getState().threadId === id) newChat();
      return true;
    },
    [newChat]
  );

  return {
    configState,
    reloadConfig: loadConfig,
    messages,
    streaming,
    loadingMessages,
    error,
    threads,
    threadsError,
    refreshThreads,
    send,
    stop,
    retry,
    newChat,
    openThread,
    renameThread,
    removeThread,
    hasThread: !!threadId,
  };
}

export type AssistantChat = ReturnType<typeof useAssistantChat>;
